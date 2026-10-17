"""Check the deliberately narrow, literal Pages concurrency policy (read only).

This is not a YAML parser. Unsupported syntax fails closed for manual review.
No GitHub requests, workflow dispatch, or deployment is performed.
"""
import argparse
from pathlib import Path
import re


def check(source):
    lines = source.splitlines()
    starts = [i for i, line in enumerate(lines) if line == "concurrency:"]
    if len(starts) != 1:
        raise ValueError("Expected one literal top-level concurrency mapping")
    entries = []
    for line in lines[starts[0] + 1:]:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if not line.startswith(" "):
            break
        entries.append(line)
    # Intentionally reject expressions, aliases, duplicate keys and alternate
    # indentation instead of guessing how GitHub will interpret them.
    if len(entries) != 2 or not re.fullmatch(r"  group: [A-Za-z0-9_-]+", entries[0]):
        raise ValueError("Expected a literal concurrency group and cancellation policy")
    if entries[1] != "  cancel-in-progress: false":
        raise ValueError("Pages workflow must not cancel an in-progress deployment")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workflow", type=Path)
    args = parser.parse_args()
    try:
        check(args.workflow.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        print(f"FAIL: {error}")
        return 1
    print("PASS: literal Pages concurrency keeps in-progress deployments running")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
