import io
import json
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured
from django.http import JsonResponse
from django.test import Client, RequestFactory, SimpleTestCase, override_settings
from django.urls import path

from core.middleware import APIGuardMiddleware
from core.views import health


def broken(request):
    raise RuntimeError('private exception detail')


urlpatterns = [path('api/v1/health/', health), path('api/v1/broken/', broken)]
handler500 = 'core.views.server_error'


class GuardTests(SimpleTestCase):
    def assert_api(self, response, status, code=None):
        self.assertEqual(response.status_code, status)
        self.assertEqual(response['Content-Type'], 'application/json')
        for name, value in {'X-API-Version': '1', 'Cache-Control': 'no-store',
                            'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
                            'Referrer-Policy': 'no-referrer'}.items():
            self.assertEqual(response[name], value)
        self.assertRegex(response['X-Request-ID'], r'^[0-9a-f]{32}$')
        if code:
            self.assertEqual(response.json()['error']['code'], code)

    def test_read_methods_headers_and_unique_generated_ids(self):
        ids = []
        for url in ('/api/v1/health/', '/api/v1/version/'):
            for method in ('get', 'head'):
                response = getattr(self.client, method)(url, HTTP_X_REQUEST_ID='untrusted')
                self.assert_api(response, 200)
                ids.append(response['X-Request-ID'])
                if method == 'head':
                    self.assertEqual(response.content, b'')
        self.assertEqual(len(ids), len(set(ids)))

    def test_read_only_methods_are_json_405(self):
        for url in ('/api/v1/health/', '/api/v1/version/'):
            for method in ('POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'TRACE'):
                response = self.client.generic(method, url)
                self.assert_api(response, 405, 'method_not_allowed')
                self.assertEqual(response['Allow'], 'GET, HEAD')

    def test_csrf_is_not_disabled_and_denials_have_api_contract(self):
        response = Client(enforce_csrf_checks=True).post('/api/v1/health/', {'token': 'private'})
        self.assert_api(response, 403, 'csrf_failed')
        self.assertNotIn(b'private', response.content)

    def test_unknown_endpoint_and_version(self):
        for url in ('/api/v1/missing/', '/api/v9/health/'):
            self.assert_api(self.client.get(url), 404, 'not_found')

    @override_settings(ROOT_URLCONF=__name__, DEBUG=False)
    def test_server_exception_is_json_without_private_detail(self):
        response = Client(raise_request_exception=False).get('/api/v1/broken/')
        self.assert_api(response, 500, 'internal_error')
        self.assertNotIn(b'private', response.content)

    def test_bad_host_is_json_400(self):
        self.assert_api(self.client.get('/api/v1/health/', HTTP_HOST='untrusted.invalid'), 400, 'invalid_request')

    @override_settings(DATA_UPLOAD_MAX_NUMBER_FIELDS=1)
    def test_parser_rejection_keeps_json_contract(self):
        client = Client(enforce_csrf_checks=True)
        client.cookies['csrftoken'] = 'a' * 32
        response = client.post('/api/v1/health/', {'one': '1', 'two': '2'})
        self.assert_api(response, 400, 'invalid_request')

    def test_payload_boundary(self):
        self.assert_api(self.client.generic('GET', '/api/v1/health/', b'x' * 16384), 200)
        self.assert_api(self.client.generic('GET', '/api/v1/health/', b'x' * 16385), 413, 'payload_too_large')

    def test_malformed_content_length(self):
        guard = APIGuardMiddleware(lambda request: JsonResponse({}))
        for length in ('-1', '+1', '1.2', ' 1', '１', '9' * 21):
            request = RequestFactory().get('/api/v1/health/')
            request.META['CONTENT_LENGTH'] = length
            self.assertEqual(guard(request).status_code, 400)

    def test_actual_body_is_bounded_even_if_length_missing_or_incorrect(self):
        guard = APIGuardMiddleware(lambda request: JsonResponse({'size': len(request.body)}))
        for declared in ('', '1'):
            request = RequestFactory().get('/api/v1/health/')
            request.META['CONTENT_LENGTH'] = declared
            request._stream = io.BytesIO(b'x' * 20000)
            self.assertEqual(guard(request).status_code, 413)
            self.assertEqual(request._stream.tell(), 16385)

    def test_bounded_body_is_preserved_for_views(self):
        guard = APIGuardMiddleware(lambda request: JsonResponse({'value': request.body.decode()}))
        request = RequestFactory().post('/api/v1/health/', b'hello', content_type='text/plain')
        self.assertEqual(json.loads(guard(request).content), {'value': 'hello'})

    @override_settings(CORE_RATE_LIMIT_PER_MINUTE=2)
    def test_rate_limit_retry_and_window_recovery(self):
        guard = APIGuardMiddleware(lambda request: JsonResponse({}))
        def request(now):
            with patch('core.middleware.time.monotonic', return_value=now):
                return guard(RequestFactory().get('/api/v1/health/'))
        self.assertEqual(request(100).status_code, 200)
        self.assertEqual(request(100).status_code, 200)
        limited = request(100)
        self.assertEqual(limited.status_code, 429)
        self.assertEqual(limited['Retry-After'], '60')
        self.assertEqual(request(159.9)['Retry-After'], '1')
        self.assertEqual(request(160).status_code, 200)

    @override_settings(CORE_RATE_LIMIT_PER_MINUTE=7)
    def test_concurrent_limit_does_not_over_admit(self):
        guard = APIGuardMiddleware(lambda request: JsonResponse({}))
        with ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(guard.retry_after, [100] * 50))
        self.assertEqual(results.count(None), 7)
        self.assertEqual(results.count(60), 43)

    def test_limit_configuration_fails_closed(self):
        for value in (0, -1, True, '120'):
            with override_settings(CORE_RATE_LIMIT_PER_MINUTE=value):
                with self.assertRaises(ImproperlyConfigured):
                    APIGuardMiddleware(lambda request: JsonResponse({}))

    def test_safe_structured_log_omits_all_request_data(self):
        with self.assertLogs('core.requests', level='INFO') as captured:
            response = self.client.post('/api/v9/private-path/?secret=private-query',
                                        {'private-body': 'value'}, HTTP_AUTHORIZATION='private-auth',
                                        HTTP_X_REQUEST_ID='private-id', REMOTE_ADDR='192.0.2.25')
        document = json.loads(captured.records[0].getMessage())
        self.assertEqual(set(document), {'api_version', 'request_id', 'method', 'route', 'status', 'duration_ms'})
        self.assertEqual(document['request_id'], response['X-Request-ID'])
        self.assertEqual(document['route'], 'unknown')
        self.assertNotIn('private', captured.output[0])
        self.assertNotIn('192.0.2.25', captured.output[0])

    def test_non_api_is_not_logged_or_throttled(self):
        with self.assertNoLogs('core.requests'):
            response = self.client.get('/unrelated/')
        self.assertEqual(response.status_code, 404)
        self.assertNotIn('X-Request-ID', response)
