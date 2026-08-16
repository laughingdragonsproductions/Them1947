#!/usr/bin/env python3
"""Replace em/en dashes with ASCII hyphens in site source files."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", ".worker-dist", "node_modules", ".github", ".cursor", ".wrangler"}
SKIP_FILES = {"_mw_detail_sample.json"}
EXTENSIONS = {".html", ".js", ".css", ".md", ".py", ".json", ".jsonc"}
TRANSLATION = str.maketrans({"-": "-", "-": "-"})


def should_process(path: Path) -> bool:
    if path.name in SKIP_FILES:
        return False
    if path.suffix.lower() not in EXTENSIONS:
        return False
    return True


def main() -> int:
    changed: list[str] = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if not should_process(path):
            continue
        text = path.read_text(encoding="utf-8")
        updated = text.translate(TRANSLATION)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            changed.append(str(path.relative_to(ROOT)).replace("\\", "/"))
    print(f"Updated {len(changed)} file(s)")
    for rel in changed:
        print(f"  {rel}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
