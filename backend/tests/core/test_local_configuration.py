"""Local configuration must ignore synthetic deployment configuration."""
import json
import os
from pathlib import Path
import subprocess
import sys

from django.core.management import call_command
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import SimpleTestCase, TransactionTestCase


class SettingsIsolationTests(SimpleTestCase):
    def test_dev_and_test_ignore_synthetic_external_configuration(self):
        # A fresh interpreter avoids the parent process settings cache. Values
        # below are invented sentinels; no production environment is read.
        script = """
import importlib, json, sys
s = importlib.import_module('config.settings.' + sys.argv[1])
print(json.dumps({
    'debug': s.DEBUG, 'databases': s.DATABASES,
    'cache': s.CACHES['default']['BACKEND'],
    'hosts': s.ALLOWED_HOSTS, 'secret': s.SECRET_KEY,
}))
"""
        env = {
            "SYSTEMROOT": os.environ.get("SYSTEMROOT", "C:\\Windows"),
            "DJANGO_SETTINGS_MODULE": "nonexistent_production_settings",
            "DATABASE_URL": "postgresql://synthetic:synthetic@invalid.example/db",
            "PGHOST": "invalid.example", "PGDATABASE": "synthetic",
            "SECRET_KEY": "synthetic-env-secret-must-not-be-used",
            "DEBUG": "True", "ALLOWED_HOSTS": "*",
            "REDIS_URL": "redis://invalid.example:6379/0",
        }
        for name, debug in (("dev", True), ("test", False)):
            with self.subTest(settings=name):
                result = subprocess.run(
                    [sys.executable, "-I", "-c",
                     "import sys; sys.path.insert(0, sys.argv.pop(1));" + script,
                     str(Path(__file__).resolve().parents[2]), name],
                    env=env, capture_output=True, text=True, timeout=20,
                    check=True,
                )
                settings = json.loads(result.stdout)
                self.assertEqual(settings["debug"], debug)
                self.assertEqual(settings["databases"], {"default": {
                    "ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:",
                    "TEST": {"NAME": ":memory:"},
                }})
                self.assertEqual(settings["cache"],
                                 "django.core.cache.backends.locmem.LocMemCache")
                self.assertNotIn("*", settings["hosts"])
                self.assertNotEqual(settings["secret"], env["SECRET_KEY"])
                self.assertGreaterEqual(len(settings["secret"]), 48)


class LocalMigrationTests(TransactionTestCase):
    def test_current_empty_schema_migrates_repeatedly_in_memory(self):
        self.assertEqual(connection.vendor, "sqlite")
        self.assertTrue(connection.is_in_memory_db())
        # There are deliberately no persistent models/migrations in this core.
        executor = MigrationExecutor(connection)
        self.assertEqual(executor.loader.graph.leaf_nodes(), [])
        before = set(connection.introspection.table_names())
        for _ in range(2):
            call_command("migrate", interactive=False, verbosity=0)
            self.assertEqual(MigrationExecutor(connection).migration_plan([]), [])
            self.assertEqual(set(connection.introspection.table_names()), before)
