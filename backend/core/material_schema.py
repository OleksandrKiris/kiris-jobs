"""Canonical local materials-v1 schema validation; no HTTP or business rules."""
import json
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012


SCHEMA_PATH = (Path(__file__).resolve().parents[2] / "contracts" /
               "materials-v1" / "response.schema.json")
DETAIL_SCHEMA_PATH = SCHEMA_PATH.with_name('detail-response.schema.json')


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


def material_detail_validator():
    """Resolve the accepted detail allOf against one local canonical resource."""
    canonical = json.loads(SCHEMA_PATH.read_text(encoding='utf-8'))
    detail = json.loads(DETAIL_SCHEMA_PATH.read_text(encoding='utf-8'))
    Draft202012Validator.check_schema(canonical)
    Draft202012Validator.check_schema(detail)
    base = 'https://primserv.invalid/materials-v1/'
    registry = Registry().with_resource(
        base + 'response.schema.json',
        Resource.from_contents(canonical, default_specification=DRAFT202012),
    )
    detail = dict(detail, **{'$id': base + 'detail-response.schema.json'})
    return Draft202012Validator(
        detail, format_checker=FormatChecker(formats=['date']),
        registry=registry,
    ).validate
