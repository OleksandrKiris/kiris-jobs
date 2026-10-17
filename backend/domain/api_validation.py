"""Framework-independent validation for a future status-update API adapter.

This module deliberately does not define URLs, HTTP status codes, response
schemas or authentication: those depend on the canonical integration contract.
"""

from collections.abc import Mapping
from dataclasses import dataclass

from .task_workflow import TaskStatus


class InvalidTaskUpdate(Exception):
    """The request-shaped data is not a valid status-update command."""


@dataclass(frozen=True, slots=True)
class StatusChangeCommand:
    status: TaskStatus
    expected_version: int


def validate_status_change_payload(payload: object) -> StatusChangeCommand:
    """Accept exactly {status, expected_version}; reject client-supplied scope.

    Deliberately rejects bool revisions (bool is an int subclass), numeric
    strings, whitespace/case variants and unknown fields such as org IDs.
    """
    if not isinstance(payload, Mapping):
        raise InvalidTaskUpdate("update must be an object")
    if set(payload.keys()) != {"status", "expected_version"}:
        raise InvalidTaskUpdate("update requires only status and expected_version")
    value = payload["status"]
    if type(value) is not str:
        raise InvalidTaskUpdate("status must be a string")
    try:
        status = TaskStatus(value)
    except ValueError as exc:
        raise InvalidTaskUpdate("unknown task status") from exc
    version = payload["expected_version"]
    if type(version) is not int or version < 1:
        raise InvalidTaskUpdate("expected_version must be a positive integer")
    return StatusChangeCommand(status=status, expected_version=version)
