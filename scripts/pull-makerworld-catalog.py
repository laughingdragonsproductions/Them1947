#!/usr/bin/env python3
"""Pull Raceit17 uploads from MakerWorld into assets/js/catalog-data.js."""

from __future__ import annotations

import html
import json
import re
import shutil
import ssl
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

try:
    from curl_cffi import requests as cffi_requests

    HAS_CURL_CFFI = True
except ImportError:
    HAS_CURL_CFFI = False

ROOT = Path(__file__).resolve().parents[1]
OUT_JS = ROOT / "assets" / "js" / "catalog-data.js"
CATALOG_DIR = ROOT / "assets" / "catalog"
CLASSIFIED_DIR = CATALOG_DIR / "classified"
DECLASSIFIED_DIR = CATALOG_DIR / "declassified"
PRINTS_DIR = ROOT / "files" / "prints"
SITEMAP = ROOT / "sitemap.xml"
PROFILE_URL = "https://makerworld.com/en/@user_935464230"
SEARCH_API = "https://makerworld.com/api/v1/search-service/select/design2"
DESIGN_API = "https://makerworld.com/api/v1/design-service/design"
PUBLISHED_API = (
    "https://makerworld.com/api/v1/design-service/published/935464230/design"
)
CREATOR_HANDLE = "@user_935464230"
SCAN_REPORT = ROOT / ".scan-report.json"
REDIRECTS = ROOT / "_redirects"
CF_CHALLENGE_MARKERS = ("Just a moment", "cf-chl", "Enable JavaScript and cookies")
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

KEYWORDS = [
    "Raceit17",
    "THEM 1947",
    "Alien Grey",
    "Disclosure Alien Greys",
    "3 Foot Alien",
    "Medical Scientist 3 FOOT",
    "Roswell Grey",
    "remote control holder",
    "3 Place remote",
    "Bobcat Portable",
    "Wood Splitter Replacement",
    "THE INTIMIDATOR",
    "THE WATCHER",
    "THE STALKER",
    "THE ABDUCTOR",
    "THE AGGRESSOR",
    "THE NIGHT CRAWLER",
    "K.A.R.L",
    "Experimenter",
    "P1S Version",
    "Alien Greys SIGN",
    "3019183",
    "3019267",
    "2991422",
    "Roswell Grey Disclosure",
    "Bullet Buddy",
    "A.C. PETE",
    "Slugo",
    "Bucky",
    "shotgun slugo",
    "shotgon bucky",
    "One Hit Wonder",
    "3200946",
    "Descender",
    "spaceship",
    "3259272",
    "3396796",
    "3 Foot Series THE AGGRESSOR",
    "Baby Roz",
    "3288211",
    "3309255",
    "3322032",
]

DECLASSIFIED_IDS = {
    2498466,
    2913433,
    2964630,
    3103043,
    3105620,
    3109917,
}

FEATURED_CLASSIFIED_IDS = {
    3200946,
    3259272,
    3288211,
    3309255,
    3322032,
    3396796,
}

DISPLAY_TITLE_OVERRIDES = {
    2498466: "3 Place remote control holder for headboard",
    3105620: "Shotgun Bucky Bullet Buddy",
}

CLASSIFIED_RE = re.compile(
    r"them\s*1947|alien|grey|greys|roswell|ufo|disclosure|3 foot|3-foot|"
    r"p1s version|intimidator|watcher|stalker|abductor|experimenter|"
    r"traveler|leader|observer|scientist|aggressor|crawler|karl|sign|"
    r"night crawler|roswell|medical scientist",
    re.I,
)

TAG_RE = re.compile(r"<[^>]+>")
LI_RE = re.compile(r"<li[^>]*>(.*?)</li>", re.I | re.S)
P_RE = re.compile(r"<p\b[^>]*>.*?</p>", re.I | re.S)
SUPPORT_RE = re.compile(r"supports?\s*:\s*([^<\n]+)", re.I)
COMMERCIALME_RE = re.compile(r"<commercialme\b[^>]*>.*?</commercialme>", re.I | re.S)
BOOSTME_RE = re.compile(r"<boostme\b[^>]*>.*?</boostme>", re.I | re.S)
COFFEE_RE = re.compile(r"buymeacoffee\.com|buy\s*me\s*a\s*coffee", re.I)
PROMO_PLAIN_RE = re.compile(
    r"^Boost Me\s*(?:A lot of time goes into creating these models.*?collection going!\s*)?",
    re.I | re.S,
)
META_PREFIX_RE = re.compile(
    r"^Here['\u2019]?s a MakerWorld description written in the same style, with extra emphasis on boosting the model:\s*",
    re.I,
)
AI_META_RES = [
    re.compile(
        r"^Here['\u2019]?s a MakerWorld description written in the same style.*?model:\s*",
        re.I | re.S,
    ),
    re.compile(r"^written in the same style.*?model:\s*", re.I | re.S),
    re.compile(r"with extra emphasis on boosting\s*", re.I),
]
COLLECTION_FOOTER_RE = re.compile(
    r"\s*👽\s*Complete Your THEM 1947 Disclosure Alien Greys Collection.*$",
    re.I | re.S,
)
COLLECTION_BLOCK_RE = re.compile(
    r"^THEM\s+1947\s+Disclosure\s+Alien\s+Greys\s+Collection\s+Explore.*?(?=(?:Support My Work|THEM\s+1947\s+Disclosure\s+Alien\s+Greys\s+[---]|Disclosure\s+Alien\s+Grey\b|$))",
    re.I | re.S,
)
PATREON_FOOTER_RE = re.compile(
    r"\s*Support My Work If you['\u2019]?d like to sell physical prints.*$",
    re.I | re.S,
)
RATING_FOOTER_RE = re.compile(
    r"\s*If you enjoy my work, please consider:.*$",
    re.I | re.S,
)
P1S_PREAMBLE_RE = re.compile(
    r"^This has been scaled down to 248mm fit the P1S\..*?(?=👽\s*Complete Your|THEM\s+1947|$)",
    re.I | re.S,
)
PAGING_PREAMBLE_RE = re.compile(
    r"^PAGING DR\. STEVEN GREER, PAGING DR\. STEVEN GREER.*?\.?\s*",
    re.I | re.S,
)
DOWNLOAD_PREAMBLE_RE = re.compile(
    r"^It is recommended to download the 3MF file over the STL file.*?\.?\s*",
    re.I | re.S,
)
PROMO_BULLET_RE = re.compile(
    r"boost\s*me|buy\s*me\s*a\s*coffee|commercial\s*membership|make\s*money,\s*sell",
    re.I,
)
SUMMARY_MAX = 3500
REQUEST_GAP_SEC = 0.35
MAX_FETCH_ATTEMPTS = 4


def is_cloudflare_challenge(body: str) -> bool:
    if not body:
        return True
    sample = body[:800]
    if sample.lstrip().startswith("<!DOCTYPE") or sample.lstrip().startswith("<html"):
        return any(marker in sample for marker in CF_CHALLENGE_MARKERS)
    return False


