from pathlib import Path
from contextlib import redirect_stderr, redirect_stdout
import io
import tempfile
import unittest
from unittest.mock import patch
from contract_ci import (CAPABILITIES, CAPABILITIES_FILES, MATERIAL_DETAIL_FILES,
                         SUITES, collect, main, passed, run_suites)


class ContractDiscoveryTests(unittest.TestCase):
    def fixture_suite(self, path, count, body='pass'):
        path.parent.mkdir(parents=True, exist_ok=True)
        methods = ''.join(f' def test_{i}(self): {body}\n' for i in range(count))
        path.write_text('import unittest\nclass T(unittest.TestCase):\n' + methods,
                        encoding='utf-8')

    def fixture_root(self, root, capabilities=True):
        for path, minimum in SUITES:
            self.fixture_suite(root / path, minimum)
        (root / MATERIAL_DETAIL_FILES[0]).write_text('{}', encoding='utf-8')
        if capabilities:
            directory = root / CAPABILITIES
            directory.mkdir(parents=True)
            for name in CAPABILITIES_FILES:
                (directory / name).write_text('{}', encoding='utf-8')
            self.fixture_suite(directory / 'test_capabilities.py', 9)

    def run_fixture(self, root):
        output, errors = io.StringIO(), io.StringIO()
        with redirect_stdout(output), redirect_stderr(errors):
            code = run_suites(root)
        return code, output.getvalue(), errors.getvalue()

    def test_real_entry_requires_jsonschema_even_when_discovery_fixtures_do_not(self):
        # Explicit absent-dependency fixture, never a substitute schema checker.
        real_import = __import__

        def without_jsonschema(name, *args, **kwargs):
            if name == 'jsonschema' or name.startswith('jsonschema.'):
                raise ModuleNotFoundError("No module named 'jsonschema'")
            return real_import(name, *args, **kwargs)

        with patch('builtins.__import__', side_effect=without_jsonschema):
            with self.assertRaisesRegex(ModuleNotFoundError, 'jsonschema'):
                main()
            with tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                self.fixture_root(root)
                self.assertEqual(self.run_fixture(root)[0], 0)

    def test_capabilities_absence_keeps_thirty_material_and_ownership_tests(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.fixture_root(root, capabilities=False)
            code, output, errors = self.run_fixture(root)
            self.assertEqual(code, 0)
            self.assertIn('not applicable', output)
            self.assertIn('Ran 30 tests', errors)

    def test_present_capabilities_are_actually_executed_and_failure_propagates(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.fixture_root(root)
            code, output, errors = self.run_fixture(root)
            self.assertEqual(code, 0)
            self.assertIn('test_capabilities.py: discovered 9', output)
            self.assertIn('Ran 39 tests', errors)
            path = root / CAPABILITIES / 'test_capabilities.py'
            self.fixture_suite(path, 9, 'self.fail("capability regression")')
            code, _, errors = self.run_fixture(root)
            self.assertEqual(code, 1)
            self.assertIn('failures=9', errors)

    def test_materials_twelve_are_insufficient_and_thirteen_execute(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.fixture_root(root)
            path = root / 'contracts/materials-v1/test_materials.py'
            self.fixture_suite(path, 12)
            with self.assertRaisesRegex(ValueError, 'discovered 12, expected at least 13'):
                self.run_fixture(root)
            self.fixture_suite(path, 13)
            code, output, errors = self.run_fixture(root)
            self.assertEqual(code, 0)
            self.assertIn('test_materials.py: discovered 13 (minimum 13)', output)
            self.assertIn('Ran 39 tests', errors)

    def test_material_detail_companions_are_required_not_silently_omitted(self):
        for name in MATERIAL_DETAIL_FILES:
            with self.subTest(missing=name), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                self.fixture_root(root)
                (root / name).unlink()
                with self.assertRaisesRegex(ValueError, 'Incomplete material detail contract'):
                    self.run_fixture(root)

    def test_material_detail_six_actually_run_and_five_fail_discovery(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.fixture_root(root)
            path = root / 'contracts/materials-v1/test_material_detail.py'
            self.fixture_suite(path, 5)
            with self.assertRaisesRegex(ValueError, 'discovered 5, expected at least 6'):
                self.run_fixture(root)
            self.fixture_suite(path, 6, 'self.fail("detail suite executed")')
            code, output, errors = self.run_fixture(root)
            self.assertEqual(code, 1)
            self.assertIn('test_material_detail.py: discovered 6 (minimum 6)', output)
            self.assertIn('Ran 39 tests', errors)
            self.assertIn('failures=6', errors)

    def test_each_partial_capabilities_file_and_non_directory_are_rejected(self):
        for name in CAPABILITIES_FILES:
            with self.subTest(missing=name), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                self.fixture_root(root)
                (root / CAPABILITIES / name).unlink()
                with self.assertRaisesRegex(ValueError, 'Incomplete capabilities contract'):
                    self.run_fixture(root)
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.fixture_root(root, capabilities=False)
            (root / CAPABILITIES).write_text('not a directory', encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'real directory'):
                self.run_fixture(root)

    def test_reduced_skipped_and_expected_failure_capabilities_fail_closed(self):
        for count, body in [(8, 'pass'), (9, 'self.skipTest("required")')]:
            with self.subTest(count=count, body=body), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                self.fixture_root(root)
                path = root / CAPABILITIES / 'test_capabilities.py'
                self.fixture_suite(path, count, body)
                if count < 9:
                    with self.assertRaisesRegex(ValueError, 'discovered 8'):
                        self.run_fixture(root)
                else:
                    self.assertEqual(self.run_fixture(root)[0], 1)
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.fixture_root(root)
            path = root / CAPABILITIES / 'test_capabilities.py'
            self.fixture_suite(path, 9, 'self.fail("expected")')
            source = path.read_text(encoding='utf-8').replace(' def test_', ' @unittest.expectedFailure\n def test_')
            path.write_text(source, encoding='utf-8')
            self.assertEqual(self.run_fixture(root)[0], 1)

    def test_empty_missing_and_reduced_suites_fail(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'test_fixture.py'
            with self.assertRaises(FileNotFoundError):
                collect(path, 1)
            path.write_text('import unittest\n', encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'discovered 0'):
                collect(path, 1)
            path.write_text('import unittest\nclass T(unittest.TestCase):\n def test_one(self): pass\n', encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'discovered 1'):
                collect(path, 2)

    def test_deliberate_failure_is_not_success(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'test_failure.py'
            path.write_text('import unittest\nclass T(unittest.TestCase):\n def test_bad(self): self.fail("intentional fixture")\n', encoding='utf-8')
            result = unittest.TestResult()
            collect(path, 1).run(result)
            self.assertFalse(result.wasSuccessful())
            self.assertFalse(passed(result))
            self.assertEqual(len(result.failures), 1)

    def test_skipped_accepted_tests_do_not_pass(self):
        result = unittest.TestResult()
        result.skipped.append(('fixture', 'intentional skipped test'))
        self.assertFalse(passed(result))

    def test_expected_failures_do_not_pass_required_suite(self):
        class RequiredRegression(unittest.TestCase):
            @unittest.expectedFailure
            def test_required(self):
                self.fail('intentional expected failure')

        result = unittest.TestResult()
        unittest.TestSuite(RequiredRegression('test_required') for _ in range(20)).run(result)
        self.assertEqual(result.testsRun, 20)
        self.assertEqual(len(result.expectedFailures), 20)
        self.assertTrue(result.wasSuccessful())
        self.assertFalse(passed(result))
