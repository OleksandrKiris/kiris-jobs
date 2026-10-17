from pathlib import Path
import tempfile
import unittest
from contract_ci import collect, passed


class ContractDiscoveryTests(unittest.TestCase):
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