def fetch_raw(url: str, timeout: int = 45) -> bytes:
    last_error: Exception | None = None
    for attempt in range(1, MAX_FETCH_ATTEMPTS + 1):
        try:
            if HAS_CURL_CFFI:
                resp = cffi_requests.get(
                    url,
                    headers={"Accept": "application/json", "User-Agent": USER_AGENT},
                    timeout=timeout,
                    impersonate="chrome131",
                )
                body = resp.content
                if resp.status_code >= 400:
                    raise urllib.error.HTTPError(url, resp.status_code, "HTTP error", None, None)
            else:
                req = urllib.request.Request(
                    url,
                    headers={"Accept": "application/json", "User-Agent": USER_AGENT},
                )
                ctx = ssl.create_default_context()
                with urllib.request.urlopen(req, context=ctx, timeout=timeout) as resp:
                    body = resp.read()
            text = body.decode("utf-8", errors="replace")
            if is_cloudflare_challenge(text):
                raise RuntimeError("MakerWorld blocked request (Cloudflare challenge)")
            return body
        except Exception as exc:
            last_error = exc
            wait = min(2**attempt, 12)
            print(f"warn: fetch attempt {attempt}/{MAX_FETCH_ATTEMPTS} {url}: {exc}")
            time.sleep(wait)
        finally:
            time.sleep(REQUEST_GAP_SEC)
    raise RuntimeError(f"fetch failed after {MAX_FETCH_ATTEMPTS} attempts: {last_error}")


def fetch_json(url: str, timeout: int = 45) -> dict | list:
    return json.loads(fetch_raw(url, timeout=timeout).decode("utf-8"))


def fetch_search(keyword: str, offset: int = 0, limit: int = 48) -> list[dict]:
    params = urllib.parse.urlencode({"limit": limit, "offset": offset, "keyword": keyword})
    url = f"{SEARCH_API}?{params}"
    data = fetch_json(url)
    return data.get("hits") or []


def fetch_design(model_id: int) -> dict | None:
    try:
        return fetch_json(f"{DESIGN_API}/{model_id}", timeout=45)
    except Exception as exc:
        print(f"warn: design detail {model_id}: {exc}")
        return None


def fetch_published_designs() -> tuple[list[dict], bool]:
    """Return Raceit17 published listing hits. Second value is False if entirely blocked."""
    hits: list[dict] = []
    blocked = False
    offset = 0
    limit = 48
    while True:
        params = urllib.parse.urlencode(
            {"handle": CREATOR_HANDLE, "limit": limit, "offset": offset}
        )
        url = f"{PUBLISHED_API}?{params}"
        try:
            data = fetch_json(url, timeout=60)
        except Exception as exc:
            print(f"warn: published listing offset {offset}: {exc}")
            blocked = True
            break
        batch = data.get("hits") or []
        if not batch:
            break
        for hit in batch:
            creator = hit.get("designCreator") or {}
            if creator.get("name") != "Raceit17":
                continue
            hits.append(hit)
        total = int(data.get("total") or 0)
        offset += limit
        if offset >= total:
            break
    return hits, blocked and not hits


def merge_item_from_previous(item: dict, previous: dict) -> None:
    """Keep rich detail when a live detail fetch fails."""
    for key in ("detail", "image", "href", "pathSlug", "caseFile", "specimenLabel"):
        if key in previous and previous.get(key) is not None:
            if key == "detail" and item.get("detail"):
                continue
            item[key] = previous[key]
    if previous.get("stats") and item.get("stats"):
        item["stats"] = {**previous["stats"], **item["stats"]}


def catalog_asset_paths(items: list[dict]) -> set[str]:
    refs: set[str] = set()
    for item in items:
        for key in ("image",):
            path = (item.get(key) or "").replace("\\", "/")
            if path.startswith("/assets/catalog/"):
                refs.add(path.lstrip("/"))
        detail = item.get("detail") or {}
        for gallery_path in detail.get("gallery") or []:
            path = (gallery_path or "").replace("\\", "/")
            if path.startswith("/assets/catalog/"):
                refs.add(path.lstrip("/"))
    return refs


def prune_orphan_catalog_assets(items: list[dict]) -> list[str]:
    """Remove catalog image files/dirs not referenced by the payload."""
    refs = catalog_asset_paths(items)
    removed: list[str] = []
    for base in (CLASSIFIED_DIR, DECLASSIFIED_DIR):
        if not base.exists():
            continue
        for entry in list(base.iterdir()):
            rel = entry.relative_to(ROOT).as_posix()
            if entry.is_file():
                if rel not in refs:
                    entry.unlink(missing_ok=True)
                    removed.append(rel)
                continue
            keep_dir = False
            for child in entry.rglob("*"):
                if child.is_file():
                    child_rel = child.relative_to(ROOT).as_posix()
                    if child_rel in refs:
                        keep_dir = True
                        break
            if not keep_dir:
                shutil.rmtree(entry, ignore_errors=True)
                removed.append(rel + "/")
    return removed


def read_redirect_lines() -> list[str]:
    if not REDIRECTS.exists():
        return []
    return [
        line.strip()
        for line in REDIRECTS.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]


def append_slug_redirects(
    previous_by_id: dict[int, dict], items: list[dict]
) -> list[str]:
    added: list[str] = []
    existing = set(read_redirect_lines())
    lines = read_redirect_lines()
    for item in items:
        if item.get("vault") != "classified":
            continue
        model_id = item.get("makerWorldId")
        prev = previous_by_id.get(model_id or 0)
        if not prev:
            continue
        old_slug = prev.get("pathSlug")
        new_slug = item.get("pathSlug")
        if not old_slug or not new_slug or old_slug == new_slug:
            continue
        for old_path in (
            f"/files/prints/{old_slug}",
            f"/files/prints/{old_slug}/",
        ):
            new_path = f"/files/prints/{new_slug}/"
            rule = f"{old_path} {new_path} 301"
            if rule in existing:
                continue
            lines.append(rule)
            existing.add(rule)
            added.append(rule)
    if lines:
        REDIRECTS.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return added


