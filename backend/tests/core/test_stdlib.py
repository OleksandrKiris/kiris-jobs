"""Pure contract smoke test works without Django installed."""
import unittest

from core.protocol import error_document


class DocumentTests(unittest.TestCase):
    def test_error_shape(self):
        value = error_document("not_found", "Missing.")
        self.assertEqual(value, {
            "api_version": "1",
            "error": {"code": "not_found", "message": "Missing."},
        })
