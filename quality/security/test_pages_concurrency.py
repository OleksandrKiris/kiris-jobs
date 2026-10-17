import subprocess
import sys
import tempfile
from pathlib import Path
import unittest

from pages_concurrency import check


SAFE = "name: Pages\nconcurrency:\n  group: pages\n  cancel-in-progress: false\njobs:\n  deploy: {}\n"


class PagesConcurrencyTests(unittest.TestCase):
    def test_serialized_deploy_is_accepted(self):
        check(SAFE)
        check(SAFE.replace("\n", "\r\n"))

    def test_current_main_cancellation_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "must not cancel"):
            check(SAFE.replace("false", "true"))

    def test_missing_duplicate_expression_and_ambiguous_policy_fail_closed(self):
        for source in ("jobs: {}", SAFE + SAFE,
                       SAFE.replace("false", "${{ true }}"),
                       SAFE.replace("  group: pages", "  group: ${{ github.ref }}"),
                       SAFE.replace("  cancel-in-progress: false", "  cancel-in-progress: false\n  cancel-in-progress: true"),
                       SAFE.replace("concurrency:", "concurrency: &policy")):
            with self.subTest(source=source), self.assertRaises(ValueError):
                check(source)

    def test_cli_really_fails_then_passes_without_mutating_input(self):
        script = Path(__file__).with_name("pages_concurrency.py")
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "pages.yml"
            for enabled, expected in ((True, 1), (False, 0)):
                source = SAFE.replace("false", "true") if enabled else SAFE
                path.write_text(source, encoding="utf-8")
                result = subprocess.run([sys.executable, str(script), str(path)],
                                        capture_output=True, text=True, timeout=10)
                self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
                self.assertEqual(path.read_text(encoding="utf-8"), source)


if __name__ == "__main__":
    unittest.main()
