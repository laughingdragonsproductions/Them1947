#!/usr/bin/env python3
"""Remove flat white backdrop and export circular promo logo PNG."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(
    r"C:\Users\David\.cursor\projects\g-LocalAIagent-Them1947\assets\image-168f47fd-78a1-41c9-917a-ebb99d015085.jpg"
)
OUT = ROOT / "assets" / "brand" / "logo-promo-electronic-warfare.png"


def main() -> int:
    if not SRC.is_file():
        print(f"Source image missing: {SRC}", file=sys.stderr)
        return 1

    im = Image.open(SRC).convert("RGBA")
    px = im.load()
    w, h = im.size

    def is_bg(r: int, g: int, b: int) -> bool:
        return r >= 248 and g >= 248 and b >= 248

    visited = [[False] * w for _ in range(h)]
    stack: list[tuple[int, int]] = []
    for x in range(w):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y))
        stack.append((w - 1, y))

    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h or visited[y][x]:
            continue
        visited[y][x] = True
        r, g, b, a = px[x, y]
        if not is_bg(r, g, b):
            continue
        px[x, y] = (r, g, b, 0)
        stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    # Soften leftover near-white fringing on the coin edge
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if r >= 240 and g >= 240 and b >= 240:
                px[x, y] = (r, g, b, 0)

    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)

    max_side = 512
    im.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    im.save(OUT, optimize=True)
    print(f"Wrote {OUT} ({im.size[0]}x{im.size[1]})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())