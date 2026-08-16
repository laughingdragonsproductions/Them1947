#!/usr/bin/env node
/** Static checks for THEM 1947 before deploy. Exit 1 on hard failures. */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
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

function readJsonFromJs(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
  const match = src.match(/window\.CATALOG_DATA\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) throw new Error("Could not parse CATALOG_DATA from " + rel);
  return Function("return " + match[1])();
}

console.log("THEM 1947 site check\n");

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
const configSrc = fs.readFileSync(path.join(ROOT, "assets/js/config.js"), "utf8");
if (!/previewGate:\s*\{/.test(configSrc)) fail("config.js missing previewGate block");
if (/password:\s*["']/.test(configSrc)) fail("config.js must not store plaintext preview password");
if (/web3formsAccessKey:\s*""/.test(configSrc)) {
  warn("web3formsAccessKey is empty — contact form will not send until configured");
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
const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
for (const match of indexHtml.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)) {
  const asset = match[1].replace(/^\//, "");
  if (!fileExists(asset)) fail(`index.html references missing asset: ${match[1]}`);
}

console.log(`Checked ${classified.length} classified case files, ${htmlFiles.length} HTML pages`);
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
