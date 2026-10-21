"""Actual byte limits and failure behavior for local material serialization."""
from contextlib import redirect_stderr, redirect_stdout
from copy import deepcopy
import io
import json
import unittest
from unittest.mock import patch

from core.material_response import (
    MAX_MATERIAL_RESPONSE_BYTES, MaterialResponseError,
    MaterialResponseTooLarge, serialize_material_response,
)
from core.material_schema import SCHEMA_PATH


class MaterialResponseTests(unittest.TestCase):
    def setUp(self):
        self.fixture = json.loads(SCHEMA_PATH.with_name('snapshot.json').read_text(encoding='utf-8'))
        network = patch('socket.socket', side_effect=AssertionError('No network'))
        network.start()
        self.addCleanup(network.stop)

    def padded(self, size, unit='a'):
        document = deepcopy(self.fixture)
        document['transport_test_padding'] = ''
        remaining = size - len(serialize_material_response(document))
        self.assertGreater(remaining, 0)
        width = len(unit.encode('utf-8'))
        document['transport_test_padding'] = unit * (remaining // width) + 'a' * (remaining % width)
        return document

    def assert_invalid(self, document):
        # Synthetic marker only. No exception, log or partial response may echo it.
        output, errors = io.StringIO(), io.StringIO()
        with redirect_stdout(output), redirect_stderr(errors), self.assertNoLogs(level='DEBUG'):
            with self.assertRaises(MaterialResponseError) as failure:
                serialize_material_response(document)
        self.assertIs(type(failure.exception), MaterialResponseError)
        self.assertEqual(failure.exception.args, ('Material response is invalid or cannot be encoded.',))
        self.assertIsNone(failure.exception.__context__)
        self.assertIsNone(failure.exception.__cause__)
        self.assertEqual(output.getvalue(), '')
        self.assertEqual(errors.getvalue(), '')

    def test_canonical_fixture_round_trips_without_mutation(self):
        before = deepcopy(self.fixture)
        body = serialize_material_response(self.fixture)
        self.assertIs(type(body), bytes)
        self.assertEqual(json.loads(body), before)
        self.assertIn(before['items'][0]['title'].encode('utf-8'), body)
        self.assertEqual(self.fixture, before)
        self.assertLess(len(body), MAX_MATERIAL_RESPONSE_BYTES)

    def test_exact_32768_bytes_is_accepted(self):
        document = self.padded(32_768)
        before = deepcopy(document)
        body = serialize_material_response(document)
        self.assertEqual(len(body), 32_768)
        self.assertEqual(json.loads(body), before)
        self.assertEqual(document, before)

    def test_32769_bytes_is_rejected_without_returning_partial_output(self):
        document = self.padded(32_769)
        before = deepcopy(document)
        result = None
        output, errors = io.StringIO(), io.StringIO()
        with redirect_stdout(output), redirect_stderr(errors), self.assertNoLogs(level='DEBUG'):
            with self.assertRaises(MaterialResponseTooLarge) as failure:
                result = serialize_material_response(document)
        self.assertEqual(output.getvalue(), '')
        self.assertEqual(errors.getvalue(), '')
        self.assertIsNone(result)
        self.assertEqual(failure.exception.args, ('Material response exceeds 32768 UTF-8 bytes.',))
        self.assertIsNone(failure.exception.__context__)
        self.assertIsNone(failure.exception.__cause__)
        self.assertEqual(document, before)

    def test_multibyte_limit_counts_encoded_bytes_not_characters(self):
        document = self.padded(32_768, unit='é🙂')
        body = serialize_material_response(document)
        self.assertEqual(len(body), 32_768)
        self.assertLess(len(body.decode('utf-8')), 32_768)
        document['transport_test_padding'] += 'a'
        with self.assertRaises(MaterialResponseTooLarge):
            serialize_material_response(document)

    def test_schema_and_date_failures_are_generic(self):
        for change in ('title', 'date', 'version'):
            with self.subTest(change=change):
                document = deepcopy(self.fixture)
                document['transport_test_padding'] = 'synthetic-transport-marker'
                if change == 'title':
                    del document['items'][0]['title']
                elif change == 'date':
                    document['items'][0]['source']['verified_on'] = '2026-02-30'
                else:
                    document['api_version'] = 'unsupported'
                before = deepcopy(document)
                self.assert_invalid(document)
                self.assertEqual(document, before)

    def test_nonfinite_numbers_and_unsupported_values_are_rejected(self):
        for value in (float('nan'), float('inf'), -float('inf'),
                      {'synthetic-transport-marker'}, b'synthetic-transport-marker',
                      object(), '\ud800'):
            with self.subTest(value_type=type(value).__name__):
                document = deepcopy(self.fixture)
                document['transport_test_padding'] = value
                self.assert_invalid(document)
                self.assertIs(document['transport_test_padding'], value)

    def test_nonstring_keys_are_never_coerced_or_dropped(self):
        for key in (1, True, None, ('synthetic-transport-marker',)):
            with self.subTest(key_type=type(key).__name__):
                document = deepcopy(self.fixture)
                document['transport_test_padding'] = {'1': 'unchanged', key: 'synthetic-transport-marker'}
                before = deepcopy(document)
                self.assert_invalid(document)
                self.assertEqual(document, before)

    def test_cycles_fail_without_changing_the_input(self):
        cycle = []
        cycle.append(cycle)
        document = deepcopy(self.fixture)
        document['transport_test_padding'] = cycle
        self.assert_invalid(document)
        self.assertIs(cycle[0], cycle)
        self.assertEqual(len(cycle), 1)
