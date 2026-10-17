"""Run every checked-in backend test; absence is explicit, empty suites fail."""
import argparse
import importlib.util
import os
from pathlib import Path
import sys
import unittest


def layout(root):
    backend = root / "backend"
    if not backend.exists():
        return None
    if backend.is_symlink() or not backend.is_dir():
        raise ValueError("backend must be a real directory")
    if any(p.is_symlink() for p in backend.rglob("*")):
        raise ValueError("backend CI does not follow symlinks")
    tests = sorted((backend / "tests").rglob("test_*.py"))
    if not tests:
        raise ValueError("backend exists but has no test_*.py tests")
    django = (backend / "manage.py").exists() or (backend / "core").exists()
    if django:
        for name in ("manage.py", "requirements.txt", "config/settings/test.py"):
            if not (backend / name).is_file():
                raise ValueError(f"Incomplete Django core: missing {name}")
    return backend, tests, django


def collect(files):
    # Load files individually so namespace directories without __init__.py
    # (the existing domain contract) cannot be silently skipped by discovery.
    suite = unittest.TestSuite()
    for index, path in enumerate(files):
        name = f"backend_ci_test_{index}"
        spec = importlib.util.spec_from_file_location(name, path)
        module = importlib.util.module_from_spec(spec)
        sys.modules[name] = module
        spec.loader.exec_module(module)
        part = unittest.defaultTestLoader.loadTestsFromModule(module)
        if not part.countTestCases():
            raise ValueError(f"No tests discovered in {path.name}")
        suite.addTests(part)
    return suite


def run(root, inspect_only=False):
    found = layout(root)
    if found is None:
        print("Backend tests: not applicable (backend/ absent)", flush=True)
        return 0
    backend, files, has_django = found
    print(f"Backend: {len(files)} test files; Django={has_django}", flush=True)
    if inspect_only:
        return 0
    sys.path[:0] = [str(root), str(backend)]
    if not has_django:
        result = unittest.TextTestRunner(verbosity=2).run(collect(files))
        return 0 if result.wasSuccessful() else 1

    # Fixed test settings only; never consult a production environment setting.
    os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.test"
    import django
    from django.conf import settings
    from django.core.management import call_command
    from django.test.runner import DiscoverRunner

    # Validate every configured DB before setup/check or database creation.
    if not settings.DATABASES or any(
        db.get("ENGINE") != "django.db.backends.sqlite3"
        or db.get("NAME") != ":memory:"
        or db.get("TEST", {}).get("NAME", ":memory:") != ":memory:"
        or db.get("TEST", {}).get("MIRROR")
        for db in settings.DATABASES.values()
    ):
        raise ValueError("Backend CI only permits in-memory SQLite test databases")
    django.setup()
    call_command("check", fail_level="WARNING")
    call_command("makemigrations", check=True, dry_run=True, verbosity=1)

    class AllFilesRunner(DiscoverRunner):
        def build_suite(self, test_labels=None, **kwargs):
            return collect(files)

    failures = AllFilesRunner(verbosity=2, interactive=False).run_tests([])
    return 1 if failures else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--inspect", action="store_true")
    args = parser.parse_args()
    try:
        sys.exit(run(args.root.resolve(), args.inspect))
    except Exception as exc:
        print(f"Backend CI failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        sys.exit(1)
