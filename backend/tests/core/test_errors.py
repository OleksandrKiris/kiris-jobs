from django.test import SimpleTestCase


class NegativeTests(SimpleTestCase):
    def test_unknown_version_returns_structured_404(self):
        response = self.client.get("/api/v9/missing/")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["api_version"], "1")
        self.assertEqual(response.json()["error"]["code"], "not_found")
