"""Real canonical GET parity; separate injected HTTP-boundary fault checks."""
from contextlib import redirect_stderr, redirect_stdout
from copy import deepcopy
import io
import json
from pathlib import Path
import runpy
from unittest.mock import patch

from django.test import Client, SimpleTestCase, override_settings
from django.urls import resolve
from jsonschema import Draft202012Validator

from core.material_http import PROVIDER_PATH
from core.material_response import serialize_material_response


URL = '/api/v1/materials/'
CONTRACT = PROVIDER_PATH.parent
MARKER = 'synthetic-private-transport-marker'


class MaterialHTTPTests(SimpleTestCase):
    def setUp(self):
        self.fixture_bytes = (CONTRACT / 'snapshot.json').read_bytes()
        self.fixture = json.loads(self.fixture_bytes)
        self.errors = Draft202012Validator(json.loads(
            (CONTRACT / 'error.schema.json').read_text(encoding='utf-8')))
        self.reference = runpy.run_path(str(PROVIDER_PATH))['mock_api']
        self.network = patch('socket.socket', side_effect=AssertionError('No network'))
        self.network.start()
        self.addCleanup(self.network.stop)

    def assert_headers(self, response):
        self.assertEqual(response['Content-Type'], 'application/json; charset=utf-8')
        self.assertEqual(response['Content-Length'], str(len(response.content)))
        self.assertEqual(response['Cache-Control'], 'no-store')
        self.assertEqual(response['X-Content-Type-Options'], 'nosniff')
        self.assertEqual(response['X-API-Version'], '1')
        self.assertRegex(response['X-Request-ID'], r'^[0-9a-f]{32}$')
        self.assertFalse(response.streaming)
        self.assertFalse(response.cookies)
        self.assertNotIn('Set-Cookie', response)
        self.assertNotIn('Location', response)

    def assert_material_error(self, response, status, code):
        self.assertEqual(response.status_code, status)
        self.assert_headers(response)
        document = response.json()
        self.errors.validate(document)
        self.assertEqual(document, {'code': code, 'request_id': response['X-Request-ID']})
        self.assertLess(len(response.content), 256)
        self.assertNotIn(MARKER.encode(), response.content)
        self.assertNotIn(b'Traceback', response.content)

    def test_registered_route_precedes_catchall_and_default_get_is_real_snapshot(self):
        self.assertEqual(resolve(URL).url_name, 'core-materials')
        status, expected = self.reference()
        response = self.client.get(URL)
        self.assertEqual(status, 200)
        self.assertEqual(response.status_code, status)
        self.assertEqual(response.json(), expected)
        self.assertEqual(response.content, serialize_material_response(expected))
        self.assertIn(self.fixture['items'][0]['title'].encode('utf-8'), response.content)
        self.assert_headers(response)
        self.assertEqual(expected['requested_language'], 'en')
        self.assertEqual(self.client.get('/api/v9/materials/').status_code, 404)
        self.assertEqual(self.client.get('/api/v1/materials/missing/').status_code, 404)

    def test_real_canonical_provider_parity_for_eight_languages_and_two_limits(self):
        for language in ('ru', 'ua', 'uk', 'en', 'pl', 'ka', 'tr', 'hy'):
            for limit in ('1', '20'):
                with self.subTest(language=language, limit=limit):
                    pairs = [('language', language), ('limit', limit),
                             ('location_id', 'zgorzelec'), ('cursor', '')]
                    status, expected = self.reference(pairs)
                    response = self.client.get(URL, pairs)
                    self.assertEqual(status, 200)
                    self.assertEqual(response.status_code, status)
                    self.assertEqual(response.json(), expected)
                    self.assertEqual(response.content, serialize_material_response(expected))
                    self.assert_headers(response)
                    self.assertEqual(expected['requested_language'], language)
                    self.assertEqual(expected['effective_language'], 'ru')
                    self.assertEqual(expected['fallback'], language != 'ru')
        self.assertEqual((CONTRACT / 'snapshot.json').read_bytes(), self.fixture_bytes)

    def test_query_duplicates_unknowns_and_invalid_filters_follow_contract(self):
        cases = [
            ('language=ru&language=en', 'INVALID_QUERY'),
            ('limit=1&limit=1', 'INVALID_QUERY'),
            ('unknown=' + MARKER, 'INVALID_QUERY'),
            ('company_id=' + MARKER, 'INVALID_QUERY'),
            ('location_id=bogatynia', 'INVALID_LOCATION'),
            ('location_id=', 'INVALID_LOCATION'),
            ('language=xx', 'INVALID_LANGUAGE'),
            ('language=', 'INVALID_LANGUAGE'),
            ('limit=0', 'INVALID_LIMIT'),
            ('limit=21', 'INVALID_LIMIT'),
            ('limit=01', 'INVALID_LIMIT'),
            ('limit=%2B1', 'INVALID_LIMIT'),
            ('limit=1.5', 'INVALID_LIMIT'),
            ('cursor=' + MARKER, 'INVALID_CURSOR'),
        ]
        for query, code in cases:
            with self.subTest(query=query):
                self.assert_material_error(self.client.get(URL + '?' + query), 400, code)

    @override_settings(DATA_UPLOAD_MAX_NUMBER_FIELDS=1)
    def test_query_parser_failure_has_material_error_without_echo(self):
        response = self.client.get(URL + '?language=ru&cursor=' + MARKER)
        self.assert_material_error(response, 400, 'INVALID_QUERY')

    def test_head_and_other_methods_are_405_without_provider_or_serializer(self):
        with patch('core.material_http._read_canonical_snapshot') as provider, \
                patch('core.material_http.serialize_material_response') as serializer:
            for method in ('HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'TRACE', 'CONNECT'):
                with self.subTest(method=method):
                    response = self.client.generic(method, URL)
                    self.assertEqual(response.status_code, 405)
                    self.assertEqual(response['Allow'], 'GET')
                    if method == 'HEAD':
                        self.assertEqual(response.content, b'')
                        self.assertGreater(int(response['Content-Length']), 0)
                    else:
                        self.assert_material_error(response, 405, 'METHOD_NOT_ALLOWED')
            provider.assert_not_called()
            serializer.assert_not_called()

    def test_error_body_header_and_log_share_server_id_and_discard_provider_fields(self):
        supplied = {'code': 'INVALID_QUERY', 'request_id': MARKER,
                    'headers': {'Set-Cookie': MARKER}, 'detail': MARKER}
        with patch('core.material_http._read_canonical_snapshot', return_value=(400, supplied)), \
                self.assertLogs('core.requests', level='INFO') as logs:
            response = self.client.get(URL, HTTP_X_REQUEST_ID=MARKER)
        self.assert_material_error(response, 400, 'INVALID_QUERY')
        event = json.loads(logs.records[0].getMessage())
        self.assertEqual(event['request_id'], response['X-Request-ID'])
        self.assertEqual(event['route'], 'materials')
        self.assertEqual(set(event), {'api_version', 'request_id', 'method', 'route',
                                     'status', 'duration_ms'})
        self.assertNotIn(MARKER, '\n'.join(logs.output))
        again = self.client.get(URL + '?unknown=1', HTTP_X_REQUEST_ID=MARKER)
        self.assertNotEqual(again['X-Request-ID'], response['X-Request-ID'])
        self.assert_material_error(again, 400, 'INVALID_QUERY')

    def padded(self, size):
        document = deepcopy(self.fixture)
        document['transport_test_padding'] = ''
        document['transport_test_padding'] = 'a' * (size - len(serialize_material_response(document)))
        return document

    def test_injected_valid_document_at_32768_bytes_is_returned_whole_and_unchanged(self):
        document = self.padded(32768)
        before = deepcopy(document)
        with patch('core.material_http._read_canonical_snapshot', return_value=(200, document)):
            response = self.client.get(URL)
        self.assertEqual(response.status_code, 200)
        self.assert_headers(response)
        self.assertEqual(len(response.content), 32768)
        self.assertEqual(response.content, serialize_material_response(before))
        self.assertEqual(document, before)

    def test_injected_32769_bytes_returns_only_bounded_generic_failure(self):
        document = self.padded(32769)
        before = deepcopy(document)
        with patch('core.material_http._read_canonical_snapshot', return_value=(200, document)):
            response = self.client.get(URL)
        self.assert_material_error(response, 500, 'RESPONSE_TOO_LARGE')
        self.assertNotIn(b'"items"', response.content)
        self.assertEqual(document, before)

    def test_injected_schema_encoding_and_nonfinite_failures_are_not_partial_responses(self):
        for kind in ('schema', 'encoding', 'nonfinite'):
            with self.subTest(kind=kind):
                document = deepcopy(self.fixture)
                document['transport_test_padding'] = MARKER
                if kind == 'schema':
                    del document['items'][0]['title']
                elif kind == 'encoding':
                    document['transport_test_padding'] += '\ud800'
                else:
                    document['transport_test_value'] = float('inf')
                before = deepcopy(document)
                with patch('core.material_http._read_canonical_snapshot', return_value=(200, document)):
                    response = self.client.get(URL)
                self.assert_material_error(response, 500, 'INTERNAL_ERROR')
                self.assertNotIn(b'"items"', response.content)
                self.assertEqual(document, before)

    def test_malformed_provider_results_fail_closed(self):
        results = [None, (), (True, self.fixture), (201, self.fixture), (200, []),
                   (400, {'code': 'INTERNAL_ERROR', 'request_id': MARKER}),
                   (500, {'code': MARKER, 'request_id': MARKER}),
                   (400, {'code': [MARKER]}), (400, MARKER)]
        for result in results:
            with self.subTest(result_type=type(result).__name__):
                with patch('core.material_http._read_canonical_snapshot', return_value=result):
                    response = self.client.get(URL)
                self.assert_material_error(response, 500, 'INTERNAL_ERROR')

    @override_settings(DEBUG=True)
    def test_provider_io_and_serializer_overflow_are_redacted_even_in_debug(self):
        faults = [('core.material_http._read_canonical_snapshot', OSError(MARKER + '/private.json')),
                  ('core.material_http.serialize_material_response', OverflowError(MARKER))]
        for target, failure in faults:
            with self.subTest(target=target):
                output, errors = io.StringIO(), io.StringIO()
                with patch(target, side_effect=failure), redirect_stdout(output), \
                        redirect_stderr(errors), self.assertLogs('core.requests', level='INFO') as logs:
                    response = self.client.get(URL)
                self.assert_material_error(response, 500, 'INTERNAL_ERROR')
                self.assertEqual(output.getvalue(), '')
                self.assertEqual(errors.getvalue(), '')
                self.assertNotIn(MARKER, '\n'.join(logs.output))

    @override_settings(DEBUG=True)
    def test_actual_schema_configuration_io_failure_is_redacted(self):
        missing = Path(__file__).with_name(MARKER + '-missing-schema.json')
        self.assertFalse(missing.exists())
        with patch('core.material_schema.SCHEMA_PATH', missing):
            response = self.client.get(URL)
        self.assert_material_error(response, 500, 'INTERNAL_ERROR')

    def test_existing_body_and_csrf_guards_keep_core_envelope_and_skip_provider(self):
        with patch('core.material_http._read_canonical_snapshot') as provider:
            body = self.client.generic('GET', URL, b'x' * 16385)
            self.assertEqual(body.status_code, 413)
            self.assertEqual(body.json()['error']['code'], 'payload_too_large')
            csrf = Client(enforce_csrf_checks=True).post(URL, {MARKER: MARKER})
            self.assertEqual(csrf.status_code, 403)
            self.assertEqual(csrf.json()['error']['code'], 'csrf_failed')
            provider.assert_not_called()

    @override_settings(CORE_RATE_LIMIT_PER_MINUTE=1)
    def test_existing_rate_guard_keeps_core_envelope(self):
        client = Client()
        self.assertEqual(client.get(URL).status_code, 200)
        with patch('core.material_http._read_canonical_snapshot') as provider:
            response = client.get(URL)
            self.assertEqual(response.status_code, 429)
            self.assertEqual(response.json()['error']['code'], 'rate_limited')
            self.assertGreater(int(response['Retry-After']), 0)
            provider.assert_not_called()
