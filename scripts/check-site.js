#!/usr/bin/env node
/** Static checks for THEM 1947 before deploy. Exit 1 on hard failures. */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const DIST_ONLY = process.argv.includes("--dist");
let errors = [];
let warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function fileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function readJsonFromJs(rel) {
  const src = readText(rel);
  const match = src.match(/window\.CATALOG_DATA\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) throw new Error("Could not parse CATALOG_DATA from " + rel);
  return Function("return " + match[1])();
}

const FORBIDDEN_PATTERNS = [
  { label: "pull script reference", re: /pull-makerworld-catalog\.py|Re-run python scripts\/pull-makerworld/i },
  { label: "AI meta preamble", re: /MakerWorld description written in the same style|written in the same style, with extra emphasis on boosting/i },
  { label: "Boost Me promo", re: /\bBoost Me\b/ },
  { label: "admin script instruction", re: /scripts\/pull-makerworld/i },
];

const SUMMARY_FORBIDDEN = [
  { label: "AI meta preamble", re: /MakerWorld description|written in the same style/i },
  { label: "Boost Me promo", re: /\bBoost Me\b/ },
  { label: "P1S scale preamble", re: /This has been scaled down to 248mm fit the P1S/i },
  { label: "collection promo header", re: /^THEM 1947 Disclosure Alien Greys Collection Explore/i },
];

function scanText(rel, text, patterns) {
  for (const { label, re } of patterns) {
    if (re.test(text)) fail(`${rel}: forbidden ${label}`);
  }
}

function scanTree(baseRel, patterns, filter) {
  const base = path.join(ROOT, baseRel);
  if (!fs.existsSync(base)) {
    fail(`Missing directory for scan: ${baseRel}`);
    return;
  }
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(ROOT, full).replace(/\\/g, "/");
      if (entry.isDirectory()) walk(full);
      else if (filter(entry.name)) scanText(rel, fs.readFileSync(full, "utf8"), patterns);
    }
  }
  walk(base);
}

console.log(DIST_ONLY ? "THEM 1947 deploy bundle check\n" : "THEM 1947 site check\n");

if (DIST_ONLY) {
  if (!fileExists(".worker-dist")) fail("Missing .worker-dist - run npm run build first");
  scanTree(
    ".worker-dist/assets/js",
    FORBIDDEN_PATTERNS,
    (name) => name.endsWith(".js")
  );
  scanTree(
    ".worker-dist",
    FORBIDDEN_PATTERNS,
    (name) => name.endsWith(".html")
  );
  try {
    const distCatalog = readJsonFromJs(".worker-dist/assets/js/catalog-data.js");
    for (const item of (distCatalog.items || []).filter((entry) => entry.vault === "classified")) {
      const summary = item.detail?.summaryText || "";
      for (const { label, re } of SUMMARY_FORBIDDEN) {
        if (re.test(summary)) {
          fail(`.worker-dist case notes (${item.id}): forbidden ${label}`);
        }
      }
    }
  } catch (error) {
    fail(String(error.message || error));
  }
} else {
  // JS syntax
  const jsDir = path.join(ROOT, "assets", "js");
  for (const name of fs.readdirSync(jsDir).filter((f) => f.endsWith(".js"))) {
    const full = path.join(jsDir, name);
    try {
      execSync(`node --check "${full}"`, { stdio: "pipe" });
    } catch (error) {
      fail("Syntax error in assets/js/" + name);
    }
  }

  // Required deploy files
  for (const rel of ["wrangler.jsonc", "package.json", "index.html", "assets/js/config.js"]) {
    if (!fileExists(rel)) fail("Missing required file: " + rel);
  }

  // Config sanity
  const configSrc = readText("assets/js/config.js");
  if (!/previewGate:\s*\{/.test(configSrc)) fail("config.js missing previewGate block");
  if (!/previewGate:\s*\{[\s\S]*?enabled:\s*false/.test(configSrc)) {
    fail("config.js previewGate.enabled must be false for public launch");
  }
  if (/password:\s*["']/.test(configSrc)) fail("config.js must not store plaintext preview password");
  if (/web3formsAccessKey:\s*""/.test(configSrc)) {
    warn("web3formsAccessKey is empty - contact form will not send until configured");
  }

  // Public asset guards
  scanText("assets/js/catalog.js", readText("assets/js/catalog.js"), FORBIDDEN_PATTERNS);
  const caseFileSrc = readText("assets/js/case-file.js");
  scanText("assets/js/case-file.js", caseFileSrc, FORBIDDEN_PATTERNS);
  if (!/data-printer/.test(caseFileSrc) || !/initCaseFilePrinters/.test(caseFileSrc)) {
    fail("case-file.js must expose clickable printer pills (data-printer + initCaseFilePrinters)");
  }

  // Catalog vs print pages
  let catalog;
  try {
    catalog = readJsonFromJs("assets/js/catalog-data.js");
  } catch (error) {
    fail(String(error.message || error));
    catalog = { items: [] };
  }

  const classified = (catalog.items || []).filter((item) => item.vault === "classified");
  for (const item of classified) {
    if (!item.href) {
      fail(`Classified item missing href: ${item.id || item.name}`);
      continue;
    }
    const pagePath = item.href.replace(/^\//, "").replace(/\/$/, "") + "/index.html";
    if (!fileExists(pagePath)) fail(`Missing case file page for ${item.id}: ${pagePath}`);
    if (item.image && !fileExists(item.image.replace(/^\//, ""))) {
      fail(`Missing catalog image for ${item.id}: ${item.image}`);
    }
    const summary = item.detail?.summaryText || "";
    for (const { label, re } of SUMMARY_FORBIDDEN) {
      if (re.test(summary)) fail(`Case notes (${item.id}): forbidden ${label}`);
    }
    if (/THEIR LEADER/i.test(item.name || "") && /Meet The Aggressor/i.test(summary)) {
      fail(`Case notes (${item.id}): THEIR LEADER listing must not use Aggressor copy`);
    }
  }

  // HTML script order on gated pages
  const htmlFiles = [];
  const SKIP_DIRS = new Set([".git", ".wrangler", ".worker-dist", "node_modules", ".github", ".cursor"]);

  function walkHtml(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkHtml(full);
      else if (entry.name.endsWith(".html")) htmlFiles.push(full);
    }
  }
  walkHtml(ROOT);

  for (const full of htmlFiles) {
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    if (rel === "lockout/index.html") continue;
    const html = fs.readFileSync(full, "utf8");
    if (!html.includes("site-gate.js")) continue;
    const configIdx = html.indexOf("config.js");
    const gateIdx = html.indexOf("site-gate.js");
    if (configIdx === -1 || gateIdx === -1 || configIdx > gateIdx) {
      fail(`Script order wrong (config before site-gate): ${rel}`);
    }
  }

  // Internal asset refs in index
  const indexHtml = readText("index.html");
  for (const match of indexHtml.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)) {
    const asset = match[1].replace(/^\//, "");
    if (!fileExists(asset)) fail(`index.html references missing asset: ${match[1]}`);
  }

  console.log(`Checked ${classified.length} classified case files, ${htmlFiles.length} HTML pages`);
}

if (warnings.length) {
  console.log("\nWarnings:");
  warnings.forEach((w) => console.log("  ⚠ " + w));
}
if (errors.length) {
  console.log("\nErrors:");
  errors.forEach((e) => console.log("  ✗ " + e));
  process.exit(1);
}

console.log("\nAll checks passed.");
