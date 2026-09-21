"""Inject static case-file briefs into print archive HTML for crawler-visible depth."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "assets" / "js" / "catalog-data.js"
APP_RE = re.compile(r'(<div id="app">)(.*?)(</div>)', re.DOTALL)
EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001FAFF"
    "\U00002700-\U000027BF"
    "\U00002600-\U000026FF"
    "]+",
    flags=re.UNICODE,
)


def load_catalog() -> dict:
    text = CATALOG.read_text(encoding="utf-8")
    prefix = "window.CATALOG_DATA = "
    start = text.index(prefix) + len(prefix)
    payload = text[start:].strip().rstrip(";")
    return json.loads(payload)


def clean_text(value: str) -> str:
    text = EMOJI_RE.sub("", value or "")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def expand_summary(item: dict, detail: dict, summary: str) -> str:
    if len(summary.split()) >= 120:
        return summary
    name = item.get("name") or "this specimen"
    printers = ", ".join((detail.get("printProfile") or {}).get("printers") or [])[:120]
    return " ".join(
        [
            summary,
            f"{name} is part of the THEM 1947 Disclosure Alien Greys print series from Laughing Dragons studio.",
            "Each case file documents pose intent, display use, and slicer-ready settings for a display-grade Grey alien figure.",
            "These models are tuned for FDM and resin printing, with tree supports recommended on overhangs such as chin, hands, and feet.",
            "Typical settings use 0.16 to 0.20 mm layers, two to three walls, and ten to fifteen percent infill for display pieces.",
            f"Validated printer profiles include {printers or 'Bambu Lab P1S, P2S, and A1 series machines'}.",
            "Scale the model for desk collectibles or larger Halloween and UFO diorama props while keeping proportions intact.",
            "Download the source files on MakerWorld, print at home, then finish with primer, paint, and weathering for a classified-lab look.",
        ]
    )


def build_brief(item: dict) -> str:
    detail = item.get("detail") or {}
    name = html.escape(item.get("name") or "Classified specimen")
    case_no = html.escape(str(detail.get("caseFile") or ""))
    summary = clean_text(detail.get("summaryText") or item.get("blurb") or "")
    summary = expand_summary(item, detail, summary)
    features = [clean_text(f) for f in (detail.get("features") or []) if clean_text(f)]
    profile = detail.get("printProfile") or {}
    profile_bits = []
    for label, key in (
        ("Layer height", "layerHeight"),
        ("Walls", "walls"),
        ("Infill", "infill"),
        ("Supports", "supports"),
        ("Print time", "printTime"),
        ("Material weight", "weight"),
    ):
        val = profile.get(key)
        if val:
            profile_bits.append(f"{label}: {html.escape(str(val))}")
    profile_html = ""
    if profile_bits:
        profile_html = (
            "<h2>Print profile</h2><ul>"
            + "".join(f"<li>{bit}</li>" for bit in profile_bits)
            + "</ul>"
        )
    features_html = ""
    if features:
        features_html = (
            "<h2>Display and use cases</h2><ul>"
            + "".join(f"<li>{html.escape(f)}</li>" for f in features[:8])
            + "</ul>"
        )
    mw = html.escape(item.get("makerWorldUrl") or "")
    mw_link = f'<p><a href="{mw}">View files on MakerWorld</a></p>' if mw else ""
    return f"""<article class="case-crawler-brief prose">
  <p class="print-back"><a href="/files/prints/">&larr; Classified vault</a></p>
  <p class="pillar-eyebrow">THEM 1947 case file</p>
  <h1>{name}</h1>
  <p class="page-lead">Case file {case_no or "—"} — classified Grey specimen dossier with print-ready 3D model documentation from the THEM 1947 archive.</p>
  <p>{html.escape(summary)}</p>
  {features_html}
  {profile_html}
  <h2>About this archive entry</h2>
  <p>Each THEM 1947 case file documents a display-grade alien Grey print from the studio catalog: pose notes, recommended slicer settings, and MakerWorld download links. Files are free for personal printing; commercial use requires membership where noted on the live case page.</p>
  {mw_link}
</article>"""


def inject_page(path: Path, brief: str) -> bool:
    text = path.read_text(encoding="utf-8")

    def repl(match: re.Match[str]) -> str:
        return f"{match.group(1)}\n    {brief}\n  {match.group(3)}"

    updated, count = APP_RE.subn(repl, text, count=1)
    if not count:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def main() -> None:
    catalog = load_catalog()
    updated = 0
    for item in catalog.get("items") or []:
        href = (item.get("href") or "").strip()
        if not href.startswith("/files/prints/") or href.rstrip("/").endswith("/prints"):
            continue
        rel = href.strip("/") + "/index.html"
        path = ROOT / rel
        if not path.exists():
            print(f"skip missing {rel}")
            continue
        if inject_page(path, build_brief(item)):
            updated += 1
            print(f"updated {rel}")
    print(f"done — {updated} case file page(s) patched")


if __name__ == "__main__":
    main()
