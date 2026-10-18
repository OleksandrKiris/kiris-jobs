import copy
import json
from pathlib import Path
import unittest
from unittest.mock import patch

from jsonschema import Draft202012Validator
from local_mock import mock_api, mock_detail_api


P = Path(__file__).parent
FIXTURE = json.loads((P / 'snapshot.json').read_text(encoding='utf-8'))
ERROR = Draft202012Validator(json.loads((P / 'error.schema.json').read_text(encoding='utf-8')))


class MaterialDetailTests(unittest.TestCase):
    def assert_error(self, result, status, code):
        self.assertEqual(result, (status, {'code': code, 'request_id': 'local-contract-test'}))
        ERROR.validate(result[1])

    def test_both_ids_exact_list_identity_and_provenance_all_languages(self):
        with patch('socket.socket', side_effect=AssertionError('network forbidden')):
            for language in ['ru', 'ua', 'uk', 'en', 'pl', 'ka', 'tr', 'hy']:
                query = [('language', language), ('location_id', 'zgorzelec')]
                status, listing = mock_api(query)
                self.assertEqual(status, 200)
                for item in FIXTURE['items']:
                    with self.subTest(language=language, id=item['id']):
                        status, detail = mock_detail_api(item['id'], query)
                        self.assertEqual(status, 200)
                        expected = copy.deepcopy(listing)
                        expected['items'] = [item]
                        self.assertEqual(detail, expected)

    def test_unknown_and_malformed_ids_fail_without_echo(self):
        self.assert_error(mock_detail_api('unknown-id'), 404, 'MATERIAL_NOT_FOUND')
        for value in ['', 'A', '../secret', 'a/b', 'a%2fb', 'x'*81, 'valid\n', None, 1]:
            with self.subTest(value=value):
                self.assert_error(mock_detail_api(value), 400, 'INVALID_MATERIAL_ID')

    def test_query_filters_duplicates_and_list_only_options(self):
        material_id = FIXTURE['items'][0]['id']
        for pairs, code in [([('language', 'ru'), ('language', 'ru')], 'INVALID_QUERY'),
                            ([('limit', '1')], 'INVALID_QUERY'), ([('cursor', '')], 'INVALID_QUERY'),
                            ([('source', '../secret')], 'INVALID_QUERY'),
                            ([('language', 'xx')], 'INVALID_LANGUAGE'),
                            ([('location_id', 'bogatynia')], 'INVALID_LOCATION'),
                            ([('language', True)], 'INVALID_QUERY'), ([['language']], 'INVALID_QUERY')]:
            with self.subTest(pairs=pairs):
                self.assert_error(mock_detail_api(material_id, pairs), 400, code)

    def test_non_get_and_bad_query_never_read_source(self):
        with patch.object(Path, 'read_text', side_effect=AssertionError('source read forbidden')):
            for method in ['HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']:
                self.assert_error(mock_detail_api('any-id', method=method), 405, 'METHOD_NOT_ALLOWED')
            self.assert_error(mock_detail_api('../secret'), 400, 'INVALID_MATERIAL_ID')
            self.assert_error(mock_detail_api('any-id', [('location_id', 'other')]), 400, 'INVALID_LOCATION')

    def test_schema_duplicates_encoding_and_io_fail_closed(self):
        material_id = FIXTURE['items'][0]['id']
        invalid = copy.deepcopy(FIXTURE)
        del invalid['items'][1]['title']
        duplicate = copy.deepcopy(FIXTURE)
        duplicate['items'][1]['id'] = material_id
        invalid_date = copy.deepcopy(FIXTURE)
        invalid_date['items'][0]['source']['verified_on'] = '2026-02-30'
        surrogate = copy.deepcopy(FIXTURE)
        surrogate['items'][0]['text'] = '\ud800'
        for data in [invalid, duplicate, invalid_date, surrogate]:
            with self.subTest(kind=str(type(data))):
                self.assert_error(mock_detail_api(material_id, snapshot=data), 500, 'INTERNAL_ERROR')
        with patch.object(Path, 'read_text', side_effect=OSError('private-source-marker')):
            self.assert_error(mock_detail_api(material_id), 500, 'INTERNAL_ERROR')
        oversized = copy.deepcopy(FIXTURE)
        oversized['padding'] = 'x' * 33000
        self.assert_error(mock_detail_api(material_id, snapshot=oversized), 500, 'RESPONSE_TOO_LARGE')

    def test_detail_allof_cardinality_and_source_copy_isolation(self):
        schema = json.loads((P / 'detail-response.schema.json').read_text(encoding='utf-8'))
        self.assertEqual(schema['allOf'][0], {'$ref': './response.schema.json'})
        cardinality = Draft202012Validator(schema['allOf'][1])
        self.assertTrue(list(cardinality.iter_errors(FIXTURE)))
        self.assertTrue(list(cardinality.iter_errors(dict(FIXTURE, items=[]))))
        original = copy.deepcopy(FIXTURE)
        status, result = mock_detail_api(FIXTURE['items'][1]['id'], snapshot=FIXTURE)
        self.assertEqual(status, 200)
        result['items'][0]['source']['ref'] = '0'*40
        self.assertEqual(FIXTURE, original)


if __name__ == '__main__':
    unittest.main()