def write_scan_report(report: dict) -> None:
    SCAN_REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def build_scan_report(
    *,
    blocked: bool,
    previous_items: list[dict],
    items: list[dict],
    detail_failures: int,
    classified_detail_total: int,
    pruned: list[str],
    redirects_added: list[str],
) -> dict:
    prev_by_id = {i.get("makerWorldId"): i for i in previous_items if i.get("makerWorldId")}
    new_by_id = {i.get("makerWorldId"): i for i in items if i.get("makerWorldId")}
    added = [
        {"id": i.get("makerWorldId"), "name": i.get("name")}
        for mid, i in sorted(new_by_id.items())
        if mid not in prev_by_id
    ]
    removed = [
        {"id": i.get("makerWorldId"), "name": i.get("name")}
        for mid, i in sorted(prev_by_id.items())
        if mid not in new_by_id
    ]
    renamed = []
    stat_changes = []
    for mid, item in new_by_id.items():
        prev = prev_by_id.get(mid)
        if not prev:
            continue
        if prev.get("pathSlug") and item.get("pathSlug") and prev.get("pathSlug") != item.get("pathSlug"):
            renamed.append(
                {
                    "id": mid,
                    "name": item.get("name"),
                    "from": prev.get("pathSlug"),
                    "to": item.get("pathSlug"),
                }
            )
        prev_stats = prev.get("stats") or {}
        new_stats = item.get("stats") or {}
        delta = {}
        for key in ("likes", "boosts", "downloads", "prints"):
            if prev_stats.get(key, 0) != new_stats.get(key, 0):
                delta[key] = {"from": prev_stats.get(key, 0), "to": new_stats.get(key, 0)}
        if delta:
            stat_changes.append({"id": mid, "name": item.get("name"), "delta": delta})
    stat_changes.sort(
        key=lambda row: abs((row["delta"].get("boosts") or {}).get("to", 0) - (row["delta"].get("boosts") or {}).get("from", 0)),
        reverse=True,
    )
    prev_classified = sum(1 for i in previous_items if i.get("vault") == "classified")
    classified = sum(1 for i in items if i.get("vault") == "classified")
    failure_rate = (
        detail_failures / classified_detail_total if classified_detail_total else 0.0
    )
    big_update = bool(
        blocked
        or added
        or removed
        or renamed
        or failure_rate > 0.2
        or (prev_classified and classified < prev_classified)
    )
    return {
        "blocked": blocked,
        "pulledAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "added": added,
        "removed": removed,
        "renamed": renamed,
        "statChangesTop": stat_changes[:8],
        "classifiedCount": classified,
        "previousClassifiedCount": prev_classified,
        "detailFailures": detail_failures,
        "detailFailureRate": round(failure_rate, 4),
        "prunedAssets": pruned,
        "redirectsAdded": redirects_added,
        "bigUpdate": big_update,
    }


def inject_case_briefs() -> None:
    script = ROOT / "scripts" / "inject_case_file_crawler_brief.py"
    if not script.exists():
        print("warn: missing inject_case_file_crawler_brief.py")
        return
    import runpy

    runpy.run_path(str(script), run_name="__main__")


def collect_models() -> tuple[dict[int, dict], bool]:
    seen: dict[int, dict] = {}
    published_blocked = False
    published_hits, published_blocked = fetch_published_designs()
    for hit in published_hits:
        seen[hit["id"]] = hit
    if published_hits:
        print(f"Published listing: {len(published_hits)} Raceit17 model(s)")
    for keyword in KEYWORDS:
        for offset in (0, 48):
            try:
                hits = fetch_search(keyword, offset)
            except Exception as exc:
                print(f"warn: {keyword} offset {offset}: {exc}")
                continue
            if not hits:
                break
            for hit in hits:
                creator = hit.get("designCreator") or {}
                if creator.get("name") != "Raceit17":
                    continue
                seen[hit["id"]] = hit
    for model_id in sorted(DECLASSIFIED_IDS):
        if model_id in seen:
            continue
        detail = fetch_design(model_id)
        if not detail:
            print(f"warn: declassified design {model_id} unavailable")
            continue
        creator = detail.get("designCreator") or {}
        if creator.get("name") != "Raceit17":
            print(f"warn: declassified design {model_id} is not Raceit17")
            continue
        seen[model_id] = design_to_hit(detail)
    for model_id in sorted(FEATURED_CLASSIFIED_IDS):
        if model_id in seen:
            continue
        detail = fetch_design(model_id)
        if not detail or not detail.get("title"):
            print(f"warn: featured classified design {model_id} unavailable")
            continue
        creator = detail.get("designCreator") or {}
        if creator.get("name") != "Raceit17":
            print(f"warn: featured classified design {model_id} is not Raceit17")
            continue
        seen[model_id] = design_to_hit(detail)
    if OUT_JS.exists():
        try:
            for item in load_catalog_payload().get("items") or []:
                model_id = item.get("makerWorldId")
                if not model_id or model_id in seen:
                    continue
                detail = fetch_design(model_id)
                if not detail:
                    print(f"warn: existing catalog design {model_id} unavailable")
                    continue
                creator = detail.get("designCreator") or {}
                if creator.get("name") != "Raceit17":
                    continue
                seen[model_id] = design_to_hit(detail)
        except Exception as exc:
            print(f"warn: could not merge existing catalog ids: {exc}")
    blocked = published_blocked and not seen
    return seen, blocked


def design_to_hit(detail: dict) -> dict:
    creator = detail.get("designCreator") or {}
    return {
        "id": detail["id"],
        "title": detail.get("title") or "",
        "slug": detail.get("slug") or f"model-{detail['id']}",
        "cover": detail.get("coverUrl") or "",
        "coverUrl": detail.get("coverUrl") or "",
        "likeCount": detail.get("likeCount") or 0,
        "collectionCount": detail.get("collectionCount") or 0,
        "downloadCount": detail.get("downloadCount") or 0,
        "printCount": detail.get("printCount") or 0,
        "designCreator": creator,
    }


def clean_case_name(title: str) -> str:
    """Remove redundant THEM 1947 from display titles."""
    s = re.sub(r"\s+", " ", (title or "").strip())
    s = re.sub(
        r"(?:^|\s|[---])\s*THEM\s+1947(?:\s+Series)?\s*(?:[---]\s*)?",
        " ",
        s,
        flags=re.I,
    )
    s = re.sub(r"\s{2,}", " ", s).strip()
    s = re.sub(r"^[---]\s*", "", s)
    s = re.sub(r"\s*[---]$", "", s)
    return re.sub(r"\s{2,}", " ", s).strip()


def classify(hit: dict) -> str:
    model_id = hit["id"]
    if model_id in DECLASSIFIED_IDS:
        return "declassified"
    blob = f"{hit.get('title', '')} {hit.get('slug', '')}".lower()
    if CLASSIFIED_RE.search(blob):
        return "classified"
    return "declassified"


def safe_filename(slug: str, model_id: int) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", slug.lower()).strip("-") or f"mw-{model_id}"
    return base[:80]


def unique_path_slug(slug: str, model_id: int, used: set[str]) -> str:
    base = safe_filename(slug, model_id)
    candidate = base
    if candidate in used:
        candidate = f"{base}-{model_id}"
    used.add(candidate)
    return candidate


