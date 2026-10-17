"""Regressions for ordered *fictional* stages and strict boundary checks."""
import unittest

from backend.domain.api_validation import InvalidTaskUpdate
from backend.domain.arrival_workflow import (
    ArrivalStage, StageChangeCommand, SyntheticArrivalPlan,
    advance_arrival_stage, validate_stage_change_payload,
)
from backend.domain.task_workflow import (
    ForbiddenTransition, RevisionConflict, TaskNotVisible, TaskStatus,
)


class ArrivalPlanTests(unittest.TestCase):
    def setUp(self):
        self.plan = SyntheticArrivalPlan("plan-demo-1", "fictional-org-a")

    def change(self, plan, stage, status, *, organization="fictional-org-a", version=None):
        return advance_arrival_stage(
            plan,
            caller_organization_id=organization,
            command=StageChangeCommand(stage, status, plan.version if version is None else version),
        )

    def complete_stage(self, plan, stage):
        return self.change(self.change(plan, stage, TaskStatus.IN_PROGRESS), stage, TaskStatus.DONE)

    def test_new_plan_has_three_pending_stages_and_no_io(self):
        self.assertEqual(self.plan.states, (TaskStatus.TODO,) * 3)
        self.assertEqual(self.plan.version, 1)
        self.assertFalse(self.plan.is_complete)

    def test_full_preparation_journey_arrival_flow(self):
        plan = self.plan
        for stage in ArrivalStage:
            plan = self.complete_stage(plan, stage)
        self.assertEqual(plan.version, 7)
        self.assertTrue(plan.is_complete)
        self.assertTrue(all(plan.status_of(stage) is TaskStatus.DONE for stage in ArrivalStage))
        self.assertEqual(self.plan.version, 1)

    def test_cannot_start_journey_before_preparation_done(self):
        with self.assertRaises(ForbiddenTransition):
            self.change(self.plan, ArrivalStage.JOURNEY, TaskStatus.IN_PROGRESS)
        with self.assertRaises(ForbiddenTransition):
            self.change(self.plan, ArrivalStage.JOURNEY, TaskStatus.BLOCKED)

    def test_cannot_start_arrival_before_journey_done(self):
        plan = self.complete_stage(self.plan, ArrivalStage.PREPARATION)
        with self.assertRaises(ForbiddenTransition):
            self.change(plan, ArrivalStage.ARRIVAL, TaskStatus.IN_PROGRESS)

    def test_block_and_resume_preparation_before_completion(self):
        blocked = self.change(self.plan, ArrivalStage.PREPARATION, TaskStatus.BLOCKED)
        active = self.change(blocked, ArrivalStage.PREPARATION, TaskStatus.IN_PROGRESS)
        done = self.change(active, ArrivalStage.PREPARATION, TaskStatus.DONE)
        self.assertEqual(done.states, (TaskStatus.DONE, TaskStatus.TODO, TaskStatus.TODO))
        self.assertEqual(done.version, 4)

    def test_cannot_skip_in_progress_or_complete_from_blocked(self):
        with self.assertRaises(ForbiddenTransition):
            self.change(self.plan, ArrivalStage.PREPARATION, TaskStatus.DONE)
        blocked = self.change(self.plan, ArrivalStage.PREPARATION, TaskStatus.BLOCKED)
        with self.assertRaises(ForbiddenTransition):
            self.change(blocked, ArrivalStage.PREPARATION, TaskStatus.DONE)

    def test_done_stage_is_terminal(self):
        done = self.complete_stage(self.plan, ArrivalStage.PREPARATION)
        with self.assertRaises(ForbiddenTransition):
            self.change(done, ArrivalStage.PREPARATION, TaskStatus.IN_PROGRESS)

    def test_same_state_is_noop_without_revision_bump(self):
        self.assertIs(self.change(self.plan, ArrivalStage.ARRIVAL, TaskStatus.TODO), self.plan)
        with self.assertRaises(RevisionConflict):
            self.change(self.plan, ArrivalStage.ARRIVAL, TaskStatus.TODO, version=2)

    def test_stale_revision_rejected_without_mutation(self):
        changed = self.change(self.plan, ArrivalStage.PREPARATION, TaskStatus.IN_PROGRESS)
        with self.assertRaises(RevisionConflict):
            self.change(changed, ArrivalStage.PREPARATION, TaskStatus.DONE, version=1)
        self.assertEqual(changed.states[0], TaskStatus.IN_PROGRESS)
        self.assertEqual(self.plan.states[0], TaskStatus.TODO)

    def test_wrong_organization_hidden_even_with_stale_version(self):
        with self.assertRaises(TaskNotVisible):
            self.change(self.plan, ArrivalStage.PREPARATION, TaskStatus.IN_PROGRESS,
                        organization="fictional-org-b", version=991)
        self.assertEqual(self.plan.version, 1)

    def test_invalid_plan_snapshots_rejected(self):
        invalid = (
            {"plan_id": ""}, {"plan_id": 12}, {"organization_id": " "},
            {"organization_id": None}, {"version": True}, {"version": 0},
            {"states": [TaskStatus.TODO] * 3}, {"states": (TaskStatus.TODO,)},
            {"states": ("todo", TaskStatus.TODO, TaskStatus.TODO)},
            {"states": (TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.TODO)},
            {"states": (TaskStatus.DONE, TaskStatus.TODO, TaskStatus.BLOCKED)},
        )
        for values in invalid:
            with self.subTest(values=values), self.assertRaises(ValueError):
                SyntheticArrivalPlan(**({"plan_id": "demo", "organization_id": "fictional-org-a"} | values))

    def test_invalid_stage_and_command_instances_rejected(self):
        with self.assertRaises(ValueError):
            self.plan.status_of("preparation")
        for command in (("preparation", TaskStatus.TODO, 1),
                        (ArrivalStage.PREPARATION, "todo", 1),
                        (ArrivalStage.PREPARATION, TaskStatus.TODO, True)):
            with self.subTest(command=command), self.assertRaises(ValueError):
                StageChangeCommand(*command)
        with self.assertRaises(ValueError):
            advance_arrival_stage(self.plan, caller_organization_id="fictional-org-a", command=None)


