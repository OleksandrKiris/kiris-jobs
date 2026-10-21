"""Detail transport guards and redaction, using the accepted local fixture."""
from contextlib import redirect_stderr, redirect_stdout
from copy import deepcopy
import io
import json
from pathlib import Path
from unittest.mock import patch
from uuid import UUID

from django.test import Client, SimpleTestCase, override_settings
from django.urls import resolve

from core.material_detail import material_detail


PREFIX = '/api/v1/materials/'
ROUTE = '/api/v1/materials/{material_id}/'
CONTRACT = Path(__file__).resolve().parents[3] / 'contracts' / 'materials-v1'
SOURCE = 'core.material_detail._read_canonical_detail_snapshot'
SERIALIZER = 'core.material_detail.serialize_material_response'
PRIVATE_ID = 'synthetic-private-detail-id'
PRIVATE_QUERY = 'synthetic-private-detail-query'
PRIVATE_FAULT = 'synthetic-private-detail-fault'
SPOOFED_ID = '11111111111141118111111111111111'


@override_settings(DEBUG=True)
class MaterialDetailGuardTests(SimpleTestCase):
    databases = set()

    def setUp(self):
        self.fixture = json.loads((CONTRACT / 'snapshot.json').read_text(encoding='utf-8'))
        self.material_id = self.fixture['items'][0]['id']
        self.url = PREFIX + self.material_id + '/'
        self.request_ids = set()
        network = patch('socket.socket', side_effect=AssertionError('No network'))
        network.start()
        self.addCleanup(network.stop)

    def assert_headers(self, response):
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        for name, expected in {
            'X-API-Version': '1', 'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
            'Referrer-Policy': 'no-referrer',
        }.items():
            self.assertEqual(response[name], expected)
        request_id = response['X-Request-ID']
        self.assertRegex(request_id, r'^[0-9a-f]{32}$')
        self.assertEqual(UUID(hex=request_id).version, 4)
        self.assertNotEqual(request_id, SPOOFED_ID)
        self.assertNotIn(request_id, self.request_ids)
        self.request_ids.add(request_id)
        self.assertFalse(response.streaming)
        self.assertFalse(response.cookies)
        self.assertNotIn('Set-Cookie', response)
        self.assertNotIn('Location', response)

    def request_logged(self, request, *, method='GET', raw_id='', raw_query=''):
        output, errors = io.StringIO(), io.StringIO()
        with redirect_stdout(output), redirect_stderr(errors), \
                self.assertLogs('core.requests', level='INFO') as captured:
            response = request()
        self.assertEqual(output.getvalue(), '')
        self.assertEqual(errors.getvalue(), '')
        self.assert_headers(response)
        self.assertEqual(len(captured.records), 1)
        event = json.loads(captured.records[0].getMessage())
        self.assertEqual(set(event), {
            'api_version', 'request_id', 'method', 'route', 'status', 'duration_ms',
        })
        self.assertEqual(event['api_version'], '1')
        self.assertEqual(event['request_id'], response['X-Request-ID'])
        self.assertEqual(event['method'], 'OTHER' if method == 'CONNECT' else method)
        self.assertEqual(event['route'], ROUTE)
        self.assertEqual(event['status'], response.status_code)
        self.assertIs(type(event['duration_ms']), int)
        self.assertGreaterEqual(event['duration_ms'], 0)
        logged = '\n'.join(captured.output)
        for marker in (PRIVATE_ID, PRIVATE_QUERY, PRIVATE_FAULT, SPOOFED_ID,
                       '192.0.2.63', raw_id, raw_query):
            if marker:
                self.assertNotIn(marker, logged)
        return response

    def assert_material_error(self, response, status, code):
        self.assertEqual(response.status_code, status)
        self.assertEqual(response['Content-Type'], 'application/json; charset=utf-8')
        self.assertEqual(response['Content-Length'], str(len(response.content)))
        self.assertEqual(response.json(), {
            'code': code, 'request_id': response['X-Request-ID'],
        })
        self.assertLess(len(response.content), 256)
        self.assert_redacted(response)

    def assert_core_error(self, response, status, code):
        self.assertEqual(response.status_code, status)
        document = response.json()
        self.assertEqual(set(document), {'api_version', 'error'})
        self.assertEqual(document['api_version'], '1')
        self.assertEqual(set(document['error']), {'code', 'message'})
        self.assertEqual(document['error']['code'], code)
        self.assertIs(type(document['error']['message']), str)
        self.assertTrue(document['error']['message'])
        self.assert_redacted(response)

    def assert_redacted(self, response):
        for marker in (PRIVATE_ID, PRIVATE_QUERY, PRIVATE_FAULT, SPOOFED_ID, 'Traceback'):
            self.assertNotIn(marker.encode('utf-8'), response.content)

    def malformed_paths(self):
        return (
            PREFIX + PRIVATE_ID + '/',
            PREFIX + PRIVATE_ID + '/nested/',
            PREFIX + PRIVATE_ID + '%0Ainvalid/',
            PREFIX + '/',
        )

    def test_real_get_has_detail_route_fresh_ids_and_only_template_logs(self):
        self.assertEqual(resolve(self.url).url_name, 'core-material-detail')
        self.assertIs(resolve(self.url).func, material_detail)
        for query in ('', 'language=ru&location_id=zgorzelec'):
            target = self.url + ('?' + query if query else '')
            response = self.request_logged(
                lambda: self.client.get(
                    target, HTTP_X_REQUEST_ID=SPOOFED_ID,
                    HTTP_AUTHORIZATION=PRIVATE_FAULT, REMOTE_ADDR='192.0.2.63'),
                raw_id=self.material_id, raw_query=query,
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response['Content-Length'], str(len(response.content)))
            self.assertEqual(response.json()['items'], [self.fixture['items'][0]])

    def test_head_and_other_methods_skip_provider_and_serializer(self):
        query = 'unknown=' + PRIVATE_QUERY
        head_length = None
        error_lengths = set()
        with patch(SOURCE) as provider, patch(SERIALIZER) as serializer:
            for method in ('HEAD', 'POST', 'PUT', 'PATCH', 'DELETE',
                           'OPTIONS', 'TRACE', 'CONNECT'):
                with self.subTest(method=method):
                    response = self.request_logged(
                        lambda: self.client.generic(
                            method, self.url + '?' + query,
                            HTTP_X_REQUEST_ID=SPOOFED_ID),
                        method=method, raw_id=self.material_id, raw_query=query,
                    )
                    self.assertEqual(response.status_code, 405)
                    self.assertEqual(response['Allow'], 'GET')
                    if method == 'HEAD':
                        self.assertEqual(response.content, b'')
                        head_length = int(response['Content-Length'])
                        self.assertGreater(head_length, 0)
                    else:
                        self.assert_material_error(response, 405, 'METHOD_NOT_ALLOWED')
                        error_lengths.add(len(response.content))
            provider.assert_not_called()
            serializer.assert_not_called()
        self.assertEqual(error_lengths, {head_length})

    @override_settings(DATA_UPLOAD_MAX_NUMBER_FIELDS=1)
    def test_query_parser_failure_is_redacted_and_skips_provider_and_serializer(self):
        query = 'language=ru&location_id=' + PRIVATE_QUERY
        with patch(SOURCE) as provider, patch(SERIALIZER) as serializer:
            response = self.request_logged(
                lambda: self.client.get(self.url + '?' + query,
                                        HTTP_X_REQUEST_ID=SPOOFED_ID),
                raw_id=self.material_id, raw_query=query,
            )
        self.assert_material_error(response, 400, 'INVALID_QUERY')
        provider.assert_not_called()
        serializer.assert_not_called()

    def test_real_query_id_and_not_found_errors_have_trusted_ids_and_safe_logs(self):
        cases = (
            (self.url, 'unknown=' + PRIVATE_QUERY, self.material_id,
             400, 'INVALID_QUERY'),
            (PREFIX + PRIVATE_ID + '_bad/', '', PRIVATE_ID + '_bad',
             400, 'INVALID_MATERIAL_ID'),
            (PREFIX + PRIVATE_ID + '/', '', PRIVATE_ID,
             404, 'MATERIAL_NOT_FOUND'),
        )
        for url, query, raw_id, status, code in cases:
            with self.subTest(code=code):
                target = url + ('?' + query if query else '')
                response = self.request_logged(
                    lambda: self.client.get(target, HTTP_X_REQUEST_ID=SPOOFED_ID),
                    raw_id=raw_id, raw_query=query,
                )
                self.assert_material_error(response, status, code)

    def test_provider_error_fields_cannot_supply_ids_headers_or_private_details(self):
        for status, code in ((400, 'INVALID_QUERY'), (500, 'INTERNAL_ERROR')):
            with self.subTest(status=status):
                supplied = {
                    'code': code, 'request_id': SPOOFED_ID,
                    'headers': {'Set-Cookie': PRIVATE_FAULT, 'Location': PRIVATE_FAULT},
                    'detail': PRIVATE_FAULT,
                }
                before = deepcopy(supplied)
                with patch(SOURCE, return_value=(status, supplied)), \
                        patch(SERIALIZER) as serializer:
                    response = self.request_logged(
                        lambda: self.client.get(self.url, HTTP_X_REQUEST_ID=SPOOFED_ID),
                        raw_id=self.material_id,
                    )
                self.assert_material_error(response, status, code)
                self.assertEqual(supplied, before)
                serializer.assert_not_called()

    def test_provider_and_serializer_faults_are_redacted_even_in_debug(self):
        for target, failure in (
            (SOURCE, OSError(PRIVATE_FAULT + '/private-snapshot.json')),
            (SERIALIZER, OverflowError(PRIVATE_FAULT)),
        ):
            with self.subTest(target=target), patch(target, side_effect=failure):
                response = self.request_logged(
                    lambda: self.client.get(self.url, HTTP_X_REQUEST_ID=SPOOFED_ID),
                    raw_id=self.material_id,
                )
                self.assert_material_error(response, 500, 'INTERNAL_ERROR')

    def test_body_boundary_and_early_413_keep_core_errors_and_template_logs(self):
        with patch(SOURCE, return_value=(200, deepcopy(self.fixture))) as provider:
            response = self.request_logged(
                lambda: self.client.generic(
                    'GET', self.url, b'x' * 16384,
                    HTTP_X_REQUEST_ID=SPOOFED_ID),
                raw_id=self.material_id,
            )
        self.assertEqual(response.status_code, 200)
        provider.assert_called_once()
        query = 'unknown=' + PRIVATE_QUERY
        with patch(SOURCE) as provider, patch(SERIALIZER) as serializer:
            for url in (self.url,) + self.malformed_paths():
                with self.subTest(url=url):
                    response = self.request_logged(
                        lambda: self.client.generic(
                            'GET', url + '?' + query, b'x' * 16385,
                            HTTP_X_REQUEST_ID=SPOOFED_ID),
                        raw_query=query,
                    )
                    self.assert_core_error(response, 413, 'payload_too_large')
            provider.assert_not_called()
            serializer.assert_not_called()

    @override_settings(CORE_RATE_LIMIT_PER_MINUTE=1)
    def test_rate_guard_runs_before_lookup_and_uses_template_for_each_id(self):
        client = Client()
        with patch('core.middleware.time.monotonic', return_value=100.0):
            response = self.request_logged(
                lambda: client.get(self.url, HTTP_X_REQUEST_ID=SPOOFED_ID),
                raw_id=self.material_id,
            )
            self.assertEqual(response.status_code, 200)
            query = 'unknown=' + PRIVATE_QUERY
            with patch(SOURCE) as provider, patch(SERIALIZER) as serializer:
                for url in (self.url,) + self.malformed_paths():
                    with self.subTest(url=url):
                        response = self.request_logged(
                            lambda: client.get(url + '?' + query,
                                               HTTP_X_REQUEST_ID=SPOOFED_ID),
                            raw_query=query,
                        )
                        self.assert_core_error(response, 429, 'rate_limited')
                        self.assertGreater(int(response['Retry-After']), 0)
                provider.assert_not_called()
                serializer.assert_not_called()

    def test_csrf_and_invalid_hosts_preserve_core_errors_without_source_work(self):
        query = 'unknown=' + PRIVATE_QUERY
        with patch(SOURCE) as provider, patch(SERIALIZER) as serializer:
            response = self.request_logged(
                lambda: Client(enforce_csrf_checks=True).post(
                    self.url + '?' + query, {'private-body': PRIVATE_FAULT},
                    HTTP_X_REQUEST_ID=SPOOFED_ID),
                method='POST', raw_id=self.material_id, raw_query=query,
            )
            self.assert_core_error(response, 403, 'csrf_failed')
            for url in (self.url,) + self.malformed_paths():
                with self.subTest(url=url):
                    response = self.request_logged(
                        lambda: self.client.get(
                            url + '?' + query, HTTP_HOST=PRIVATE_ID + '.invalid',
                            HTTP_X_REQUEST_ID=SPOOFED_ID),
                        raw_query=query,
                    )
                    self.assert_core_error(response, 400, 'invalid_request')
            provider.assert_not_called()
            serializer.assert_not_called()
