"""Standard-library unit tests; all organizations and tasks are fictitious."""

import unittest

from backend.domain import (
    ForbiddenTransition,
    InvalidTaskUpdate,
    RevisionConflict,
    SyntheticTask,
    TaskKind,
    TaskNotVisible,
    TaskStatus,
    transition_task,
    validate_status_change_payload,
)


class TaskWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.task = SyntheticTask(task_id="demo-001", organization_id="demo-alpha", kind=TaskKind.PREPARATION)

    def change(self, task, status, *, org="demo-alpha", version=None):
        return transition_task(task, caller_organization_id=org, target_status=status, expected_version=task.version if version is None else version)

    def test_preparation_task_can_progress_and_complete(self):
        started = self.change(self.task, TaskStatus.IN_PROGRESS)
        finished = self.change(started, TaskStatus.DONE)
        self.assertEqual((finished.status, finished.version), (TaskStatus.DONE, 3))
        self.assertEqual((self.task.status, self.task.version), (TaskStatus.TODO, 1))

    def test_arrival_task_can_be_blocked_then_resumed(self):
        task = SyntheticTask("arrival-demo", "demo-alpha", TaskKind.ARRIVAL)
        blocked = self.change(task, TaskStatus.BLOCKED)
        resumed = self.change(blocked, TaskStatus.IN_PROGRESS)
        self.assertEqual((blocked.status, resumed.status), (TaskStatus.BLOCKED, TaskStatus.IN_PROGRESS))

    def test_open_question_uses_same_explicit_status_rules(self):
        task = SyntheticTask("question-demo", "demo-alpha", TaskKind.OPEN_QUESTION)
        self.assertEqual(self.change(task, TaskStatus.IN_PROGRESS).kind, TaskKind.OPEN_QUESTION)

    def test_cannot_complete_without_starting(self):
        with self.assertRaises(ForbiddenTransition):
            self.change(self.task, TaskStatus.DONE)

    def test_completed_task_cannot_reopen(self):
        task = self.change(self.change(self.task, TaskStatus.IN_PROGRESS), TaskStatus.DONE)
        with self.assertRaises(ForbiddenTransition):
            self.change(task, TaskStatus.IN_PROGRESS)

    def test_blocked_task_cannot_complete_until_resumed(self):
        blocked = self.change(self.task, TaskStatus.BLOCKED)
        with self.assertRaises(ForbiddenTransition):
            self.change(blocked, TaskStatus.DONE)

    def test_noop_keeps_version_and_identity(self):
        self.assertIs(self.change(self.task, TaskStatus.TODO), self.task)

    def test_noop_requires_current_version(self):
        with self.assertRaises(RevisionConflict):
            self.change(self.task, TaskStatus.TODO, version=2)

    def test_stale_revision_rejected_without_mutation(self):
        started = self.change(self.task, TaskStatus.IN_PROGRESS)
        with self.assertRaises(RevisionConflict):
            self.change(started, TaskStatus.DONE, version=1)
        self.assertEqual((started.status, started.version), (TaskStatus.IN_PROGRESS, 2))

    def test_different_organization_cannot_observe_or_mutate_task(self):
        with self.assertRaises(TaskNotVisible):
            self.change(self.task, TaskStatus.IN_PROGRESS, org="demo-beta")
        self.assertEqual(self.task.status, TaskStatus.TODO)

    def test_scope_checked_before_revision(self):
        with self.assertRaises(TaskNotVisible):
            self.change(self.task, TaskStatus.IN_PROGRESS, org="demo-beta", version=999)

    def test_bad_entity_fields_rejected(self):
        for values in [
            {"task_id": ""},
            {"organization_id": ""},
            {"kind": "arrival"},
            {"status": "todo"},
            {"version": True},
            {"version": 0},
        ]:
            with self.subTest(values=values), self.assertRaises(ValueError):
                SyntheticTask(**({"task_id": "demo", "organization_id": "demo-alpha", "kind": TaskKind.ARRIVAL} | values))


class ApiBoundaryValidationTests(unittest.TestCase):
    def test_valid_status_command(self):
        cmd = validate_status_change_payload({"status": "blocked", "expected_version": 7})
        self.assertEqual((cmd.status, cmd.expected_version), (TaskStatus.BLOCKED, 7))

    def test_command_can_drive_pure_transition(self):
        task = SyntheticTask("demo-001", "demo-alpha", TaskKind.PREPARATION)
        cmd = validate_status_change_payload({"status": "in_progress", "expected_version": 1})
        after = transition_task(task, caller_organization_id="demo-alpha", target_status=cmd.status, expected_version=cmd.expected_version)
        self.assertEqual(after.version, 2)

    def test_body_must_be_object(self):
        for body in (None, [], "todo", 12, True):
            with self.subTest(body=body), self.assertRaises(InvalidTaskUpdate):
                validate_status_change_payload(body)

    def test_missing_extra_or_spoofed_scope_rejected(self):
        for body in (
            {},
            {"status": "todo"},
            {"expected_version": 1},
            {"status": "todo", "expected_version": 1, "organization_id": "demo-beta"},
            {"status": "todo", "expected_version": 1, "task_id": "other-demo"},
        ):
            with self.subTest(body=body), self.assertRaises(InvalidTaskUpdate):
                validate_status_change_payload(body)

    def test_invalid_statuses_rejected_not_normalized(self):
        for status in (None, 0, "DONE", "done ", "", "unknown", False):
            with self.subTest(status=status), self.assertRaises(InvalidTaskUpdate):
                validate_status_change_payload({"status": status, "expected_version": 1})

    def test_invalid_revision_types_rejected(self):
        for version in (None, "1", 1.0, 0, -1, True, False):
            with self.subTest(version=version), self.assertRaises(InvalidTaskUpdate):
                validate_status_change_payload({"status": "todo", "expected_version": version})


if __name__ == "__main__":
    unittest.main()
