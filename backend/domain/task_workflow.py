"""Status transitions for a *synthetic* coordinator task; no I/O.

The actor organization is a trusted argument provided by a future server-side
adapter, never a value read from an untrusted request body. This is a scoping
safeguard, not a replacement for application authentication/authorization.
"""

from dataclasses import dataclass, replace
from enum import Enum


class TaskKind(str, Enum):
    PREPARATION = "preparation"
    ARRIVAL = "arrival"
    OPEN_QUESTION = "open_question"


class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    DONE = "done"


_ALLOWED_NEXT = {
    TaskStatus.TODO: frozenset({TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED}),
    TaskStatus.IN_PROGRESS: frozenset({TaskStatus.BLOCKED, TaskStatus.DONE}),
    TaskStatus.BLOCKED: frozenset({TaskStatus.IN_PROGRESS}),
    TaskStatus.DONE: frozenset(),
}


class TaskNotVisible(Exception):
    """Task must not be disclosed to this organization (or was not found)."""


class RevisionConflict(Exception):
    """The supplied revision is no longer current."""


class ForbiddenTransition(Exception):
    """The workflow does not allow this status change."""


@dataclass(frozen=True, slots=True)
class SyntheticTask:
    task_id: str
    organization_id: str
    kind: TaskKind
    status: TaskStatus = TaskStatus.TODO
    version: int = 1

    def __post_init__(self) -> None:
        if not isinstance(self.task_id, str) or not self.task_id.strip():
            raise ValueError("task_id must be nonempty")
        if not isinstance(self.organization_id, str) or not self.organization_id.strip():
            raise ValueError("organization_id must be nonempty")
        if not isinstance(self.kind, TaskKind):
            raise ValueError("kind must be a TaskKind")
        if not isinstance(self.status, TaskStatus):
            raise ValueError("status must be a TaskStatus")
        if type(self.version) is not int or self.version < 1:
            raise ValueError("version must be a positive integer")


def transition_task(
    task: SyntheticTask,
    *,
    caller_organization_id: str,
    target_status: TaskStatus,
    expected_version: int,
) -> SyntheticTask:
    """Return a new task after a valid, scoped, version-checked transition.

    An identical status is a no-op and does not increment the revision, but
    still requires the current revision. No persistence or delivery occurs.
    """
    if task.organization_id != caller_organization_id:
        raise TaskNotVisible("task not found")
    if type(expected_version) is not int or expected_version != task.version:
        raise RevisionConflict("task version conflict")
    if not isinstance(target_status, TaskStatus):
        raise ValueError("target_status must be a TaskStatus")
    if target_status == task.status:
        return task
    if target_status not in _ALLOWED_NEXT[task.status]:
        raise ForbiddenTransition("task status transition not allowed")
    return replace(task, status=target_status, version=task.version + 1)
