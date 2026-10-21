"""Adapter unit tests against exact PR67 fixture; not a replacement schema suite."""
import json
from pathlib import Path
import unittest
from unittest.mock import Mock

from backend.domain.material_contract_adapter import adapt_material_response
from backend.domain.material_snapshot import InvalidMaterialSnapshot


class ContractAdapterTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads(Path(__file__).with_name('materials_v1_fixture.json').read_text(encoding='utf-8'))
        self.validator = Mock()

    def adapt(self, data=None):
        return adapt_material_response(self.data if data is None else data,
                                       build_version='test-build', validate_schema=self.validator)

    def test_exact_fixture_maps_ids_provenance_and_separate_build(self):
        item, = self.adapt()
        self.validator.assert_called_once_with(self.data)
        self.assertEqual((item.location_id, item.material_id), ('zgorzelec', 'site-cleaning-summary-ru'))
        self.assertEqual(item.build_version, 'test-build')
        self.assertEqual(item.content_version, self.data['content_version'])
        self.assertIn('data/content.js#jobs[id=site-cleaning]', item.source_ref)

    def test_all_eight_contract_languages(self):
        for lang in ('ua', 'uk', 'ru', 'pl', 'en', 'ka', 'tr', 'hy'):
            with self.subTest(lang=lang):
                self.data.update(requested_language=lang, fallback=lang != 'ru')
                item, = self.adapt()
                self.assertEqual(item.requested_language, lang)
                self.assertEqual(item.is_fallback, lang != 'ru')

    def test_schema_failure_propagates_without_mapping(self):
        self.validator.side_effect = ValueError('schema rejected')
        with self.assertRaisesRegex(ValueError, 'schema rejected'):
            self.adapt()

    def test_inconsistent_metadata_rejected(self):
        mutations = [lambda d:d.update(fallback=True), lambda d:d.update(fallback=0),
                     lambda d:d.update(api_version='v2'), lambda d:d.update(schema_version='2.0.0'),
                     lambda d:d.update(next_cursor='next'), lambda d:d['items'][0].update(language='en'),
                     lambda d:d['items'][0].update(synthetic=True),
                     lambda d:d['items'][0]['source'].update(verification_status='unverified'),
                     lambda d:d['items'][0]['source'].update(ref='a'*40)]
        from copy import deepcopy
        for mutate in mutations:
            data = deepcopy(self.data); mutate(data)
            with self.subTest(data=data), self.assertRaises(InvalidMaterialSnapshot):
                self.adapt(data)

    def test_validator_cannot_mutate_input_or_mapped_copy(self):
        original = json.loads(json.dumps(self.data))
        self.validator.side_effect = lambda d:d.clear()
        self.assertEqual(len(self.adapt()), 1)
        self.assertEqual(self.data, original)

    def test_missing_schema_validator_is_not_optional(self):
        with self.assertRaises(TypeError):
            adapt_material_response(self.data, build_version='test-build')
