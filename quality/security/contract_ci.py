"""Run accepted contract/map regression suites; this is not a live ownership gate."""
import importlib.util
from pathlib import Path
import sys
import unittest


SUITES = [('contracts/materials-v1/test_materials.py', 9),
          ('docs/integration/test_ownership.py', 11)]
CAPABILITIES = Path('contracts/capabilities-v1')
CAPABILITIES_FILES = ('response.schema.json', 'snapshot.json', 'test_capabilities.py')


def required_suites(root):
    suites = list(SUITES)
    directory = root / CAPABILITIES
    if not directory.exists() and not directory.is_symlink():
        print('Capabilities contract: not applicable (contracts/capabilities-v1 absent)', flush=True)
        return suites
    if directory.is_symlink() or not directory.is_dir():
        raise ValueError('Capabilities contract must be a real directory')
    for name in CAPABILITIES_FILES:
        path = directory / name
        if path.is_symlink() or not path.is_file():
            raise ValueError(f'Incomplete capabilities contract: {name} must be a real file')
    suites.append((str(CAPABILITIES / 'test_capabilities.py'), 9))
    return suites


def collect(path, minimum):
    spec = importlib.util.spec_from_file_location('contract_ci_' + path.stem, path)
    module = importlib.util.module_from_spec(spec)
    sys.path.insert(0, str(path.parent))
    try:
        spec.loader.exec_module(module)
    finally:
        sys.path.pop(0)
    suite = unittest.defaultTestLoader.loadTestsFromModule(module)
    count = suite.countTestCases()
    if count < minimum:
        raise ValueError(f'{path}: discovered {count}, expected at least {minimum} accepted regressions')
    print(f'{path}: discovered {count} (minimum {minimum})', flush=True)
    return suite


def run_suites(root):
    """Collect/run fixed suites; synthetic discovery fixtures need only stdlib."""
    suite = unittest.TestSuite(collect(root / path, minimum)
                               for path, minimum in required_suites(root))
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return 0 if passed(result) else 1


def main():
    from jsonschema import FormatChecker
    # Fail rather than silently ignoring the schema's required date format.
    checker = FormatChecker()
    if not checker.conforms('2026-10-17', 'date') or checker.conforms('2026-02-30', 'date'):
        raise ValueError('Required JSON Schema date format checker unavailable')
    return run_suites(Path(__file__).resolve().parents[2])


def passed(result):
    return result.wasSuccessful() and not result.skipped and not result.expectedFailures


if __name__ == '__main__':
    raise SystemExit(main())
