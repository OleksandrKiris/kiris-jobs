from pathlib import Path
import subprocess
import tempfile
import unittest

from exact_base import git, prepare


class ExactBaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.remote = self.root / 'remote'
        self.remote.mkdir()
        git(self.remote, 'init', '-b', 'main')
        git(self.remote, 'config', 'user.name', 'Fixture')
        git(self.remote, 'config', 'user.email', 'fixture@example.invalid')
        self.commit('sw.js', 'old worker')
        self.base = git(self.remote, 'rev-parse', 'HEAD')
        git(self.remote, 'switch', '-c', 'feature')
        self.commit('feature.txt', 'feature')
        self.head = git(self.remote, 'rev-parse', 'HEAD')
        git(self.remote, 'switch', 'main')
        for i in range(4):
            self.commit('main.txt', str(i))
        git(self.remote, 'merge', '--no-ff', 'feature', '-m', 'synthetic merge')
        self.checkout = self.root / 'checkout'
        git(self.root, 'clone', '--depth=2', '--single-branch', self.remote.as_uri(), str(self.checkout))

    def commit(self, path, content):
        (self.remote / path).write_text(content, encoding='utf-8')
        git(self.remote, 'add', path)
        git(self.remote, 'commit', '-m', 'fixture')

    def test_depth_two_missing_base_restored_without_checkout_change(self):
        before = git(self.checkout, 'rev-parse', 'HEAD')
        with self.assertRaises(subprocess.CalledProcessError):
            git(self.checkout, 'show', f'{self.base}:sw.js')
        self.assertTrue(prepare(self.checkout, self.base, self.head))
        self.assertEqual(git(self.checkout, 'show', f'{self.base}:sw.js'), 'old worker')
        self.assertEqual(git(self.checkout, 'rev-parse', 'HEAD'), before)
        self.assertFalse(prepare(self.checkout, self.base, self.head))

    def test_wrong_head_and_invalid_sha_fail_before_fetch(self):
        for base, head in [('main', self.head), (self.base, '0'*40)]:
            with self.assertRaises(ValueError):
                prepare(self.checkout, base, head)

    def test_unavailable_exact_base_fails(self):
        with self.assertRaises(subprocess.CalledProcessError):
            prepare(self.checkout, '0'*40, self.head)

    def test_unrelated_base_with_worker_fails_ancestry(self):
        git(self.remote, 'switch', '--orphan', 'unrelated')
        self.commit('sw.js', 'unrelated worker')
        base = git(self.remote, 'rev-parse', 'HEAD')
        with self.assertRaises(subprocess.CalledProcessError):
            prepare(self.checkout, base, self.head)

    def test_genuine_missing_worker_is_not_skipped(self):
        git(self.remote, 'switch', '-c', 'no-worker')
        git(self.remote, 'rm', 'sw.js')
        git(self.remote, 'commit', '-m', 'no worker')
        base = git(self.remote, 'rev-parse', 'HEAD')
        with self.assertRaises(subprocess.CalledProcessError):
            prepare(self.checkout, base, self.head)
