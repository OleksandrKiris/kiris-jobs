"""Actual detail HTTP parity and complete-source failure boundaries."""
from copy import deepcopy
import json
from pathlib import Path
import runpy
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase, override_settings
from django.urls import resolve
from jsonschema import Draft202012Validator, ValidationError

from core.material_detail import material_detail
from core.material_http import PROVIDER_PATH
from core.material_response import serialize_material_response
from core.material_schema import material_detail_validator


URL = '/api/v1/materials/'
MARKER = 'private-detail-source-marker'


class MaterialDetailHTTPTests(SimpleTestCase):
    def setUp(self):
        self.fixture_bytes = PROVIDER_PATH.with_name('snapshot.json').read_bytes()
        self.fixture = json.loads(self.fixture_bytes)
        self.provider = runpy.run_path(str(PROVIDER_PATH))
        self.reference = self.provider['mock_detail_api']
        self.errors = Draft202012Validator(json.loads(
            PROVIDER_PATH.with_name('error.schema.json').read_text(encoding='utf-8')))
        self.network = patch('socket.socket', side_effect=AssertionError('No network'))
        self.network.start()
        self.addCleanup(self.network.stop)

    def url(self, index=0):
        return URL + self.fixture['items'][index]['id'] + '/'

    def assert_error(self, response, status, code):
        self.assertEqual(response.status_code, status)
        document = response.json()
        self.errors.validate(document)
        self.assertEqual(document, {'code': code, 'request_id': response['X-Request-ID']})
        self.assertLess(len(response.content), 256)
        self.assertNotIn(MARKER.encode(), response.content)
        self.assertNotIn(b'"items"', response.content)
        self.assertNotIn(b'Traceback', response.content)

    def raw_provider(self, document):
        provider = dict(self.provider)
        provider['SNAPSHOT'] = SimpleNamespace(read_text=Mock(
            return_value=json.dumps(document, ensure_ascii=True)))
        return patch('core.material_detail._canonical_provider', return_value=provider)

    def test_registered_handler_and_both_real_ids_exact_provenance_all_languages(self):
        for language in ('ru', 'ua', 'uk', 'en', 'pl', 'ka', 'tr', 'hy'):
            pairs = [('location_id', 'zgorzelec'), ('language', language)]
            for index, item in enumerate(self.fixture['items']):
                with self.subTest(language=language, material_id=item['id']):
                    match = resolve(self.url(index))
                    self.assertEqual(match.url_name, 'core-material-detail')
                    self.assertIs(match.func, material_detail)
                    status, expected = self.reference(item['id'], pairs)
                    response = self.client.get(self.url(index), pairs)
                    self.assertEqual(status, 200)
                    self.assertEqual(response.status_code, status)
                    self.assertEqual(response.json(), expected)
                    self.assertEqual(response.json()['items'], [item])
                    self.assertEqual(response.content, serialize_material_response(expected))
                    material_detail_validator()(response.json())
                    self.assertEqual(response['Content-Type'], 'application/json; charset=utf-8')
                    self.assertEqual(response['Content-Length'], str(len(response.content)))
                    self.assertEqual(response['Cache-Control'], 'no-store')
                    self.assertEqual(response['X-Content-Type-Options'], 'nosniff')
                    self.assertFalse(response.streaming)
                    self.assertFalse(response.cookies)
        self.assertEqual(PROVIDER_PATH.with_name('snapshot.json').read_bytes(), self.fixture_bytes)

    def test_default_and_unknown_id_follow_real_mock(self):
        for material_id in (self.fixture['items'][0]['id'], 'unknown-id'):
            status, expected = self.reference(material_id)
            response = self.client.get(URL + material_id + '/')
            self.assertEqual(response.status_code, status)
            if status == 200:
                self.assertEqual(response.json(), expected)
                self.assertEqual(response.json()['requested_language'], 'en')
            else:
                self.assert_error(response, 404, 'MATERIAL_NOT_FOUND')

    def test_malformed_encoded_slash_unicode_empty_and_path_ids_reach_fixed_400(self):
        invalid = ('A', 'a_b', 'x' * 81, '%C5%BC', '%2F', 'a%2Fb',
                   'a%252fb', '../secret', 'a\\b', '', 'valid%0A')
        with patch('core.material_detail._read_canonical_detail_snapshot') as provider:
            for value in invalid:
                with self.subTest(path_id=value):
                    self.assert_error(self.client.get(URL + value + '/'), 400,
                                      'INVALID_MATERIAL_ID')
            provider.assert_not_called()

    def test_noncanonical_route_variants_keep_generic_404_without_redirect(self):
        for path in (self.url()[:-1], '/api/v9/materials/any-id/',
                     '/api/v1/materials-extra/any-id/'):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 404)
                self.assertEqual(response.json()['error']['code'], 'not_found')
                self.assertNotIn('Location', response)

    def test_query_rejections_match_contract_and_filters_skip_source_read(self):
        cases = [('language=ru&language=en', 'INVALID_QUERY'),
                 ('location_id=zgorzelec&location_id=zgorzelec', 'INVALID_QUERY'),
                 ('limit=1', 'INVALID_QUERY'), ('cursor=', 'INVALID_QUERY'),
                 ('unknown=' + MARKER, 'INVALID_QUERY'),
                 ('language=', 'INVALID_LANGUAGE'), ('language=xx', 'INVALID_LANGUAGE'),
                 ('location_id=', 'INVALID_LOCATION'),
                 ('location_id=bogatynia', 'INVALID_LOCATION')]
        for query, code in cases:
            with self.subTest(query=query):
                with patch.object(Path, 'read_text', side_effect=AssertionError('No source read')):
                    self.assert_error(self.client.get(self.url() + '?' + query), 400, code)

    def test_nonselected_corruption_both_directions_and_unknown_fail_before_selection(self):
        for requested_index, corrupt_index in ((0, 1), (1, 0)):
            for fault in ('missing', 'date', 'source', 'surrogate', 'nonfinite', 'key'):
                with self.subTest(requested=requested_index, corrupt=corrupt_index, fault=fault):
                    data = deepcopy(self.fixture)
                    item = data['items'][corrupt_index]
                    if fault == 'missing':
                        del item['title']
                    elif fault == 'date':
                        item['source']['verified_on'] = '2026-02-30'
                    elif fault == 'source':
                        item['source'] = []
                    elif fault == 'surrogate':
                        item['future'] = MARKER + '\ud800'
                    elif fault == 'nonfinite':
                        item['future'] = float('inf')
                    else:
                        item[1] = MARKER
                    before = deepcopy(data)
                    with patch('core.material_detail._read_canonical_detail_snapshot',
                               return_value=(200, data)):
                        self.assert_error(self.client.get(self.url(requested_index)),
                                          500, 'INTERNAL_ERROR')
                        self.assert_error(self.client.get(URL + 'unknown-id/'),
                                          500, 'INTERNAL_ERROR')
                    self.assertEqual(data, before)

    def test_raw_source_is_validated_before_reference_can_truncate_or_select(self):
        cases = []
        invalid = deepcopy(self.fixture)
        del invalid['items'][1]['title']
        cases.append(invalid)
        overflow_items = deepcopy(self.fixture)
        overflow_items['items'] = [dict(deepcopy(self.fixture['items'][0]),
                                       id=(self.fixture['items'][0]['id'] if index == 0
                                           else f'fixture-{index}'))
                                   for index in range(21)]
        del overflow_items['items'][20]['title']
        cases.append(overflow_items)
        nonfinite = deepcopy(self.fixture)
        nonfinite['items'][1]['future'] = float('inf')
        cases.append(nonfinite)
        for data in cases:
            with self.subTest(items=len(data['items'])), self.raw_provider(data):
                self.assert_error(self.client.get(self.url()), 500, 'INTERNAL_ERROR')

    def test_duplicate_ids_anywhere_fail_even_for_unknown_id(self):
        for duplicate_selected in (True, False):
            data = deepcopy(self.fixture)
            duplicate = deepcopy(data['items'][0 if duplicate_selected else 1])
            data['items'].append(duplicate)
            with self.subTest(selected=duplicate_selected), self.raw_provider(data):
                self.assert_error(self.client.get(self.url()), 500, 'INTERNAL_ERROR')
                self.assert_error(self.client.get(URL + 'unknown-id/'), 500, 'INTERNAL_ERROR')

    def padded(self, size):
        data = deepcopy(self.fixture)
        data['padding'] = ''
        data['padding'] = 'a' * (size - len(serialize_material_response(data)))
        return data

    def test_complete_source_byte_cap_before_selection_and_no_mutation(self):
        for size in (32768, 32769):
            data = self.padded(size)
            before = deepcopy(data)
            with self.subTest(size=size), patch(
                    'core.material_detail._read_canonical_detail_snapshot', return_value=(200, data)):
                response = self.client.get(self.url(1))
                if size == 32768:
                    self.assertEqual(response.status_code, 200)
                    expected = dict(before, items=[before['items'][1]])
                    self.assertEqual(response.content, serialize_material_response(expected))
                else:
                    self.assert_error(response, 500, 'RESPONSE_TOO_LARGE')
                    self.assert_error(self.client.get(URL + 'unknown-id/'),
                                      500, 'RESPONSE_TOO_LARGE')
            self.assertEqual(data, before)

    def test_malformed_provider_status_body_and_unknown_error_codes_fail_closed(self):
        for result in (None, (), (True, self.fixture), (201, self.fixture), (200, []),
                       (404, {'code': 'MATERIAL_NOT_FOUND'}), (400, {'code': MARKER}),
                       (400, {'code': ['INVALID_QUERY']}), (500, MARKER)):
            with self.subTest(result_type=type(result).__name__), patch(
                    'core.material_detail._read_canonical_detail_snapshot', return_value=result):
                self.assert_error(self.client.get(self.url()), 500, 'INTERNAL_ERROR')

    @override_settings(DEBUG=True)
    def test_actual_schema_io_invalid_schema_and_remote_ref_fail_closed_offline(self):
        for schema in (None, '{broken', '{"type":"not-a-type"}',
                       '{"$ref":"https://invalid.example/private-schema"}'):
            path = SimpleNamespace(read_text=Mock(side_effect=OSError(MARKER)))
            if schema is not None:
                path.read_text = Mock(return_value=schema)
            with self.subTest(schema=schema), patch('core.material_schema.DETAIL_SCHEMA_PATH', path):
                self.assert_error(self.client.get(self.url()), 500, 'INTERNAL_ERROR')

    def test_detail_allof_enforces_cardinality_with_real_canonical_fields(self):
        validate = material_detail_validator()
        validate(dict(self.fixture, items=[self.fixture['items'][1]]))
        for items in ([], self.fixture['items']):
            with self.subTest(count=len(items)), self.assertRaises(ValidationError):
                validate(dict(self.fixture, items=items))
        invalid = deepcopy(self.fixture['items'][1])
        invalid['source']['verified_on'] = '2026-02-30'
        with self.assertRaises(ValidationError):
            validate(dict(self.fixture, items=[invalid]))
