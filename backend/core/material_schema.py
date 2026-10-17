"""Canonical local materials-v1 schema validation; no HTTP or business rules."""
import json
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry


SCHEMA_PATH = (Path(__file__).resolve().parents[2] / "contracts" /
               "materials-v1" / "response.schema.json")


def material_response_validator():
    """Return the domain callback: None on success, ValidationError on failure.

    The repository schema is the only field/rule source. No remote reference
    retrieval is configured. A fresh validator reads saved schema changes rather
    than sharing mutable global state. Schema/I/O errors fail visibly.
    """
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(
        schema, format_checker=FormatChecker(formats=["date"]),
        registry=Registry(),
    )
    return validator.validate
