#!/usr/bin/env python3
"""Pull Raceit17 uploads from MakerWorld into assets/js/catalog-data.js."""

from __future__ import annotations

import html
import json
import re
import shutil
import ssl
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

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
USER_AGENT = "Them1947-catalog-pull/1.0"

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
]

DECLASSIFIED_IDS = {2498466, 2913433, 2964630}

CLASSIFIED_RE = re.compile(
    r"them\s*1947|alien|grey|greys|roswell|ufo|disclosure|3 foot|3-foot|"
    r"p1s version|intimidator|watcher|stalker|abductor|experimenter|"
    r"traveler|leader|observer|scientist|aggressor|crawler|karl|sign|"
    r"night crawler|roswell|medical scientist",
    re.I,
)

TAG_RE = re.compile(r"<[^>]+>")
LI_RE = re.compile(r"<li[^>]*>(.*?)</li>", re.I | re.S)
SUPPORT_RE = re.compile(r"supports?\s*:\s*([^<\n]+)", re.I)


def fetch_json(url: str, timeout: int = 30) -> dict | list:
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": USER_AGENT},
    )
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, context=ctx, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


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


def collect_models() -> dict[int, dict]:
    seen: dict[int, dict] = {}
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
    return seen


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


def extract_bullets(summary_html: str, limit: int = 6) -> list[str]:
    bullets: list[str] = []
    for match in LI_RE.finditer(summary_html or ""):
        line = strip_html(match.group(1))
        if line and len(line) > 4:
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
    return names


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
    return {
        "title": (instance.get("title") or "").strip(),
        "printers": printer_names(instance),
        "buildPlates": len(plates) if plates else None,
        "layerHeight": settings.get("layerHeight") or None,
        "walls": settings.get("wallLoops") or None,
        "infill": settings.get("sparseInfillDensity") or None,
        "supports": supports,
        "printTime": format_hours(instance.get("prediction")),
        "difficulty": format_difficulty(instance.get("score")),
        "downloadCount": instance.get("downloadCount"),
        "printCount": instance.get("printCount"),
        "ratingCount": instance.get("ratingCount"),
    }


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


def extract_bom(detail: dict) -> list[dict]:
    ext = detail.get("designExtension") or {}
    entries = ext.get("boms_of_filaments_v2") or ext.get("boms_of_filaments") or []
    bom: list[dict] = []
    for entry in entries[:12]:
        price_label, _ = lowest_price(entry)
        image = entry.get("image") or ""
        if not image:
            skus = entry.get("productSkuList") or []
            if skus:
                image = skus[0].get("image") or ""
        color_values = []
        for prop in entry.get("productProperyList") or []:
            if prop.get("key") == "Color":
                color_values = [v.get("value", "") for v in prop.get("values") or [] if v.get("value")]
        bom.append(
            {
                "name": entry.get("spuName") or entry.get("handle") or entry.get("sku") or "Filament",
                "quantity": entry.get("quantity") or 1,
                "image": image,
                "colorOptions": color_values[:8],
                "priceFrom": price_label,
                "url": entry.get("url") or "",
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


def enrich_classified_item(item: dict, detail: dict) -> None:
    instance = pick_instance(detail)
    summary_html = detail.get("summary") or ""
    ext = detail.get("designExtension") or {}
    slug_dir = CLASSIFIED_DIR / item["pathSlug"]
    gallery_urls = collect_gallery_urls(detail, instance)
    gallery = download_gallery(gallery_urls, slug_dir, item.get("image"))
    if gallery:
        item["image"] = gallery[0]
    item["detail"] = {
        "caseFile": item.get("caseFile"),
        "specimenLabel": item.get("specimenLabel"),
        "summaryText": strip_html(summary_html)[:1200] or item.get("blurb", ""),
        "features": extract_bullets(summary_html),
        "category": category_path(detail.get("categories")),
        "designer": (detail.get("designCreator") or {}).get("name") or "Raceit17",
        "designerAvatar": (detail.get("designCreator") or {}).get("avatar") or "",
        "publishedAt": (detail.get("createTime") or "")[:10] or None,
        "gallery": gallery or [item["image"]],
        "printProfile": extract_print_profile(instance) if instance else None,
        "bom": extract_bom(detail),
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
    title = hit.get("title", "").strip()
    item = {
        "id": f"mw-{hit['id']}",
        "makerWorldId": hit["id"],
        "name": title,
        "slug": slug,
        "pathSlug": path_slug or filename,
        "blurb": f"MakerWorld listing: {title}. "
        + (
            "Classified case file — checkout stays closed until declassification."
            if vault == "classified"
            else "Public release cleared for MakerWorld download."
        ),
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
        description = f"CASE FILE {item.get('caseFile', '000')} — {item['name']}. Classified THEM 1947 specimen file."
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
    js = (
        "/** Auto-generated by scripts/pull-makerworld-catalog.py — do not edit by hand. */\n"
        "window.CATALOG_DATA = "
        + json.dumps(payload, indent=2, ensure_ascii=False)
        + ";\n"
    )
    OUT_JS.write_text(js, encoding="utf-8")


def main() -> None:
    CLASSIFIED_DIR.mkdir(parents=True, exist_ok=True)
    DECLASSIFIED_DIR.mkdir(parents=True, exist_ok=True)
    PRINTS_DIR.mkdir(parents=True, exist_ok=True)

    models = collect_models()
    used_slugs: set[str] = set()
    items = []
    for hit in sorted(models.values(), key=lambda h: h["id"]):
        slug = hit.get("slug") or f"model-{hit['id']}"
        path_slug = unique_path_slug(slug, hit["id"], used_slugs)
        items.append(build_item(hit, path_slug))

    classified_items = [item for item in items if item["vault"] == "classified"]
    print(f"Fetching detail for {len(classified_items)} classified models…")
    for item in classified_items:
        detail = fetch_design(item["makerWorldId"])
        if detail:
            enrich_classified_item(item, detail)

    assign_case_files(items)
    emit_js(items)
    generate_case_pages(items)
    update_sitemap(items)

    summary = {"total": len(items), "classified": 0, "declassified": 0}
    for item in items:
        summary[item["vault"]] += 1
    print(
        f"Wrote {OUT_JS} — {summary['total']} models "
        f"({summary['classified']} classified, {summary['declassified']} declassified); "
        f"{summary['classified']} case-file pages"
    )


if __name__ == "__main__":
    main()
