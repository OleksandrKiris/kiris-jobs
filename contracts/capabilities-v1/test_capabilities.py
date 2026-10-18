"""Shape and canonical-source parity; no Django setup, DB or HTTP execution."""
import copy
import json
from pathlib import Path
import runpy
import unittest

from jsonschema import Draft202012Validator, ValidationError


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SCHEMA = json.loads((HERE / 'response.schema.json').read_text(encoding='utf-8'))
FIXTURE = json.loads((HERE / 'snapshot.json').read_text(encoding='utf-8'))
VALIDATOR = Draft202012Validator(SCHEMA)


class CapabilitiesContractTests(unittest.TestCase):
    def assert_canonical(self, document):
        # Test-only parity assertions, not a second production validator/provider.
        VALIDATOR.validate(document)
        protocol = runpy.run_path(str(ROOT / 'backend/core/protocol.py'))
        for field, symbol in [('api_version', 'API_VERSION'),
                              ('service', 'SERVICE_NAME'), ('version', 'SERVICE_VERSION')]:
            self.assertEqual(document[field], protocol[symbol])
        spec = json.loads((HERE.parent / 'materials-v1/openapi.json').read_text(encoding='utf-8'))
        operation = spec['paths'][document['capabilities']['materials']['path']]['get']
        parameters = {p['name']: p['schema'] for p in operation['parameters']}
        materials = document['capabilities']['materials']
        self.assertEqual(materials['languages'], parameters['language']['enum'])
        self.assertEqual(materials['max_limit'], parameters['limit']['maximum'])

    def test_schema_fixture_and_actual_protocol_openapi_parity(self):
        VALIDATOR.check_schema(SCHEMA)
        self.assert_canonical(FIXTURE)

    def test_missing_required_at_every_level(self):
        for path in [(), ('capabilities',), ('capabilities', 'materials')]:
            original = FIXTURE
            for part in path:
                original = original[part]
            for key in original:
                with self.subTest(path=path, missing=key):
                    document = copy.deepcopy(FIXTURE)
                    target = document
                    for part in path:
                        target = target[part]
                    del target[key]
                    with self.assertRaises(ValidationError):
                        VALIDATOR.validate(document)

    def test_extra_fields_at_every_level_are_rejected(self):
        for path in [(), ('capabilities',), ('capabilities', 'materials')]:
            document = copy.deepcopy(FIXTURE)
            target = document
            for part in path:
                target = target[part]
            target['internal_host'] = 'synthetic.example.invalid'
            with self.subTest(path=path), self.assertRaises(ValidationError):
                VALIDATOR.validate(document)

    def test_wrong_kinds_empty_and_duplicate_languages(self):
        for key, values in {'languages': [None, 'ru', [], ['ru', 'ru'], [1], ['']],
                            'max_limit': [True, '20', 0, -1, 1.5],
                            'methods': ['GET', [], ['GET', 'HEAD']]}.items():
            for value in values:
                document = copy.deepcopy(FIXTURE)
                document['capabilities']['materials'][key] = value
                with self.subTest(key=key, value=value), self.assertRaises(ValidationError):
                    VALIDATOR.validate(document)

    def test_fixed_public_identifiers_and_top_level_kinds(self):
        edits = [('api_version', '2'), ('service', 'other'), ('data_source', 'online'),
                 ('version', 1), ('version', 'v1'), ('version', '0.1.0\n'),
                 ('capabilities', []), ('capabilities', None)]
        for key, value in edits:
            document = copy.deepcopy(FIXTURE)
            document[key] = value
            with self.subTest(key=key, value=value), self.assertRaises(ValidationError):
                VALIDATOR.validate(document)
        for key, value in [('contract', 'company-v1'), ('path', '/internal/')]:
            document = copy.deepcopy(FIXTURE)
            document['capabilities']['materials'][key] = value
            with self.assertRaises(ValidationError):
                VALIDATOR.validate(document)

    def test_plausible_but_wrong_language_sets_and_order_fail_parity(self):
        languages = FIXTURE['capabilities']['materials']['languages']
        for value in [languages[:-1], list(reversed(languages)), languages + ['xx'],
                      ['xx'] + languages[1:]]:
            document = copy.deepcopy(FIXTURE)
            document['capabilities']['materials']['languages'] = value
            with self.subTest(value=value), self.assertRaises(AssertionError):
                self.assert_canonical(document)

    def test_positive_but_wrong_limit_fails_canonical_parity(self):
        for value in [1, 19, 21]:
            document = copy.deepcopy(FIXTURE)
            document['capabilities']['materials']['max_limit'] = value
            with self.subTest(value=value), self.assertRaises(AssertionError):
                self.assert_canonical(document)

    def test_service_version_is_not_frozen_but_fixture_matches_protocol(self):
        document = copy.deepcopy(FIXTURE)
        document['version'] = '9.8.7'
        VALIDATOR.validate(document)
        with self.assertRaises(AssertionError):
            self.assert_canonical(document)

    def test_fixture_is_complete_utf8_json_without_mutation(self):
        original = copy.deepcopy(FIXTURE)
        encoded = json.dumps(FIXTURE, ensure_ascii=False, allow_nan=False,
                             separators=(',', ':')).encode('utf-8')
        self.assertEqual(json.loads(encoded), FIXTURE)
        self.assertLessEqual(len(encoded), 32768)
        self.assert_canonical(FIXTURE)
        self.assertEqual(FIXTURE, original)


if __name__ == '__main__':
    unittest.main()
