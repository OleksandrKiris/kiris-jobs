"""Pure local transport boundary for an accepted materials-v1 response."""
import json

from jsonschema import ValidationError

from .material_schema import material_response_validator


MAX_MATERIAL_RESPONSE_BYTES = 32_768


class MaterialResponseError(ValueError):
    """The response cannot be represented as valid materials-v1 JSON bytes."""


class MaterialResponseTooLarge(MaterialResponseError):
    """The complete serialized response exceeds the accepted byte limit."""


def _require_string_keys(value):
    # JSON's encoder otherwise coerces int/bool/None keys, potentially creating
    # duplicate names. This checks representation only, never material fields.
    pending, seen = [value], set()
    while pending:
        item = pending.pop()
        if isinstance(item, (dict, list, tuple)):
            if id(item) in seen:
                continue  # json.dumps retains its own circular-reference check.
            seen.add(id(item))
            if isinstance(item, dict):
                if any(not isinstance(key, str) for key in item):
                    raise TypeError('JSON object keys must be strings.')
                pending.extend(item.values())
            else:
                pending.extend(item)


def serialize_material_response(response: object) -> bytes:
    """Return complete compact UTF-8 JSON, or a fixed payload-free failure.

    Schema configuration/I/O failures stay explicit. Input/encoding failures are
    translated without retaining their potentially payload-bearing exceptions.
    Nothing is streamed, logged, written or returned before the byte-cap check.
    """
    validate = material_response_validator()
    try:
        validate(response)
        _require_string_keys(response)
        body = json.dumps(response, ensure_ascii=False, allow_nan=False,
                          check_circular=True, separators=(',', ':')).encode('utf-8')
    except (ValidationError, TypeError, ValueError, RecursionError, OverflowError):
        pass
    else:
        if len(body) > MAX_MATERIAL_RESPONSE_BYTES:
            raise MaterialResponseTooLarge('Material response exceeds 32768 UTF-8 bytes.')
        return body
    # Outside the except block: do not chain ValidationError or encoder errors,
    # which can include source text, invalid values or object representations.
    raise MaterialResponseError('Material response is invalid or cannot be encoded.')
