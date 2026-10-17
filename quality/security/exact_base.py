"""Make the event's exact base available without changing the tested checkout."""
import os
from pathlib import Path
import re
import subprocess


def git(root, *args):
    return subprocess.check_output(['git', *args], cwd=root, text=True,
                                   stderr=subprocess.PIPE, timeout=60).strip()


def prepare(root, base, head):
    for value in (base, head):
        if not isinstance(value, str) or not re.fullmatch('[0-9a-f]{40}', value):
            raise ValueError('Exact full event base/head SHA required')
    checkout = git(root, 'rev-parse', 'HEAD')
    # checkout@v7 checks out the synthetic PR merge. Do not silently test a
    # different PR head or replace the checkout with the base revision.
    parents = git(root, 'show', '-s', '--format=%P', 'HEAD').split()
    if head not in parents:
        raise ValueError('Checkout must be a PR merge with the exact event head as parent')
    try:
        git(root, 'cat-file', '-e', f'{base}^{{commit}}')
        fetched = False
    except subprocess.CalledProcessError:
        # One bounded exact-object request: no all-branch history, tags, retry,
        # checkout, merge, or substitution of current main for the event base.
        git(root, 'fetch', '--no-tags', '--depth=1', '--filter=blob:none', 'origin', base)
        fetched = True
    git(root, 'cat-file', '-e', f'{base}:sw.js')
    try:
        git(root, 'merge-base', '--is-ancestor', base, checkout)
    except subprocess.CalledProcessError:
        # A depth-2 checkout can also hide the ancestry chain. Fetch only this
        # exact merge's bounded history, with blobs filtered, once. A base that
        # remains unrelated/unprovable fails; never accept a replacement base.
        git(root, 'fetch', '--no-tags', '--depth=64', '--filter=blob:none', 'origin', checkout)
        git(root, 'merge-base', '--is-ancestor', base, checkout)
    if git(root, 'rev-parse', 'HEAD') != checkout:
        raise ValueError('Tested checkout changed')
    print(f'exact-base={base} head={head} checkout={checkout} fetched={fetched}')
    return fetched


if __name__ == '__main__':
    prepare(Path.cwd(), os.environ.get('TESTED_BASE'), os.environ.get('TESTED_HEAD'))
