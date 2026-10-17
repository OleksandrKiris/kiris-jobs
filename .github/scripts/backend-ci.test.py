"""Process-level regression checks with synthetic temporary repositories."""
from pathlib import Path
import importlib.util
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("backend-ci.py")
PASS = "import unittest\nclass Check(unittest.TestCase):\n def test_value(self): self.assertEqual(2 + 2, 4)\n"
FAIL = "import unittest\nclass Check(unittest.TestCase):\n def test_value(self): self.fail('intentional fixture failure')\n"


class BackendGateTests(unittest.TestCase):
    def invoke(self, files):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for name, content in files.items():
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content)
            return subprocess.run([sys.executable, str(SCRIPT), "--root", folder],
                                  capture_output=True, text=True, timeout=30)

    def test_absent_backend_is_explicit(self):
        result = self.invoke({})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("not applicable", result.stdout)

    def test_present_backend_without_tests_fails(self):
        result = self.invoke({"backend/domain/model.py": "value = 1\n"})
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("no test_*.py", result.stderr)

    def test_passing_test_runs_in_namespace_directory(self):
        result = self.invoke({"backend/tests/domain/test_sample.py": PASS})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Ran 1 test", result.stderr)

    def test_failing_test_is_not_skipped(self):
        result = self.invoke({"backend/tests/domain/test_sample.py": FAIL})
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("intentional fixture failure", result.stderr)

    def test_an_empty_test_file_fails(self):
        result = self.invoke({"backend/tests/domain/test_empty.py": "# no tests\n"})
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("No tests discovered", result.stderr)

    def test_nested_duplicate_filenames_are_both_run(self):
        result = self.invoke({"backend/tests/a/test_same.py": PASS,
                              "backend/tests/b/nested/test_same.py": FAIL})
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Ran 2 tests", result.stderr)

    def test_import_error_fails(self):
        result = self.invoke({"backend/tests/domain/test_import.py": "import missing_fixture_dependency\n"})
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("ModuleNotFoundError", result.stderr)

    def test_incomplete_django_core_fails(self):
        result = self.invoke({"backend/manage.py": "", "backend/tests/core/test_sample.py": PASS})
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Incomplete Django core", result.stderr)

    @unittest.skipUnless(importlib.util.find_spec("django"), "Django core not present in this checkout")
    def test_django_failure_blocks_the_gate(self):
        result = self.invoke(self.django_fixture(FAIL, ":memory:"))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("intentional fixture failure", result.stderr)

    @unittest.skipUnless(importlib.util.find_spec("django"), "Django core not present in this checkout")
    def test_django_refuses_file_database_before_running_tests(self):
        result = self.invoke(self.django_fixture(PASS, "must-not-open.sqlite3"))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("only permits in-memory SQLite", result.stderr)
        self.assertNotIn("Ran 1 test", result.stderr)

    @staticmethod
    def django_fixture(test, database):
        return {
            "backend/manage.py": "",
            "backend/requirements.txt": "",
            "backend/config/__init__.py": "",
            "backend/config/settings/__init__.py": "",
            "backend/config/settings/test.py": (
                "SECRET_KEY = 'synthetic-local-ci-only'\n"
                "INSTALLED_APPS = []\nROOT_URLCONF = 'config.urls'\n"
                "DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', "
                f"'NAME': {database!r}, 'TEST': {{'NAME': ':memory:'}}}}}}\n"
            ),
            "backend/config/urls.py": "urlpatterns = []\n",
            "backend/tests/core/test_fixture.py": test,
        }


if __name__ == "__main__":
    unittest.main(verbosity=2)
