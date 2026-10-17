import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).parent
spec = importlib.util.spec_from_file_location('checker', ROOT / 'check-diff.py')
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)
M = json.loads((ROOT / 'ownership-map.json').read_text(encoding='utf-8-sig'))

def claim(owner, *paths):
    return dict(owner=owner, repo=M['repo'], head='a'*40,
                paths=list(paths), allowed_paths=list(paths), depends_on=[])

class OwnershipTests(unittest.TestCase):
    def test_eight_independent_areas(self):
        fixtures = {1:'assets/app.js', 9:'coordinator-demo/model.js',
                    10:'docs/primserv-roadmap.md', 11:'offline-tools/tool/test.py',
                    12:'backend/core/views.py', 13:'backend/domain/read.py',
                    14:'contracts/materials-v1/schema.json', 15:'.github/workflows/backend.yml'}
        for owner, path in fixtures.items():
            with self.subTest(owner=owner):
                c = claim(owner, path)
                c['other_wip'] = [dict(paths=[p]) for o,p in fixtures.items() if o != owner]
                self.assertEqual(checker.check(M, c), [])
    def test_foreign_and_shared(self):
        self.assertIn('foreign_path:package.json:owner1', checker.check(M, claim(15,'package.json')))
        c = claim(1,'package.json'); c['other_wip'] = [dict(paths=['package.json'])]
        self.assertIn('overlap:package.json', checker.check(M,c))
    def test_unknown_and_traversal(self):
        for path in ['unknown/file', '../assets/app.js', '/assets/app.js', 'assets/../secret', 'assets\\app.js']:
            self.assertIsNone(checker.owner_of(path,M))
    def test_map_change_cannot_be_label_approved(self):
        c=claim(14,'docs/integration/ownership-map.json'); c['labels']=['approved','owner14']
        self.assertIn('separate_map_review:docs/integration/ownership-map.json',checker.check(M,c))
    def test_dependency_exact_version(self):
        c=claim(13,'backend/domain/read.py'); c['depends_on']=['materials@abc']
        self.assertIn('unaccepted_dependency:materials@abc',checker.check(M,c,['materials@old']))
        self.assertEqual(checker.check(M,c,['materials@abc']),[])
    def test_claim_and_head(self):
        c=claim(14,'contracts/read.json'); c['allowed_paths']=[]; c['head']='old'
        self.assertIn('invalid_head',checker.check(M,c))
        self.assertIn('outside_claim:contracts/read.json',checker.check(M,c))
    def test_transfer_excludes_packaging_and_runners(self):
        for path in ['package.json','package-lock.json','scripts/build-pages-artifact.mjs','.github/browser/catalogue.mjs']:
            self.assertEqual(checker.owner_of(path,M),1)
        self.assertEqual(checker.owner_of('coordinator-demo/browser-acceptance.mjs',M),9)
        self.assertEqual(checker.owner_of('offline-tools/a/browser-acceptance.mjs',M),11)


# checker parsing regression is independent of this checkout's Git history.
class DiffParsingTests(unittest.TestCase):
    def test_rename_checks_old_and_new_names(self):
        from unittest.mock import patch
        raw=b'R100\0assets/old name.js\0backend/domain/new name.py\0M\0package.json\0'
        with patch.object(checker.subprocess,'check_output',return_value=raw):
            self.assertEqual(checker.git_paths('base','head'),['assets/old name.js','backend/domain/new name.py','package.json'])
    def test_new_ci_file_requires_map_review(self):
        self.assertIsNone(checker.owner_of('.github/scripts/new-check.py',M))
        self.assertIsNone(checker.owner_of('.github/workflows/new.yml',M))
    def test_wrong_repo_and_empty_diff(self):
        c=claim(14);c['repo']='other/repo'
        self.assertEqual(checker.check(M,c),['empty_diff','wrong_repo'])


class RealGitDiffTests(unittest.TestCase):
    def test_copy_and_rename_ownership_with_real_git(self):
        import subprocess
        import tempfile
        with tempfile.TemporaryDirectory(prefix='primserv-diff-') as tmp:
            root = Path(tmp)
            def git(*args):
                return subprocess.check_output(['git', *args], cwd=root, text=True).strip()
            git('init', '-q')
            git('config', 'user.name', 'Synthetic Fixture')
            git('config', 'user.email', 'fixture@example.invalid')
            git('config', 'commit.gpgsign', 'false')
            # Even a user-level copy preference must not change the policy.
            git('config', 'diff.renames', 'copies')
            (root/'assets').mkdir()
            source = root/'assets/source.js'
            source.write_text('public fixture line\n'*30, encoding='utf-8')
            git('add', '.'); git('commit', '-qm', 'fixture base')
            base = git('rev-parse', 'HEAD')
            destination = root/'contracts/materials-v1/copy.js'
            destination.parent.mkdir(parents=True)
            destination.write_bytes(source.read_bytes())
            git('add', '.'); git('commit', '-qm', 'copy public fixture')
            copied = git('rev-parse', 'HEAD')
            paths = checker.git_paths(base, copied, cwd=root)
            self.assertEqual(paths, ['contracts/materials-v1/copy.js'])
            self.assertEqual(checker.check(M, claim(14, *paths)), [])
            source.write_text('edited fixture\n', encoding='utf-8')
            git('add', '.'); git('commit', '-qm', 'source edit')
            paths = checker.git_paths(base, 'HEAD', cwd=root)
            self.assertIn('assets/source.js', paths)
            self.assertIn('foreign_path:assets/source.js:owner1', checker.check(M, claim(14, *paths)))
            # Rename deletes the old name, unlike copying unchanged content.
            git('mv', 'assets/source.js', 'contracts/materials-v1/moved.js')
            git('commit', '-qm', 'rename across owners')
            paths = checker.git_paths('HEAD~1', 'HEAD', cwd=root)
            self.assertEqual(paths, ['assets/source.js', 'contracts/materials-v1/moved.js'])
            self.assertIn('foreign_path:assets/source.js:owner1', checker.check(M, claim(14, *paths)))

if __name__ == '__main__': unittest.main()
