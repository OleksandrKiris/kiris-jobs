"""Canonical capabilities proof and separate injected boundary failures.

Requires the owner-14 capabilities contract to be present at its accepted pin.
There is deliberately no skip or replacement fixture when that input is absent.
"""
from contextlib import contextmanager, redirect_stderr, redirect_stdout
from copy import deepcopy
import io
import json
from pathlib import Path
from unittest.mock import patch

from django.test import Client, SimpleTestCase, override_settings
from django.urls import resolve
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry

import core.capabilities as capabilities_api
from core.protocol import API_VERSION, SERVICE_NAME, SERVICE_VERSION


URL = '/api/v1/capabilities/'
MATERIALS_URL = '/api/v1/materials/'
MARKER = 'synthetic-private-capabilities-marker'


class CapabilitiesTests(SimpleTestCase):
    def setUp(self):
        network = patch('socket.socket', side_effect=AssertionError('No network'))
        network.start()
        self.addCleanup(network.stop)
        self.openapi_path = capabilities_api.MATERIAL_OPENAPI_PATH
        self.schema_path = capabilities_api.CAPABILITIES_SCHEMA_PATH
        self.snapshot_path = self.schema_path.with_name('snapshot.json')
        self.openapi_bytes = self.openapi_path.read_bytes()
        self.schema_bytes = self.schema_path.read_bytes()
        self.snapshot_bytes = self.snapshot_path.read_bytes()
        self.openapi = json.loads(self.openapi_bytes)
        self.schema = json.loads(self.schema_bytes)
        self.snapshot = json.loads(self.snapshot_bytes)
        Draft202012Validator.check_schema(self.schema)
        self.validate = Draft202012Validator(
            self.schema, format_checker=FormatChecker(), registry=Registry(),
        ).validate

    def parameters(self, document=None):
        source = self.openapi if document is None else document
        return source['paths'][MATERIALS_URL]['get']['parameters']

    def parameter(self, name, document=None):
        matches = [entry for entry in self.parameters(document)
                   if entry.get('name') == name and entry.get('in') == 'query']
        self.assertEqual(len(matches), 1)
        return matches[0]

    @contextmanager
    def canonical_content(self, path, content):
        """Inject bytes at one canonical read boundary; never write a fixture."""
        target = Path(path)
        original_bytes, original_text = Path.read_bytes, Path.read_text

        def read_bytes(candidate, *args, **kwargs):
            if Path(candidate) == target:
                return content
            return original_bytes(candidate, *args, **kwargs)

        def read_text(candidate, *args, **kwargs):
            if Path(candidate) == target:
                return content.decode('utf-8')
            return original_text(candidate, *args, **kwargs)

        with patch.object(Path, 'read_bytes', new=read_bytes), \
                patch.object(Path, 'read_text', new=read_text):
            yield

    @contextmanager
    def canonical_json(self, path, document):
        encoded = json.dumps(document, ensure_ascii=True).encode('utf-8')
        with self.canonical_content(path, encoded):
            yield

    def assert_metadata_failure(self):
        output, errors = io.StringIO(), io.StringIO()
        with redirect_stdout(output), redirect_stderr(errors), \
                self.assertNoLogs(level='DEBUG'):
            with self.assertRaises(capabilities_api.CapabilitiesMetadataError) as failure:
                capabilities_api.capabilities_document()
        error = failure.exception
        self.assertIs(type(error), capabilities_api.CapabilitiesMetadataError)
        self.assertEqual(error.args, ('Capabilities metadata is unavailable.',))
        self.assertNotIn(MARKER, str(error))
        self.assertNotIn('Traceback', str(error))
        self.assertIsNone(error.__context__)
        self.assertIsNone(error.__cause__)
        self.assertEqual(output.getvalue(), '')
        self.assertEqual(errors.getvalue(), '')

    def assert_headers(self, response):
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        self.assertEqual(response['Content-Length'], str(len(response.content)))
        self.assertEqual(response['Cache-Control'], 'no-store')
        self.assertEqual(response['X-Content-Type-Options'], 'nosniff')
        self.assertEqual(response['X-API-Version'], API_VERSION)
        self.assertRegex(response['X-Request-ID'], r'^[0-9a-f]{32}$')
        self.assertFalse(response.streaming)
        self.assertFalse(response.cookies)
        self.assertNotIn('Set-Cookie', response)
        self.assertNotIn('Location', response)

    def assert_core_error(self, response, status, code, *, own_response=True):
        self.assertEqual(response.status_code, status)
        if own_response:
            self.assert_headers(response)
        document = response.json()
        self.assertEqual(set(document), {'api_version', 'error'})
        self.assertEqual(document['api_version'], API_VERSION)
        self.assertEqual(set(document['error']), {'code', 'message'})
        self.assertEqual(document['error']['code'], code)
        self.assertIs(type(document['error']['message']), str)
        self.assertNotIn(MARKER.encode(), response.content)
        self.assertNotIn(b'Traceback', response.content)

    def test_real_factory_matches_canonical_snapshot_schema_and_protocol_identity(self):
        document = capabilities_api.capabilities_document()
        self.validate(document)
        self.assertEqual(document, self.snapshot)
        self.assertEqual(set(document), {
            'api_version', 'service', 'version', 'capabilities', 'data_source',
        })
        self.assertEqual(document['api_version'], API_VERSION)
        self.assertEqual(document['service'], SERVICE_NAME)
        self.assertEqual(document['version'], SERVICE_VERSION)
        self.assertEqual(document['data_source'], 'local_mock')
        self.assertEqual(set(document['capabilities']), {'materials'})
        materials = document['capabilities']['materials']
        self.assertEqual(set(materials), {
            'contract', 'path', 'methods', 'languages', 'max_limit',
        })
        self.assertEqual(materials['path'], MATERIALS_URL)
        self.assertEqual(materials['methods'], ['GET'])
        self.assertEqual(materials['languages'], self.parameter('language')['schema']['enum'])
        self.assertEqual(materials['max_limit'], self.parameter('limit')['schema']['maximum'])
        self.assertIs(type(materials['max_limit']), int)

    def test_factory_uses_protocol_version_instead_of_freezing_the_snapshot(self):
        expected = deepcopy(self.snapshot)
        expected['version'] = '2.3.4'
        with patch('core.protocol.SERVICE_VERSION', '2.3.4'):
            document = capabilities_api.capabilities_document()
        self.validate(document)
        self.assertEqual(document, expected)

    def test_injected_source_order_and_maximum_are_copied_not_replaced_by_literals(self):
        # This is a metadata-read fault boundary, not proof that a changed limit
        # is supported by the real materials endpoint. Real parity is separate.
        source = deepcopy(self.openapi)
        language = self.parameter('language', source)['schema']
        language['enum'] = list(reversed(language['enum']))
        limit = self.parameter('limit', source)['schema']
        limit['maximum'] += 1
        before = deepcopy(source)
        with self.canonical_json(self.openapi_path, source):
            document = capabilities_api.capabilities_document()
        self.validate(document)
        self.assertEqual(document['capabilities']['materials']['languages'], language['enum'])
        self.assertEqual(document['capabilities']['materials']['max_limit'], limit['maximum'])
        self.assertEqual(source, before)

    def test_real_get_route_matches_canonical_document_as_bounded_utf8(self):
        self.assertIs(resolve(URL).func, capabilities_api.capabilities)
        response = self.client.get(URL)
        self.assertEqual(response.status_code, 200)
        self.assert_headers(response)
        document = json.loads(response.content.decode('utf-8', errors='strict'))
        self.validate(document)
        self.assertEqual(document, self.snapshot)
        self.assertEqual(document, capabilities_api.capabilities_document())
        self.assertEqual(capabilities_api.MAX_CAPABILITIES_RESPONSE_BYTES, 4096)
        self.assertLessEqual(len(response.content), capabilities_api.MAX_CAPABILITIES_RESPONSE_BYTES)
        self.assertEqual(self.client.get('/api/v9/capabilities/').status_code, 404)
        self.assertEqual(self.client.get(URL + 'missing/').status_code, 404)

    def test_advertised_canonical_languages_and_limit_work_in_real_materials_get(self):
        materials = capabilities_api.capabilities_document()['capabilities']['materials']
        self.assertEqual(materials['languages'], self.parameter('language')['schema']['enum'])
        for language in materials['languages']:
            with self.subTest(language=language):
                response = self.client.get(materials['path'], {
                    'language': language, 'limit': str(materials['max_limit']),
                })
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()['requested_language'], language)
                self.assertLessEqual(len(response.json()['items']), materials['max_limit'])

    def test_factory_returns_fresh_nested_values_and_preserves_canonical_inputs(self):
        first = capabilities_api.capabilities_document()
        before = deepcopy(first)
        second = capabilities_api.capabilities_document()
        self.assertIsNot(first, second)
        self.assertIsNot(first['capabilities'], second['capabilities'])
        self.assertIsNot(first['capabilities']['materials'], second['capabilities']['materials'])
        self.assertIsNot(first['capabilities']['materials']['languages'],
                         second['capabilities']['materials']['languages'])
        first['capabilities']['materials']['languages'].append(MARKER)
        first['capabilities']['materials']['methods'].append(MARKER)
        self.assertEqual(second, before)
        self.assertEqual(capabilities_api.capabilities_document(), before)
        self.assertEqual(self.openapi_path.read_bytes(), self.openapi_bytes)
        self.assertEqual(self.schema_path.read_bytes(), self.schema_bytes)
        self.assertEqual(self.snapshot_path.read_bytes(), self.snapshot_bytes)

    def test_head_and_other_methods_short_circuit_without_factory(self):
        with patch('core.capabilities.capabilities_document') as factory:
            for method in ('HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'TRACE', 'CONNECT'):
                with self.subTest(method=method):
                    response = self.client.generic(method, URL)
                    self.assertEqual(response.status_code, 405)
                    self.assertEqual(response['Allow'], 'GET')
                    if method == 'HEAD':
                        self.assertEqual(response.content, b'')
                        self.assertGreater(int(response['Content-Length']), 0)
                    else:
                        self.assert_core_error(response, 405, 'method_not_allowed')
            factory.assert_not_called()

    def test_malformed_or_duplicate_canonical_query_descriptors_fail_closed(self):
        for mutation in ('duplicate', 'missing', 'wrong_in', 'nonobject'):
            with self.subTest(mutation=mutation):
                source = deepcopy(self.openapi)
                parameters = self.parameters(source)
                language = self.parameter('language', source)
                if mutation == 'duplicate':
                    parameters.append(deepcopy(language))
                elif mutation == 'missing':
                    parameters.remove(language)
                elif mutation == 'wrong_in':
                    language['in'] = MARKER
                else:
                    parameters.append(MARKER)
                with self.canonical_json(self.openapi_path, source):
                    self.assert_metadata_failure()

    def test_bool_or_noninteger_canonical_maximum_is_not_advertised(self):
        for maximum in (True, MARKER, None):
            with self.subTest(maximum_type=type(maximum).__name__):
                source = deepcopy(self.openapi)
                self.parameter('limit', source)['schema']['maximum'] = maximum
                with self.canonical_json(self.openapi_path, source):
                    self.assert_metadata_failure()

    def test_nonstring_or_duplicate_canonical_languages_are_not_advertised(self):
        for mutation in ('nonstring', 'duplicate', 'not_array', 'empty'):
            with self.subTest(mutation=mutation):
                source = deepcopy(self.openapi)
                descriptor = self.parameter('language', source)['schema']
                languages = descriptor['enum']
                if mutation == 'nonstring':
                    languages.append(12)
                elif mutation == 'duplicate':
                    languages.append(languages[0])
                elif mutation == 'not_array':
                    descriptor['enum'] = MARKER
                else:
                    descriptor['enum'] = []
                with self.canonical_json(self.openapi_path, source):
                    self.assert_metadata_failure()

    def test_malformed_canonical_json_is_a_fixed_metadata_failure(self):
        for path in (self.openapi_path, self.schema_path):
            with self.subTest(path=path.name):
                with self.canonical_content(path, ('{' + MARKER).encode('utf-8')):
                    self.assert_metadata_failure()

    def test_factory_actually_applies_canonical_schema_and_never_fetches_refs(self):
        schemas = [
            {'$schema': 'https://json-schema.org/draft/2020-12/schema', 'not': {}},
            {'$schema': 'https://json-schema.org/draft/2020-12/schema',
             '$ref': 'https://invalid.example/' + MARKER},
        ]
        for schema in schemas:
            with self.subTest(schema_keys=tuple(schema)):
                with self.canonical_json(self.schema_path, schema):
                    self.assert_metadata_failure()

    def test_missing_canonical_openapi_or_schema_is_a_fixed_metadata_failure(self):
        for constant in ('MATERIAL_OPENAPI_PATH', 'CAPABILITIES_SCHEMA_PATH'):
            with self.subTest(constant=constant):
                missing = Path(__file__).with_name(MARKER + '-' + constant + '.json')
                self.assertFalse(missing.exists())
                with patch.object(capabilities_api, constant, missing):
                    self.assert_metadata_failure()

    @override_settings(DEBUG=True)
    def test_real_canonical_io_failures_are_generic_http_500_even_in_debug(self):
        for constant in ('MATERIAL_OPENAPI_PATH', 'CAPABILITIES_SCHEMA_PATH'):
            with self.subTest(constant=constant):
                missing = Path(__file__).with_name(MARKER + '-' + constant + '.json')
                self.assertFalse(missing.exists())
                output, errors = io.StringIO(), io.StringIO()
                with patch.object(capabilities_api, constant, missing), \
                        redirect_stdout(output), redirect_stderr(errors), \
                        self.assertLogs('core.requests', level='INFO') as logs:
                    response = self.client.get(URL)
                self.assert_core_error(response, 500, 'internal_error')
                self.assertEqual(output.getvalue(), '')
                self.assertEqual(errors.getvalue(), '')
                self.assertNotIn(MARKER, '\n'.join(logs.output))

    @override_settings(DEBUG=True)
    def test_injected_oversize_is_a_separate_http_transport_cap_proof(self):
        document = deepcopy(self.snapshot)
        document['transport_test_padding'] = MARKER * capabilities_api.MAX_CAPABILITIES_RESPONSE_BYTES
        before = deepcopy(document)
        with patch('core.capabilities.capabilities_document', return_value=document):
            response = self.client.get(URL)
        self.assert_core_error(response, 500, 'internal_error')
        self.assertLessEqual(len(response.content), capabilities_api.MAX_CAPABILITIES_RESPONSE_BYTES)
        self.assertNotIn(b'transport_test_padding', response.content)
        self.assertEqual(document, before)

    @override_settings(DEBUG=True)
    def test_injected_unencodable_document_is_generic_not_a_debug_page(self):
        document = deepcopy(self.snapshot)
        document['transport_test_fault'] = MARKER + '\ud800'
        before = deepcopy(document)
        with patch('core.capabilities.capabilities_document', return_value=document):
            response = self.client.get(URL)
        self.assert_core_error(response, 500, 'internal_error')
        self.assertNotIn(b'transport_test_fault', response.content)
        self.assertEqual(document, before)

    def test_header_and_structured_log_share_fresh_server_id_without_body_id(self):
        with self.assertLogs('core.requests', level='INFO') as logs:
            response = self.client.get(URL, HTTP_X_REQUEST_ID=MARKER)
        self.assertEqual(response.status_code, 200)
        self.assert_headers(response)
        self.assertNotEqual(response['X-Request-ID'], MARKER)
        self.assertNotIn('request_id', response.json())
        event = json.loads(logs.records[0].getMessage())
        self.assertEqual(set(event), {'api_version', 'request_id', 'method', 'route',
                                     'status', 'duration_ms'})
        self.assertEqual(event['request_id'], response['X-Request-ID'])
        self.assertEqual(event['route'], 'capabilities')
        self.assertNotIn(MARKER, '\n'.join(logs.output))
        again = self.client.get(URL, HTTP_X_REQUEST_ID=MARKER)
        self.assertNotEqual(again['X-Request-ID'], response['X-Request-ID'])

    def test_body_and_csrf_guards_keep_existing_core_envelope_before_factory(self):
        with patch('core.capabilities.capabilities_document') as factory:
            response = self.client.generic('GET', URL, b'x' * 16385)
            self.assert_core_error(response, 413, 'payload_too_large', own_response=False)
            csrf = Client(enforce_csrf_checks=True).post(URL, {MARKER: MARKER})
            self.assert_core_error(csrf, 403, 'csrf_failed', own_response=False)
            factory.assert_not_called()

    @override_settings(CORE_RATE_LIMIT_PER_MINUTE=1)
    def test_rate_guard_keeps_existing_core_envelope_before_factory(self):
        client = Client()
        self.assertEqual(client.get(URL).status_code, 200)
        with patch('core.capabilities.capabilities_document') as factory:
            response = client.get(URL)
            self.assert_core_error(response, 429, 'rate_limited', own_response=False)
            self.assertGreater(int(response['Retry-After']), 0)
            factory.assert_not_called()
