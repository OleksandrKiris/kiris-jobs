"""Ordered stages of one entirely fictional arrival plan; pure domain logic.

This is not an immigration, HR, transport, or onboarding procedure. Stage
labels are illustrative only. No persistence, network, Django, or user data.
"""

from collections.abc import Mapping
from dataclasses import dataclass, replace
from enum import Enum

from .api_validation import InvalidTaskUpdate, validate_status_change_payload
from .task_workflow import (
    ForbiddenTransition, SyntheticTask, TaskKind, TaskNotVisible, TaskStatus, transition_task,
)


class ArrivalStage(str, Enum):
    PREPARATION = "preparation"
    JOURNEY = "journey"
    ARRIVAL = "arrival"


_STAGE_ORDER = (ArrivalStage.PREPARATION, ArrivalStage.JOURNEY, ArrivalStage.ARRIVAL)
_INITIAL_STATES = (TaskStatus.TODO,) * len(_STAGE_ORDER)


@dataclass(frozen=True, slots=True)
class SyntheticArrivalPlan:
    """Immutable local example; a single plan version protects all stages."""

    plan_id: str
    organization_id: str
    states: tuple[TaskStatus, TaskStatus, TaskStatus] = _INITIAL_STATES
    version: int = 1

    def __post_init__(self) -> None:
        if type(self.plan_id) is not str or not self.plan_id.strip():
            raise ValueError("plan_id must be a nonempty string")
        if type(self.organization_id) is not str or not self.organization_id.strip():
            raise ValueError("organization_id must be a nonempty string")
        if type(self.version) is not int or self.version < 1:
            raise ValueError("version must be a positive integer")
        if type(self.states) is not tuple or len(self.states) != len(_STAGE_ORDER):
            raise ValueError("states must contain exactly three stages")
        if any(type(state) is not TaskStatus for state in self.states):
            raise ValueError("states must be TaskStatus values")
        for index, state in enumerate(self.states):
            if state is not TaskStatus.TODO and any(
                previous is not TaskStatus.DONE for previous in self.states[:index]
            ):
                raise ValueError("later stages require completed predecessors")

    def status_of(self, stage: ArrivalStage) -> TaskStatus:
        if type(stage) is not ArrivalStage:
            raise ValueError("stage must be an ArrivalStage")
        return self.states[_STAGE_ORDER.index(stage)]

    @property
    def is_complete(self) -> bool:
        return all(state is TaskStatus.DONE for state in self.states)


@dataclass(frozen=True, slots=True)
class StageChangeCommand:
    """Framework-independent command, not a public HTTP schema."""

    stage: ArrivalStage
    status: TaskStatus
    expected_version: int

    def __post_init__(self) -> None:
        if type(self.stage) is not ArrivalStage:
            raise ValueError("stage must be an ArrivalStage")
        if type(self.status) is not TaskStatus:
            raise ValueError("status must be a TaskStatus")
        if type(self.expected_version) is not int or self.expected_version < 1:
            raise ValueError("expected_version must be a positive integer")


def validate_stage_change_payload(payload: object) -> StageChangeCommand:
    """Reject missing/extra fields and body-supplied organization/plan IDs."""
    if not isinstance(payload, Mapping) or set(payload) != {"stage", "status", "expected_version"}:
        raise InvalidTaskUpdate("stage update requires stage, status and expected_version only")
    stage_value = payload["stage"]
    if type(stage_value) is not str:
        raise InvalidTaskUpdate("stage must be a string")
    try:
        stage = ArrivalStage(stage_value)
    except ValueError as exc:
        raise InvalidTaskUpdate("unknown arrival stage") from exc
    validated = validate_status_change_payload(
        {"status": payload["status"], "expected_version": payload["expected_version"]}
    )
    return StageChangeCommand(stage=stage, status=validated.status, expected_version=validated.expected_version)


def advance_arrival_stage(
    plan: SyntheticArrivalPlan,
    *,
    caller_organization_id: str,
    command: StageChangeCommand,
) -> SyntheticArrivalPlan:
    """Apply one stage command after tenant and revision checks; never mutate.

    Calling code must obtain caller_organization_id from a trusted context.
    Storage must later enforce an atomic version check; this function does not.
    """
    if plan.organization_id != caller_organization_id:
        raise TaskNotVisible("arrival plan not found")
    if type(command) is not StageChangeCommand:
        raise ValueError("command must be a StageChangeCommand")
    index = _STAGE_ORDER.index(command.stage)
    # Reuse the accepted v0.1 task state machine and revision policy. One plan
    # version is shared across stages; this short-lived task is never stored.
    stage_task = SyntheticTask(
        task_id=f"{plan.plan_id}:{command.stage.value}",
        organization_id=plan.organization_id,
        kind=TaskKind.ARRIVAL,
        status=plan.states[index],
        version=plan.version,
    )
    updated_task = transition_task(
        stage_task,
        caller_organization_id=caller_organization_id,
        target_status=command.status,
        expected_version=command.expected_version,
    )
    if updated_task is stage_task:
        return plan
    if any(state is not TaskStatus.DONE for state in plan.states[:index]):
        raise ForbiddenTransition("previous arrival stages are not done")
    states = plan.states[:index] + (updated_task.status,) + plan.states[index + 1 :]
    return replace(plan, states=states, version=updated_task.version)
