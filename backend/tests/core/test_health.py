from django.test import SimpleTestCase


class HealthTests(SimpleTestCase):
    def test_health_and_version(self):
        health = self.client.get("/api/v1/health/")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.json(), {
            "api_version": "1", "service": "primserv-core", "status": "ok",
        })
        self.assertLess(len(health.content), 256)
        version = self.client.get("/api/v1/version/")
        self.assertEqual(version.status_code, 200)
        self.assertEqual(version.json()["version"], "0.1.0")