class StagePayloadTests(unittest.TestCase):
    def test_valid_payload_drives_pure_stage_transition(self):
        data = {"stage": "preparation", "status": "in_progress", "expected_version": 1}
        command = validate_stage_change_payload(data)
        changed = advance_arrival_stage(
            SyntheticArrivalPlan("demo", "fictional-org-a"),
            caller_organization_id="fictional-org-a", command=command,
        )
        self.assertEqual(changed.status_of(ArrivalStage.PREPARATION), TaskStatus.IN_PROGRESS)
        self.assertEqual(changed.version, 2)

    def test_body_non_mapping_rejected(self):
        for payload in (None, [], [], 3, False, "text"):
            with self.subTest(payload=payload), self.assertRaises(InvalidTaskUpdate):
                validate_stage_change_payload(payload)

    def test_missing_extra_or_client_supplied_scope_rejected(self):
        required = {"stage": "preparation", "status": "in_progress", "expected_version": 1}
        for payload in (
            {}, {"stage": "arrival", "status": "todo"},
            required | {"organization_id": "fictional-org-b"},
            required | {"plan_id": "other"},
            required | {"task_id": "other"},
        ):
            with self.subTest(payload=payload), self.assertRaises(InvalidTaskUpdate):
                validate_stage_change_payload(payload)

    def test_invalid_stages_statuses_revisions_rejected(self):
        required = {"stage": "preparation", "status": "in_progress", "expected_version": 1}
        variants = (
            {"stage": "PREPARATION"}, {"stage": "arrival "}, {"stage": "unknown"},
            {"stage": False}, {"stage": None},
            {"status": "DONE"}, {"status": "in_progress "}, {"status": 5},
            {"expected_version": "1"}, {"expected_version": 1.0},
            {"expected_version": True}, {"expected_version": 0},
        )
        for variant in variants:
            with self.subTest(variant=variant), self.assertRaises(InvalidTaskUpdate):
                validate_stage_change_payload(required | variant)


if __name__ == "__main__":
    unittest.main()
