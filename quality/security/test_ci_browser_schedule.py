"""Prevent acceptance gates from being lost when their CI time budgets are separated.

This checks the controlled workflow's small matrix/step format, not arbitrary YAML.
The mutations exercise missing, unreachable, duplicate and incorrectly staged gates.
"""
import re
import os
import subprocess
import unittest
from pathlib import Path

WORKFLOW = Path(__file__).resolve().parents[2] / '.github/workflows/check-pr.yml'
COMMANDS = {
    'catalogue': 'node .github/browser/catalogue.mjs',
    'pdf': 'node .github/browser/apply-pdf.mjs',
    'prototypes': 'node .github/scripts/local-prototypes.mjs browser',
}


def job(text, name):
    match = re.search(r'(?ms)^  ' + re.escape(name) + r':\n(.*?)(?=^  [\w-]+:\n|\Z)', text)
    if not match:
        raise ValueError('Missing job: ' + name)
    return match.group(1)


def validate(text):
    unit, browser, verify = job(text, 'unit'), job(text, 'browser'), job(text, 'verify')
    matrix = re.search(r'(?m)^        gate: \[([^\]]+)\]$', browser)
    choices = [v.strip() for v in matrix.group(1).split(',')] if matrix else []
    if sorted(choices) != sorted(COMMANDS) or len(choices) != len(set(choices)):
        raise ValueError('All three independent gates must run once')
    if not re.search(r'(?m)^    needs: unit$', browser):
        raise ValueError('Browser jobs require all unit/publication checks')
    if not re.search(r'(?m)^      fail-fast: false$', browser):
        raise ValueError('One browser failure must not cancel other evidence')
    restore = next((step for step in re.split(r'(?m)^      - ', browser)
                    if step.startswith('name: Restore exact historical PDF regression sources')), '')
    pdf_sources = set()
    for fixture in ('apply-pdf.mjs', 'pdf-photo-acceptance.mjs', 'pdf-width.mjs'):
        source = (WORKFLOW.parents[2] / '.github/browser' / fixture).read_text(encoding='utf-8')
        pdf_sources.update(re.findall(r"'([0-9a-f]{40})'", source))
    if (set(re.findall(r'\b[0-9a-f]{40}\b', restore)) != pdf_sources
            or "if: matrix.gate == 'pdf'" not in restore
            or 'timeout 60s git fetch --no-tags --depth=1 --filter=blob:none origin "$pdf_source"' not in restore
            or 'test "$(git rev-parse HEAD)" = "$pdf_checkout"' not in restore):
        raise ValueError('Independent PDF job needs every exact original source without changing checkout')
    for block in (unit, browser):
        if not re.search(r'(?m)^    timeout-minutes: 15$', block):
            raise ValueError('Keep each original fifteen-minute bound')
        for command in ('python quality/security/exact_base.py',
                        'node scripts/build-pages-artifact.mjs build "$GITHUB_WORKSPACE" "$RUNNER_TEMP/primserv-pages"',
                        'node scripts/build-pages-artifact.mjs verify "$GITHUB_WORKSPACE" "$RUNNER_TEMP/primserv-pages"',
                        'git diff --exit-code'):
            if block.count(command) != 1:
                raise ValueError('Exact source/staged bytes must be verified per job')
        for value in ('TESTED_HEAD: ${{ github.event.pull_request.head.sha }}',
                      'TESTED_BASE: ${{ github.event.pull_request.base.sha }}'):
            if value not in block:
                raise ValueError('Fresh event head/base must reach each job')
    for command in ('npm test', 'node --test .github/scripts/local-prototypes.test.mjs',
                    'node .github/scripts/local-prototypes.mjs unit',
                    'node --test scripts/pages-artifact.test.mjs',
                    'python -m unittest discover -s quality/security',
                    'python quality/security/pages_concurrency.py .github/workflows/pages.yml'):
        if unit.count(command) != 1:
            raise ValueError('A pre-existing required gate was dropped')
    steps = re.split(r'(?m)^      - ', browser)[1:]
    reached = {gate: [] for gate in choices}
    for step in steps:
        command = re.search(r'(?m)^        run: (.+)$', step)
        if not command or command.group(1) not in COMMANDS.values():
            continue
        condition = re.search(r"(?m)^        if: matrix.gate == '([^']+)'$", step)
        if not condition or condition.group(1) not in choices:
            raise ValueError('Unreachable or unbounded browser gate')
        reached[condition.group(1)].append(command.group(1))
    if any(reached[gate] != [command] for gate, command in COMMANDS.items()):
        raise ValueError('Each matrix case must execute its original gate exactly once')
    if 'playwright@1.56.1' not in browser or 'PAGES_ARTIFACT: ${{ runner.temp }}/primserv-pages' not in browser:
        raise ValueError('Pinned browser and verified staged directory required')
    if 'name: catalogue-browser-${{ github.event.pull_request.head.sha }}-${{ matrix.gate }}' not in browser:
        raise ValueError('Parallel browser evidence must have distinct artifact names')
    if 'name: local-prototypes-${{ github.event.pull_request.head.sha }}' not in browser:
        raise ValueError('Local prototype evidence must be retained outside Pages')
    for required in ('    if: always()', '    needs: [unit, browser]',
                     '          UNIT_RESULT: ${{ needs.unit.result }}',
                     '          BROWSER_RESULT: ${{ needs.browser.result }}',
                     '          test "$UNIT_RESULT" = success',
                     '          test "$BROWSER_RESULT" = success'):
        if required not in verify.splitlines():
            raise ValueError('The existing required verify check must aggregate every result')
    return reached


class BrowserScheduleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.text = WORKFLOW.read_text(encoding='utf-8')

    def test_actual_workflow_runs_all_original_gates(self):
        self.assertEqual(validate(self.text), {gate: [command] for gate, command in COMMANDS.items()})

    def test_required_verify_rejects_every_non_success_dependency(self):
        aggregate = job(self.text, 'verify')
        match = re.search(r'(?m)^        run: \|\n((?:          .*\n)+)', aggregate)
        self.assertIsNotNone(match)
        script = '\n'.join(line[10:] for line in match.group(1).splitlines())
        bash = str(Path(os.environ.get('ProgramFiles', 'C:/Program Files')) / 'Git/bin/bash.exe') if os.name == 'nt' else '/bin/bash'
        for unit in ('success', 'failure', 'cancelled', 'skipped'):
            for browser in ('success', 'failure', 'cancelled', 'skipped'):
                with self.subTest(unit=unit, browser=browser):
                    result = subprocess.run([bash, '-e', '-c', script], env={**os.environ, 'UNIT_RESULT': unit, 'BROWSER_RESULT': browser}, capture_output=True)
                    self.assertEqual(result.returncode == 0, unit == browser == 'success')

    def test_missing_unreachable_duplicate_and_weakened_gates_are_rejected(self):
        mutations = [
            ('gate: [catalogue, pdf, prototypes]', 'gate: [catalogue, prototypes]'),
            ('gate: [catalogue, pdf, prototypes]', 'gate: [catalogue, pdf, prototypes, pdf]'),
            ("if: matrix.gate == 'pdf'", "if: matrix.gate == 'absent'"),
            ('run: node .github/browser/apply-pdf.mjs', 'run: node .github/browser/catalogue.mjs'),
            ('fail-fast: false', 'fail-fast: true'),
            ('needs: unit', 'needs: absent'),
            ('needs: [unit, browser]', 'needs: [unit]'),
            ('    if: always()', '    if: success()'),
            ('test "$BROWSER_RESULT" = success', 'true'),
            ('timeout-minutes: 15', 'timeout-minutes: 30'),
            ('run: npm test', 'run: echo skipped'),
            ('node scripts/build-pages-artifact.mjs verify', 'echo unverified'),
            ('TESTED_BASE: ${{ github.event.pull_request.base.sha }}', 'TESTED_BASE: main'),
            ('playwright@1.56.1', 'playwright@latest'),
            ('-${{ matrix.gate }}', ''),
            ('3fb5e53647a4fc025ad8fb8621308ce7f1a6e11a', '0000000000000000000000000000000000000000'),
            ('timeout 60s git fetch', 'git fetch'),
        ]
        for before, after in mutations:
            with self.subTest(before=before):
                self.assertIn(before, self.text)
                with self.assertRaises(ValueError):
                    validate(self.text.replace(before, after))


if __name__ == '__main__':
    unittest.main()