def download_file(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 0:
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        ctx = ssl.create_default_context()
        with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
            dest.write_bytes(resp.read())
        return True
    except Exception as exc:
        print(f"warn: download failed {dest.name}: {exc}")
        return False


def strip_html(text: str) -> str:
    if not text:
        return ""
    cleaned = TAG_RE.sub(" ", text)
    cleaned = html.unescape(cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


def sanitize_listing_html(html_text: str) -> str:
    """Remove MakerWorld membership, boost, and coffee promo blocks."""
    if not html_text:
        return ""

    text = COMMERCIALME_RE.sub("", html_text)
    text = BOOSTME_RE.sub("", text)

    def keep_paragraph(match: re.Match[str]) -> str:
        block = match.group(0)
        if COFFEE_RE.search(block):
            return ""
        if PROMO_BULLET_RE.search(strip_html(block)):
            return ""
        return block

    text = P_RE.sub(keep_paragraph, text)
    return text.strip()


def normalize_markdown(text: str) -> str:
    return re.sub(r"\*\*", "", text or "")


def normalize_dashes(text: str) -> str:
    return text.translate(str.maketrans({"\u2013": "-", "\u2014": "-", "\u2212": "-"}))


def polish_public_text(text: str) -> str:
    plain = normalize_dashes(text or "")
    plain = plain.replace("\u201c", '"').replace("\u201d", '"')
    plain = plain.replace("\u2018", "'").replace("\u2019", "'")
    plain = re.sub(r"\s+,", ",", plain)
    plain = re.sub(r"(?<=[a-z])-(?=[a-z])", " ", plain)
    plain = re.sub(r"\.{2,}", ".", plain)
    plain = re.sub(r"\s{2,}", " ", plain).strip()
    return plain


def display_title(model_id: int, title: str) -> str:
    return DISPLAY_TITLE_OVERRIDES.get(model_id, clean_case_name(title))


def item_blurb(title: str, vault: str) -> str:
    clean_title = re.sub(r"\.+$", "", (title or "").strip())
    if vault == "classified":
        return f"{clean_title}. Grey-series 3D print. Download the files on MakerWorld."
    return f"{clean_title}. Everyday 3D print. Download free on MakerWorld."


def polish_catalog_item(item: dict) -> None:
    model_id = item.get("makerWorldId") or 0
    title = normalize_dashes(display_title(model_id, item.get("name") or ""))
    item["name"] = title
    item["blurb"] = item_blurb(title, item.get("vault") or "declassified")
    detail = item.get("detail")
    if not isinstance(detail, dict):
        return
    if detail.get("summaryText"):
        detail["summaryText"] = polish_public_text(detail["summaryText"])
    if detail.get("features"):
        detail["features"] = [polish_public_text(line) for line in detail["features"]]


def polish_catalog_items(items: list[dict]) -> None:
    for item in items:
        polish_catalog_item(item)


def trim_to_model_title(text: str) -> str:
    title_match = re.search(
        r"THEM\s+1947\s+Disclosure\s+Alien\s+Greys\s+[---]\s*",
        text,
        re.I,
    )
    if title_match:
        return text[title_match.start() :].strip()
    roswell_match = re.search(r"Disclosure\s+Alien\s+Grey\b", text, re.I)
    if roswell_match:
        return text[roswell_match.start() :].strip()
    if re.match(r"THEM\s+1947\s+Disclosure\s+Alien\s+Greys\s+Collection\b", text, re.I):
        return text.strip()
    match = re.search(r"THEM\s+1947", text, re.I)
    if match:
        return text[match.start() :].strip()
    return text.strip()


def title_only_fallback(item_title: str = "", detail_title: str = "") -> str:
    raw = re.sub(r"\s+", " ", (detail_title or item_title or "")).strip()
    if not raw:
        return ""
    if re.search(r"THEM\s+1947", raw, re.I):
        return raw
    p1s_match = re.search(r"P1S\s+Version\s+(.+)", raw, re.I)
    if p1s_match:
        return f"THEM 1947 Disclosure Alien Greys - {p1s_match.group(1).strip()} (P1S Version)"
    return raw


def trim_case_note_body(text: str, item_title: str = "", detail_title: str = "") -> str:
    plain = text or ""
    for pattern in AI_META_RES:
        plain = pattern.sub("", plain)
    plain = PROMO_PLAIN_RE.sub("", plain).strip()
    plain = META_PREFIX_RE.sub("", plain).strip()
    plain = P1S_PREAMBLE_RE.sub("", plain).strip()
    plain = PAGING_PREAMBLE_RE.sub("", plain).strip()
    plain = DOWNLOAD_PREAMBLE_RE.sub("", plain).strip()
    plain = COLLECTION_BLOCK_RE.sub("", plain).strip()
    plain = trim_to_model_title(plain)
    plain = COLLECTION_FOOTER_RE.sub("", plain).strip()
    plain = COLLECTION_BLOCK_RE.sub("", plain).strip()
    plain = PATREON_FOOTER_RE.sub("", plain).strip()
    plain = RATING_FOOTER_RE.sub("", plain).strip()
    plain = normalize_markdown(plain)
    plain = re.sub(r"\s{2,}", " ", plain).strip()

    if (
        not plain
        or plain.startswith("This has been scaled")
        or re.match(r"THEM\s+1947\s+Disclosure\s+Alien\s+Greys\s+Collection\b", plain, re.I)
        or "Complete Your THEM 1947" in plain[:120]
    ):
        fallback = title_only_fallback(item_title, detail_title)
        if fallback:
            if plain and plain != fallback:
                plain = f"{fallback}. {plain}".strip()
            else:
                plain = fallback
    return polish_public_text(plain)


def listing_body_text(
    summary_html: str, fallback: str = "", item_title: str = "", detail_title: str = ""
) -> str:
    cleaned = sanitize_listing_html(summary_html)
    plain = strip_html(cleaned)
    plain = trim_case_note_body(plain, item_title, detail_title)
    if not plain:
        return fallback
    return plain[:SUMMARY_MAX]


def extract_bullets(summary_html: str, limit: int = 6) -> list[str]:
    cleaned = sanitize_listing_html(summary_html)
    bullets: list[str] = []
    for match in LI_RE.finditer(cleaned or ""):
        line = strip_html(match.group(1))
        if not line or len(line) <= 4:
            continue
        if PROMO_BULLET_RE.search(line):
            continue
        bullets.append(line)
        if len(bullets) >= limit:
            break
    return bullets


def parse_supports(summary_html: str) -> str | None:
    match = SUPPORT_RE.search(summary_html or "")
    if not match:
        return None
    return strip_html(match.group(1))


def format_hours(seconds: int | float | None) -> str | None:
    if not seconds:
        return None
    hours = float(seconds) / 3600.0
    return f"{hours:.1f} h"


def format_difficulty(score: float | None) -> str | None:
    if score is None:
        return None
    return f"{min(5.0, score * 5):.1f} / 5"


def category_path(categories: list[dict] | None) -> str | None:
    if not categories:
        return None
    names = [c.get("name", "") for c in categories if c.get("name")]
    if not names:
        return None
    return " > ".join(reversed(names))


PRINTER_ORDER = [
    "P2S",
    "A2L",
    "A1",
    "H2S",
    "H2C",
    "H2D",
    "X2D",
    "H2D Pro",
    "P1S",
    "P1P",
    "X1 Carbon",
    "X1",
    "X1E",
    "A1 mini",
]


def sort_printers(names: list[str]) -> list[str]:
    rank = {name: index for index, name in enumerate(PRINTER_ORDER)}
    return sorted(dict.fromkeys(names), key=lambda name: (rank.get(name, 100), name.lower()))


def setting_value(settings: dict, key: str):
    value = settings.get(key)
    if value is None or value == "":
        return None
    return value


def format_infill(value) -> str | None:
    if value is None or value == "":
        return None
    text = str(value).strip()
    if not text:
        return None
    if text.endswith("%"):
        return text
    return f"{text}%"


def format_weight(grams) -> str | None:
    if grams is None or grams == "":
        return None
    return f"{grams} g"


def printer_names(instance: dict) -> list[str]:
    names: list[str] = []
    ext = instance.get("extention") or {}
    model_info = ext.get("modelInfo") or {}
    compat = model_info.get("compatibility") or {}
    primary = compat.get("devProductName")
    if primary:
        names.append(primary)
    for entry in model_info.get("otherCompatibility") or []:
        name = entry.get("devProductName")
        if name and name not in names:
            names.append(name)
    for entry in ext.get("otherCompatibilityModelInfo") or []:
        name = entry.get("devProductName")
        if name and name not in names:
            names.append(name)
    return sort_printers(names)


def variant_from_compat_entry(entry: dict, fallback: dict) -> dict:
    model_info = entry.get("modelInfo") or {}
    settings = model_info.get("projectSettings") or {}
    plates = model_info.get("plates") or []
    return {
        "buildPlates": len(plates) if plates else fallback.get("buildPlates"),
        "layerHeight": setting_value(settings, "layerHeight") or fallback.get("layerHeight"),
        "walls": setting_value(settings, "wallLoops") or fallback.get("walls"),
        "infill": format_infill(setting_value(settings, "sparseInfillDensity")) or fallback.get("infill"),
        "printTime": format_hours(entry.get("prediction")) or fallback.get("printTime"),
        "weight": format_weight(entry.get("weight")) or fallback.get("weight"),
    }


def pick_instance(detail: dict) -> dict | None:
    instances = detail.get("instances") or []
    if not instances:
        return None
    for inst in instances:
        if inst.get("isDefault"):
            return inst
    return instances[0]


def extract_print_profile(instance: dict) -> dict:
    ext = instance.get("extention") or {}
    model_info = ext.get("modelInfo") or {}
    settings = model_info.get("projectSettings") or {}
    plates = model_info.get("plates") or []
    supports = parse_supports(instance.get("summary") or "")
    infill = format_infill(setting_value(settings, "sparseInfillDensity"))
    profile = {
        "title": (instance.get("title") or "").strip(),
        "printers": printer_names(instance),
        "buildPlates": len(plates) if plates else None,
        "layerHeight": setting_value(settings, "layerHeight"),
        "walls": setting_value(settings, "wallLoops"),
        "infill": infill,
        "supports": supports,
        "printTime": format_hours(instance.get("prediction")),
        "weight": format_weight(instance.get("weight")),
        "difficulty": format_difficulty(instance.get("score")),
        "downloadCount": instance.get("downloadCount"),
        "printCount": instance.get("printCount"),
        "ratingCount": instance.get("ratingCount"),
    }
    fallback = {
        "buildPlates": profile["buildPlates"],
        "layerHeight": profile["layerHeight"],
        "walls": profile["walls"],
        "infill": profile["infill"],
        "printTime": profile["printTime"],
        "weight": profile["weight"],
    }
    by_printer: dict[str, dict] = {}
    primary = (model_info.get("compatibility") or {}).get("devProductName")
    if primary:
        by_printer[primary] = dict(fallback)
    for entry in ext.get("otherCompatibilityModelInfo") or []:
        name = entry.get("devProductName")
        if name:
            by_printer[name] = variant_from_compat_entry(entry, fallback)
    for name in profile["printers"]:
        if name not in by_printer:
            by_printer[name] = dict(fallback)
    profile["printers"] = sort_printers(list(by_printer.keys()))
    profile["byPrinter"] = {name: by_printer[name] for name in profile["printers"]}
    return profile


def extract_print_profiles(detail: dict) -> list[dict]:
    instances = detail.get("instances") or []
    default_id = detail.get("defaultInstanceId")
    ordered = sorted(
        instances,
        key=lambda inst: (
            0 if inst.get("isDefault") or inst.get("id") == default_id else 1,
            inst.get("id") or 0,
        ),
    )
    return [extract_print_profile(inst) for inst in ordered]


def lowest_price(entry: dict) -> tuple[str | None, float | None]:
    skus = entry.get("productSkuList") or []
    best_price: float | None = None
    best_label: str | None = None
    for sku in skus:
        promo = sku.get("promotionInfo") or {}
        low = promo.get("lowestPrice")
        if low and (best_price is None or low < best_price):
            best_price = low
            best_label = promo.get("lowestPriceStr") or sku.get("priceStr")
        price = sku.get("price")
        if price and (best_price is None or price < best_price):
            best_price = price
            best_label = sku.get("priceStr") or f"${price:.2f}"
    return best_label, best_price


SUMMARY_MAX = 3500
BAMBU_STORE_BASE = "https://us.store.bambulab.com"


def match_bom_sku(entry: dict) -> dict | None:
    target = entry.get("sku")
    if not target:
        return None
    for sku in entry.get("productSkuList") or []:
        if sku.get("sku") == target:
            return sku
    return None


def sku_price_label(sku: dict) -> str | None:
    promo = sku.get("promotionInfo") or {}
    if promo.get("lowestPriceStr"):
        return promo.get("lowestPriceStr")
    if sku.get("priceStr"):
        return sku.get("priceStr")
    price = sku.get("price")
    if price:
        return f"${price:.2f} USD"
    return None


def sku_color(sku: dict, entry: dict) -> str:
    for prop in sku.get("productProperties") or []:
        if prop.get("key") == "Color" and prop.get("value"):
            return prop.get("value")
    name = sku.get("skuName") or ""
    if " / " in name:
        return name.split(" / ", 1)[0].strip()
    colors = []
    for prop in entry.get("productProperyList") or []:
        if prop.get("key") == "Color":
            colors = [v.get("value", "") for v in prop.get("values") or [] if v.get("value")]
    return colors[0] if colors else "Standard"


def bambu_store_url(handle: str, sku_id: str | int, model_id: int) -> str:
    params = urllib.parse.urlencode({"skr": "yes", "id": str(sku_id), "modelId": str(model_id)})
    slug = (handle or "").strip().strip("/")
    return f"{BAMBU_STORE_BASE}/products/{slug}?{params}"


def extract_bom(detail: dict, model_id: int | None = None) -> list[dict]:
    ext = detail.get("designExtension") or {}
    entries = ext.get("boms_of_filaments_v2") or ext.get("boms_of_filaments") or []
    bom: list[dict] = []
    maker_id = model_id or detail.get("id") or 0
    for entry in entries[:12]:
        matched = match_bom_sku(entry)
        price_label = sku_price_label(matched) if matched else None
        if not price_label:
            price_label, _ = lowest_price(entry)
        image = ""
        color = "Standard"
        url = entry.get("url") or ""
        if matched:
            image = matched.get("image") or ""
            color = sku_color(matched, entry)
            handle = entry.get("handle") or ""
            sku_id = matched.get("skuId")
            if handle and sku_id and maker_id:
                url = bambu_store_url(handle, sku_id, maker_id)
        if not image:
            skus = entry.get("productSkuList") or []
            if skus:
                image = skus[0].get("image") or ""
        if not color or color == "Standard":
            color_values = []
            for prop in entry.get("productProperyList") or []:
                if prop.get("key") == "Color":
                    color_values = [v.get("value", "") for v in prop.get("values") or [] if v.get("value")]
            if color_values:
                color = color_values[0]
        bom.append(
            {
                "name": entry.get("spuName") or entry.get("handle") or entry.get("sku") or "Filament",
                "quantity": entry.get("quantity") or 1,
                "image": image,
                "colorOptions": [color] if color else [],
                "priceFrom": price_label,
                "url": url,
            }
        )
    return bom


def extract_attachments(detail: dict) -> list[dict]:
    ext = detail.get("designExtension") or {}
    files: list[dict] = []
    for bucket, label in (
        ("model_files", "Model file"),
        ("design_guide", "Guide"),
        ("design_other", "Attachment"),
        ("design_video", "Video"),
    ):
        for entry in ext.get(bucket) or []:
            name = entry.get("modelName") or entry.get("name") or entry.get("thumbnailName")
            if not name:
                continue
            size = entry.get("modelSize") or entry.get("size") or 0
            files.append(
                {
                    "name": name,
                    "label": label,
                    "sizeBytes": size,
                    "url": entry.get("modelUrl") or entry.get("url") or "",
                }
            )
    return files[:8]


def collect_gallery_urls(detail: dict, instance: dict | None) -> list[str]:
    urls: list[str] = []
    cover = detail.get("coverUrl")
    if cover:
        urls.append(cover)
    ext = detail.get("designExtension") or {}
    for pic in ext.get("design_pictures") or []:
        url = pic.get("url")
        if url and url not in urls:
            urls.append(url)
    if instance:
        for pic in instance.get("pictures") or []:
            url = pic.get("url")
            if url and url not in urls:
                urls.append(url)
    return urls[:8]


def download_gallery(urls: list[str], slug_dir: Path, fallback_web_path: str | None) -> list[str]:
    web_paths: list[str] = []
    slug_dir.mkdir(parents=True, exist_ok=True)
    for index, url in enumerate(urls):
        ext = ".jpg" if ".jpg" in url.lower() else ".png"
        dest = slug_dir / f"gallery-{index + 1:02d}{ext}"
        if download_file(url, dest):
            web_paths.append(f"/assets/catalog/classified/{slug_dir.name}/{dest.name}")
    if not web_paths and fallback_web_path:
        web_paths.append(fallback_web_path)
    return web_paths


def enrich_classified_item(item: dict, detail: dict, leader_detail: dict | None = None) -> None:
    instance = pick_instance(detail)
    summary_html = detail.get("summary") or ""
    if item.get("makerWorldId") == 3004535 and leader_detail:
        summary_html = leader_detail.get("summary") or summary_html
    ext = detail.get("designExtension") or {}
    slug_dir = CLASSIFIED_DIR / item["pathSlug"]
    gallery_urls = collect_gallery_urls(detail, instance)
    gallery = download_gallery(gallery_urls, slug_dir, item.get("image"))
    if gallery:
        item["image"] = gallery[0]
    profiles = extract_print_profiles(detail)
    item["detail"] = {
        "caseFile": item.get("caseFile"),
        "specimenLabel": item.get("specimenLabel"),
        "summaryText": listing_body_text(
            summary_html,
            item.get("blurb", ""),
            item.get("name") or detail.get("title") or "",
            detail.get("title") or "",
        ),
        "features": extract_bullets(summary_html),
        "category": category_path(detail.get("categories")),
        "designer": (detail.get("designCreator") or {}).get("name") or "Raceit17",
        "designerAvatar": (detail.get("designCreator") or {}).get("avatar") or "",
        "publishedAt": (detail.get("createTime") or "")[:10] or None,
        "gallery": gallery or [item["image"]],
        "printProfile": profiles[0] if profiles else None,
        "printProfiles": profiles,
        "bom": extract_bom(detail, item.get("makerWorldId")),
        "attachments": extract_attachments(detail),
        "shareCount": detail.get("shareCount") or 0,
        "commentCount": detail.get("commentCount") or 0,
    }


def build_item(hit: dict, path_slug: str | None = None) -> dict:
    vault = classify(hit)
    slug = hit.get("slug") or f"model-{hit['id']}"
    filename = safe_filename(slug, hit["id"])
    ext = ".jpg" if ".jpg" in (hit.get("cover") or "").lower() else ".png"
    subdir = CLASSIFIED_DIR if vault == "classified" else DECLASSIFIED_DIR
    local_path = subdir / f"{filename}{ext}"
    cover = hit.get("cover") or hit.get("coverUrl") or ""
    if cover:
        download_file(cover, local_path)
    web_path = f"/assets/catalog/{vault}/{filename}{ext}"
    if not local_path.exists():
        web_path = "/assets/brand/classified-placeholder.png"

    model_url = f"https://makerworld.com/en/models/{hit['id']}-{slug}"
    title = display_title(hit["id"], hit.get("title", "").strip())
    item = {
        "id": f"mw-{hit['id']}",
        "makerWorldId": hit["id"],
        "name": title,
        "slug": slug,
        "pathSlug": path_slug or filename,
        "blurb": item_blurb(title, vault),
        "image": web_path,
        "status": vault,
        "vault": vault,
        "makerWorldUrl": model_url,
        "stats": {
            "likes": hit.get("likeCount") or 0,
            "boosts": hit.get("collectionCount") or 0,
            "downloads": hit.get("downloadCount") or 0,
            "prints": hit.get("printCount") or 0,
        },
        "buyHref": model_url if vault == "declassified" else None,
    }
    if vault == "classified":
        item["href"] = f"/files/prints/{item['pathSlug']}/"
    return item


def assign_case_files(items: list[dict]) -> None:
    classified = sorted(
        [item for item in items if item["vault"] == "classified"],
        key=lambda item: item["makerWorldId"],
    )
    for index, item in enumerate(classified, start=1):
        case_num = f"{index:03d}"
        item["caseFile"] = case_num
        item["specimenLabel"] = re.sub(r"\s+", " ", item["name"]).strip().upper()
        if item.get("detail") is not None:
            item["detail"]["caseFile"] = case_num
            item["detail"]["specimenLabel"] = item["specimenLabel"]


CASE_FILE_HTML = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="{description}" />
    <title>{title}</title>
    <link rel="icon" href="/assets/brand/logo.png" type="image/png" />
    <link rel="stylesheet" href="/assets/css/site.css" />
    <link rel="canonical" href="https://them1947.com/files/prints/{path_slug}/" />
  </head>
  <body>
    <div id="app"></div>
    <script src="/assets/js/config.js"></script>
    <script src="/assets/js/site-gate.js"></script>
    <script src="/assets/js/site.js"></script>
    <script src="/assets/js/catalog-data.js"></script>
    <script src="/assets/js/case-file.js"></script>
    <script>
      window.CASE_FILE_ID = "{item_id}";
      if (SiteGate.requireAccess()) {{
        initCaseFilePage();
      }}
    </script>
  </body>
</html>
"""


def generate_case_pages(items: list[dict]) -> set[str]:
    active_slugs: set[str] = set()
    for item in items:
        if item["vault"] != "classified":
            continue
        slug = item["pathSlug"]
        active_slugs.add(slug)
        page_dir = PRINTS_DIR / slug
        page_dir.mkdir(parents=True, exist_ok=True)
        description = f"CASE FILE {item.get('caseFile', '000')} - {item['name']}. Classified THEM 1947 specimen file."
        html_doc = CASE_FILE_HTML.format(
            description=html.escape(description),
            title=html.escape(item["name"]),
            path_slug=slug,
            item_id=item["id"],
        )
        (page_dir / "index.html").write_text(html_doc, encoding="utf-8")

    if PRINTS_DIR.exists():
        for child in PRINTS_DIR.iterdir():
            if child.is_dir() and child.name not in active_slugs:
                shutil.rmtree(child, ignore_errors=True)
    return active_slugs


STATIC_SITEMAP_URLS = [
    "https://them1947.com/",
    "https://them1947.com/spaceship/",
    "https://them1947.com/files/",
    "https://them1947.com/files/prints/",
    "https://them1947.com/files/declassified/",
    "https://them1947.com/files/all/",
    "https://them1947.com/about/",
    "https://them1947.com/contact/",
    "https://them1947.com/privacy/",
    "https://them1947.com/terms/",
]


def update_sitemap(items: list[dict]) -> None:
    urls = STATIC_SITEMAP_URLS.copy()
    for item in sorted(
        (i for i in items if i["vault"] == "classified"),
        key=lambda i: i.get("caseFile", ""),
    ):
        urls.append(f"https://them1947.com/files/prints/{item['pathSlug']}/")

    root = ET.Element(
        "urlset",
        {"xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9"},
    )
    for loc in urls:
        url_el = ET.SubElement(root, "url")
        loc_el = ET.SubElement(url_el, "loc")
        loc_el.text = loc
    tree = ET.ElementTree(root)
    ET.indent(tree, space="  ")
    tree.write(SITEMAP, encoding="UTF-8", xml_declaration=True)


def write_catalog_payload(payload: dict) -> None:
    js = "window.CATALOG_DATA = " + json.dumps(payload, indent=2, ensure_ascii=False) + ";\n"
    OUT_JS.write_text(js, encoding="utf-8")


def emit_js(items: list[dict]) -> None:
    classified = sum(1 for i in items if i["vault"] == "classified")
    declassified = sum(1 for i in items if i["vault"] == "declassified")
    payload = {
        "classifiedImage": "/assets/brand/classified-placeholder.png",
        "makerWorld": PROFILE_URL,
        "pulledAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "summary": {"total": len(items), "classified": classified, "declassified": declassified},
        "items": items,
    }
    write_catalog_payload(payload)


def load_catalog_payload() -> dict:
    src = OUT_JS.read_text(encoding="utf-8")
    json_part = src.split("window.CATALOG_DATA = ", 1)[1].strip()
    if json_part.endswith(";"):
        json_part = json_part[:-1]
    return json.loads(json_part)


def refresh_print_profiles() -> None:
    payload = load_catalog_payload()
    items = payload.get("items") or []
    classified = [item for item in items if item.get("vault") == "classified"]
    print(f"Refreshing printer profiles for {len(classified)} classified models…")
    for item in classified:
        detail = fetch_design(item["makerWorldId"])
        if not detail:
            continue
        profiles = extract_print_profiles(detail)
        if not item.get("detail"):
            item["detail"] = {}
        item["detail"]["printProfiles"] = profiles
        item["detail"]["printProfile"] = profiles[0] if profiles else None
        names = profiles[0]["printers"] if profiles else []
        print(f"  {item.get('name')}: {len(profiles)} profile(s), {len(names)} printers")
    payload["pulledAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_catalog_payload(payload)
    print(f"Updated print profiles in {OUT_JS}")


LEADER_CANONICAL_ID = 3009502


def refresh_case_notes() -> None:
    payload = load_catalog_payload()
    items = payload.get("items") or []
    classified = [item for item in items if item.get("vault") == "classified"]
    print(f"Refreshing case notes for {len(classified)} classified models…")
    leader_detail = fetch_design(LEADER_CANONICAL_ID)
    for item in classified:
        detail = fetch_design(item["makerWorldId"])
        if not detail:
            continue
        summary_html = detail.get("summary") or ""
        if item.get("makerWorldId") == 3004535 and leader_detail:
            summary_html = leader_detail.get("summary") or summary_html
        if not item.get("detail"):
            item["detail"] = {}
        item["detail"]["summaryText"] = listing_body_text(
            summary_html,
            item.get("blurb", ""),
            item.get("name") or detail.get("title") or "",
            detail.get("title") or "",
        )
        item["detail"]["features"] = extract_bullets(summary_html)
        preview = item["detail"]["summaryText"][:72].replace("\n", " ")
        preview = preview.encode("ascii", "replace").decode("ascii")
        print(f"  {item.get('name')}: {preview}...")
    payload["pulledAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_catalog_payload(payload)
    print(f"Updated case notes in {OUT_JS}")


def refresh_bom() -> None:
    payload = load_catalog_payload()
    items = payload.get("items") or []
    classified = [item for item in items if item.get("vault") == "classified"]
    print(f"Refreshing BOM links for {len(classified)} classified models…")
    for item in classified:
        detail = fetch_design(item["makerWorldId"])
        if not detail:
            continue
        bom = extract_bom(detail, item.get("makerWorldId"))
        if not item.get("detail"):
            item["detail"] = {}
        item["detail"]["bom"] = bom
        linked = sum(1 for entry in bom if entry.get("url"))
        print(f"  {item.get('name')}: {len(bom)} material(s), {linked} store link(s)")
    payload["pulledAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_catalog_payload(payload)
    print(f"Updated BOM data in {OUT_JS}")


def refresh_polish_catalog() -> None:
    payload = load_catalog_payload()
    items = payload.get("items") or []
    print(f"Polishing copy for {len(items)} catalog items…")
    polish_catalog_items(items)
    payload["items"] = items
    payload["pulledAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_catalog_payload(payload)
    print(f"Updated copy in {OUT_JS}")


def refresh_stats() -> None:
    payload = load_catalog_payload()
    items = payload.get("items") or []
    print(f"Refreshing stats for {len(items)} catalog items…")
    updated = 0
    for item in items:
        detail = fetch_design(item["makerWorldId"])
        if not detail:
            print(f"  warn: missing design {item.get('makerWorldId')}")
            continue
        hit = design_to_hit(detail)
        item["stats"] = {
            "likes": hit.get("likeCount") or 0,
            "boosts": hit.get("collectionCount") or 0,
            "downloads": hit.get("downloadCount") or 0,
            "prints": hit.get("printCount") or 0,
        }
        if item.get("detail") is not None:
            item["detail"]["shareCount"] = detail.get("shareCount") or 0
            item["detail"]["commentCount"] = detail.get("commentCount") or 0
        updated += 1
        stats = item["stats"]
        print(
            f"  {item.get('name')}: likes={stats['likes']} boosts={stats['boosts']} "
            f"downloads={stats['downloads']} prints={stats['prints']}"
        )
    payload["items"] = items
    payload["pulledAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_catalog_payload(payload)
    print(f"Updated stats for {updated}/{len(items)} items in {OUT_JS}")


def refresh_declassified() -> None:
    payload = load_catalog_payload()
    classified_items = [item for item in payload.get("items") or [] if item.get("vault") == "classified"]
    used_slugs = {item["pathSlug"] for item in payload.get("items") or []}
    print(f"Refreshing {len(DECLASSIFIED_IDS)} declassified models…")
    declassified_items: list[dict] = []
    for model_id in sorted(DECLASSIFIED_IDS):
        detail = fetch_design(model_id)
        if not detail:
            print(f"  warn: missing design {model_id}")
            continue
        creator = detail.get("designCreator") or {}
        if creator.get("name") != "Raceit17":
            print(f"  warn: design {model_id} is not Raceit17")
            continue
        hit = design_to_hit(detail)
        slug = hit.get("slug") or f"model-{model_id}"
        path_slug = unique_path_slug(slug, model_id, used_slugs)
        item = build_item(hit, path_slug)
        declassified_items.append(item)
        print(f"  {item['name']}")
    items = sorted(declassified_items + classified_items, key=lambda entry: entry["makerWorldId"])
    polish_catalog_items(items)
    assign_case_files(items)
    emit_js(items)
    print(f"Updated declassified listings in {OUT_JS}")


def main() -> None:
    if "--profiles-only" in sys.argv:
        refresh_print_profiles()
        return
    if "--bom-only" in sys.argv:
        refresh_bom()
        return
    if "--declassified-only" in sys.argv:
        refresh_declassified()
        return
    if "--polish-only" in sys.argv:
        refresh_polish_catalog()
        return
    if "--notes-only" in sys.argv:
        refresh_case_notes()
        return
    if "--stats-only" in sys.argv:
        refresh_stats()
        return

    CLASSIFIED_DIR.mkdir(parents=True, exist_ok=True)
    DECLASSIFIED_DIR.mkdir(parents=True, exist_ok=True)
    PRINTS_DIR.mkdir(parents=True, exist_ok=True)

    previous_items: list[dict] = []
    if OUT_JS.exists():
        try:
            previous_items = load_catalog_payload().get("items") or []
        except Exception as exc:
            print(f"warn: could not load previous catalog: {exc}")
    previous_by_id = {
        item.get("makerWorldId"): item
        for item in previous_items
        if item.get("makerWorldId")
    }

    models, discovery_blocked = collect_models()
    if discovery_blocked and not models:
        report = build_scan_report(
            blocked=True,
            previous_items=previous_items,
            items=previous_items,
            detail_failures=0,
            classified_detail_total=0,
            pruned=[],
            redirects_added=[],
        )
        write_scan_report(report)
        print("MakerWorld discovery blocked; no catalog changes written.")
        sys.exit(2)

    used_slugs: set[str] = set()
    items = []
    for hit in sorted(models.values(), key=lambda h: h["id"]):
        slug = hit.get("slug") or f"model-{hit['id']}"
        path_slug = unique_path_slug(slug, hit["id"], used_slugs)
        items.append(build_item(hit, path_slug))

    classified_items = [item for item in items if item["vault"] == "classified"]
    print(f"Fetching detail for {len(classified_items)} classified models…")
    leader_detail = fetch_design(LEADER_CANONICAL_ID)
    detail_failures = 0
    for item in classified_items:
        detail = fetch_design(item["makerWorldId"])
        if detail:
            enrich_classified_item(item, detail, leader_detail)
        else:
            detail_failures += 1
            prev = previous_by_id.get(item["makerWorldId"])
            if prev:
                merge_item_from_previous(item, prev)
                print(f"warn: kept previous detail for {item.get('name')}")

    prev_classified = sum(1 for i in previous_items if i.get("vault") == "classified")
    new_classified = len(classified_items)
    failure_rate = detail_failures / len(classified_items) if classified_items else 0.0
    if previous_items and new_classified < prev_classified:
        report = build_scan_report(
            blocked=True,
            previous_items=previous_items,
            items=items,
            detail_failures=detail_failures,
            classified_detail_total=len(classified_items),
            pruned=[],
            redirects_added=[],
        )
        write_scan_report(report)
        print(
            f"Safety stop: classified count dropped {prev_classified} -> {new_classified}"
        )
        sys.exit(2)
    if classified_items and failure_rate > 0.2:
        report = build_scan_report(
            blocked=True,
            previous_items=previous_items,
            items=items,
            detail_failures=detail_failures,
            classified_detail_total=len(classified_items),
            pruned=[],
            redirects_added=[],
        )
        write_scan_report(report)
        print(f"Safety stop: detail failure rate {failure_rate:.0%}")
        sys.exit(2)

    polish_catalog_items(items)
    redirects_added = append_slug_redirects(previous_by_id, items)
    assign_case_files(items)
    pruned = prune_orphan_catalog_assets(items)
    emit_js(items)
    generate_case_pages(items)
    inject_case_briefs()
    update_sitemap(items)

    report = build_scan_report(
        blocked=False,
        previous_items=previous_items,
        items=items,
        detail_failures=detail_failures,
        classified_detail_total=len(classified_items),
        pruned=pruned,
        redirects_added=redirects_added,
    )
    write_scan_report(report)

    summary = {"total": len(items), "classified": 0, "declassified": 0}
    for item in items:
        summary[item["vault"]] += 1
    print(
        f"Wrote {OUT_JS} - {summary['total']} models "
        f"({summary['classified']} classified, {summary['declassified']} declassified); "
        f"{summary['classified']} case-file pages"
    )
    if pruned:
        print(f"Pruned {len(pruned)} orphaned catalog asset(s)")


if __name__ == "__main__":
    main()
