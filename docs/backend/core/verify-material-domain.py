"""Explicit combined-commit proof; missing domain code is a hard failure.

Run from a disposable tree containing accepted contracts, role12 validator and
exact role13 PR62 files. No files, database, HTTP listener or network are written.
"""
import argparse
from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--repo-root', type=Path, default=Path(__file__).resolve().parents[3])
args = parser.parse_args()
root = args.repo_root.resolve()
sys.path.insert(0, str(root / 'backend'))
from core.material_schema import material_response_validator
from domain.material_contract_adapter import adapt_material_response
from domain.material_snapshot import InvalidMaterialSnapshot
from jsonschema import ValidationError

contract = root / 'contracts' / 'materials-v1'
spec = importlib.util.spec_from_file_location('canonical_material_mock', contract / 'local_mock.py')
mock = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mock)


class CombinedMaterialProof(unittest.TestCase):
    def setUp(self):
        network = patch('socket.socket', side_effect=AssertionError('No network in proof'))
        network.start()
        self.addCleanup(network.stop)
        self.validate = material_response_validator()
        self.snapshot = json.loads((contract / 'snapshot.json').read_text(encoding='utf-8'))

    def adapt(self, value):
        return adapt_material_response(value, build_version='local-proof-build',
                                       validate_schema=self.validate)

    def test_fixture_bytes_match(self):
        self.assertEqual((contract / 'snapshot.json').read_bytes(),
                         (root / 'backend/tests/domain/materials_v1_fixture.json').read_bytes())

    def test_snapshot_mock_adapter_parity_for_16_combinations(self):
        for language in ('ua', 'uk', 'ru', 'pl', 'en', 'ka', 'tr', 'hy'):
            for limit in ('1', '20'):
                with self.subTest(language=language, limit=limit):
                    query = {'language': language, 'limit': limit}
                    status, snapshot = mock.read_snapshot(query)
                    self.assertEqual(status, 200)
                    self.assertEqual(mock.mock_api(query.items()), (status, snapshot))
                    before = deepcopy(snapshot)
                    result = self.adapt(snapshot)
                    self.assertEqual(snapshot, before)
                    self.assertEqual(len(result), 1)
                    self.assertEqual(result[0].requested_language, language)
                    self.assertEqual(result[0].effective_language, 'ru')
                    self.assertEqual(result[0].is_fallback, language != 'ru')
                    self.assertEqual(result[0].build_version, 'local-proof-build')
                    self.assertEqual(result[0].location_id, 'zgorzelec')
                    self.assertEqual(result[0].material_id, 'site-cleaning-summary-ru')

    def test_actual_schema_rejects_fields_not_read_by_mapping(self):
        for field in ('title', 'text', 'job_id'):
            with self.subTest(field=field):
                value = deepcopy(self.snapshot)
                del value['items'][0][field]
                with self.assertRaises(ValidationError):
                    self.adapt(value)

    def test_actual_date_checker_precedes_mapping(self):
        for field in ('verified_on', 'source_updated_on'):
            with self.subTest(field=field):
                value = deepcopy(self.snapshot)
                value['items'][0]['source'][field] = '2026-02-30'
                with self.assertRaises(ValidationError) as error:
                    self.adapt(value)
                self.assertEqual(error.exception.validator, 'format')

    def test_schema_valid_business_contradictions_stay_domain_errors(self):
        changes = [(('fallback',), True),
                   (('items', 0, 'language'), 'en'),
                   (('items', 0, 'source', 'ref'), 'f' * 40),
                   (('items', 0, 'synthetic'), True),
                   (('items', 0, 'source', 'verification_status'), 'unverified')]
        for path, changed in changes:
            with self.subTest(path=path):
                value = deepcopy(self.snapshot)
                target = value
                for key in path[:-1]:
                    target = target[key]
                target[path[-1]] = changed
                self.validate(value)
                before = deepcopy(value)
                with self.assertRaises(InvalidMaterialSnapshot):
                    self.adapt(value)
                self.assertEqual(value, before)

    def test_additive_fields_and_empty_items_preserve_compatibility(self):
        value = deepcopy(self.snapshot)
        value['future'] = True
        value['items'][0]['future'] = True
        value['items'][0]['source']['future'] = True
        self.assertEqual(len(self.adapt(value)), 1)
        value['items'] = []
        self.assertEqual(self.adapt(value), ())


if __name__ == '__main__':
    result = unittest.TextTestRunner(verbosity=2).run(
        unittest.defaultTestLoader.loadTestsFromTestCase(CombinedMaterialProof))
    sys.exit(0 if result.wasSuccessful() else 1)
