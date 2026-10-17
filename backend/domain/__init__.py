"""Pure domain rules for synthetic coordinator workflows.

No persistence, Django settings, authentication, or network side effects.
"""

from .task_workflow import (
    ForbiddenTransition,
    RevisionConflict,
    SyntheticTask,
    TaskKind,
    TaskNotVisible,
    TaskStatus,
    transition_task,
)
from .api_validation import InvalidTaskUpdate, StatusChangeCommand, validate_status_change_payload

__all__ = [
    "ForbiddenTransition",
    "InvalidTaskUpdate",
    "RevisionConflict",
    "StatusChangeCommand",
    "SyntheticTask",
    "TaskKind",
    "TaskNotVisible",
    "TaskStatus",
    "transition_task",
    "validate_status_change_payload",
]
