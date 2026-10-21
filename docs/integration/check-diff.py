"""Read-only ownership preflight. Base map and evidence must come from trusted review.
No labels, live API requests, writes, or automatic approval overrides.
"""
import argparse
import json
import re
import subprocess
from pathlib import Path

MAP = Path(__file__).with_name('ownership-map.json')

def owner_of(path, mapping):
    if (not isinstance(path, str) or not path or path.startswith('/') or
            '\\' in path or any(p in ('', '.', '..') for p in path.split('/'))):
        return None
    matches = {r['owner'] for r in mapping['rules'] for p in r['paths']
               if (path.startswith(p) if p.endswith('/') else path == p)}
    return next(iter(matches)) if len(matches) == 1 else None

def check(mapping, change, accepted_dependencies=()):
    errors = []
    if change.get('repo') != mapping['repo']:
        errors.append('wrong_repo')
    if not re.fullmatch(r'[0-9a-f]{40}', change.get('head', '')):
        errors.append('invalid_head')
    paths = change.get('paths', [])
    if not paths:
        errors.append('empty_diff')
    allowed = change.get('allowed_paths', [])
    for path in paths:
        owner = owner_of(path, mapping)
        if owner is None:
            errors.append(f'unknown_path:{path}')
        elif owner != change.get('owner'):
            errors.append(f'foreign_path:{path}:owner{owner}')
        if not any(path.startswith(p) if p.endswith('/') else path == p for p in allowed):
            errors.append(f'outside_claim:{path}')
        if path in mapping['review_paths']:
            errors.append(f'separate_map_review:{path}')
    for dependency in change.get('depends_on', []):
        if dependency not in accepted_dependencies:
            errors.append(f'unaccepted_dependency:{dependency}')
    for other in change.get('other_wip', []):
        overlap = set(paths) & set(other.get('paths', []))
        errors.extend(f'overlap:{p}' for p in sorted(overlap))
    return sorted(set(errors))

def git_paths(base, head, cwd=None):
    # Ownership covers changed paths, not read access to unchanged copy sources.
    # -z preserves whitespace; renames affect both old and new names.
    raw = subprocess.check_output(['git', '-c', 'diff.renames=true', 'diff', '--name-status', '-z',
                                   '--no-ext-diff', '--no-textconv', '--find-renames',
                                   base, head, '--'], cwd=cwd)
    fields = raw.decode('utf-8').rstrip('\0').split('\0') if raw else []
    paths, i = [], 0
    while i < len(fields):
        status = fields[i]
        count = 2 if status[0] in 'RC' else 1
        paths.extend(fields[i + 1:i + 1 + count])
        i += count + 1
    return paths

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--map', type=Path, default=MAP)
    parser.add_argument('--claim', type=Path, required=True)
    parser.add_argument('--base', required=True)
    parser.add_argument('--head', required=True)
    args = parser.parse_args()
    mapping = json.loads(args.map.read_text(encoding='utf-8-sig'))
    claim = json.loads(args.claim.read_text(encoding='utf-8-sig'))
    actual_head = subprocess.check_output(['git', 'rev-parse', args.head], text=True).strip()
    errors = [] if claim.get('head') == actual_head else ['claim_head_mismatch']
    claim['paths'] = git_paths(args.base, actual_head)
    # Dependency acceptance comes only from a separately reviewed artifact;
    # this CLI deliberately cannot self-approve dependencies or map changes.
    errors += check(mapping, claim)
    print(json.dumps({'head': actual_head, 'paths': claim['paths'], 'errors': errors}, indent=2))
    return 1 if errors else 0

if __name__ == '__main__':
    raise SystemExit(main())
