"""Real canonical JSON Schema checks, independent of the pending domain PR."""
from copy import deepcopy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from jsonschema import SchemaError, ValidationError
from referencing.exceptions import Unresolvable

from core.material_schema import SCHEMA_PATH, material_response_validator


class MaterialSchemaTests(unittest.TestCase):
    def setUp(self):
        self.network = patch('socket.socket', side_effect=AssertionError('No network'))
        self.network.start()
        self.addCleanup(self.network.stop)
        self.document = json.loads(SCHEMA_PATH.with_name('snapshot.json').read_text(encoding='utf-8'))
        self.validate = material_response_validator()

    def test_canonical_fixture_is_valid_without_mutation(self):
        before = deepcopy(self.document)
        self.assertIsNone(self.validate(self.document))
        self.assertEqual(self.document, before)

    def test_all_required_fields_are_enforced(self):
        schema = json.loads(SCHEMA_PATH.read_text(encoding='utf-8'))
        cases = [((), schema), (('items', 0), schema['properties']['items']['items'])]
        cases.append((('items', 0, 'source'), cases[1][1]['properties']['source']))
        for path, part in cases:
            for field in part['required']:
                with self.subTest(path=path, field=field):
                    document = deepcopy(self.document)
                    target = document
                    for key in path:
                        target = target[key]
                    del target[field]
                    with self.assertRaises(ValidationError):
                        self.validate(document)

    def test_dates_require_real_calendar_days(self):
        for field in ('source_updated_on', 'verified_on'):
            for value in ('2026-02-30', '2026-02-29', '2024-02-29T00:00:00Z', 'not-a-date'):
                with self.subTest(field=field, value=value):
                    document = deepcopy(self.document)
                    document['items'][0]['source'][field] = value
                    with self.assertRaises(ValidationError) as error:
                        self.validate(document)
                    self.assertEqual(error.exception.validator, 'format')
            document = deepcopy(self.document)
            document['items'][0]['source'][field] = '2024-02-29'
            self.validate(document)

    def test_types_versions_ids_and_limits_are_enforced(self):
        cases = [(('api_version',), 'v2'), (('schema_version',), '2.0.0'),
                 (('content_version',), 'not-a-sha'), (('fallback',), 'false'),
                 (('requested_language',), 'de'), (('next_cursor',), 'next'),
                 (('items', 0, 'id'), 'unsafe/id'),
                 (('items', 0, 'location_id'), 'other-site'),
                 (('items', 0, 'text'), ''), (('items', 0, 'synthetic'), 'false')]
        for path, value in cases:
            with self.subTest(path=path):
                document = deepcopy(self.document)
                target = document
                for key in path[:-1]:
                    target = target[key]
                target[path[-1]] = value
                with self.assertRaises(ValidationError):
                    self.validate(document)
        document = deepcopy(self.document)
        document['items'] *= 21
        with self.assertRaises(ValidationError):
            self.validate(document)

    def test_additive_fields_and_empty_items_remain_compatible(self):
        self.document['future'] = True
        self.document['items'][0]['future'] = True
        self.document['items'][0]['source']['future'] = True
        self.validate(self.document)
        self.document['items'] = []
        self.validate(self.document)

    def test_schema_failure_is_not_replaced_by_a_fallback(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'schema.json'
            with patch('core.material_schema.SCHEMA_PATH', path):
                with self.assertRaises(FileNotFoundError):
                    material_response_validator()
                path.write_text('{broken', encoding='utf-8')
                with self.assertRaises(json.JSONDecodeError):
                    material_response_validator()
                path.write_text('{"type": "not-a-type"}', encoding='utf-8')
                with self.assertRaises(SchemaError):
                    material_response_validator()

    def test_external_reference_does_not_trigger_retrieval(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'schema.json'
            path.write_text(json.dumps({'$ref': 'https://invalid.example/schema'}), encoding='utf-8')
            with patch('core.material_schema.SCHEMA_PATH', path):
                validate = material_response_validator()
                with self.assertRaises(Unresolvable):
                    validate({})
