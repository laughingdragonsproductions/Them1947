#!/usr/bin/env node
/** Copy site files into .worker-dist for wrangler deploy (excludes .git, dev junk). */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, ".worker-dist");

const SKIP_DIRS = new Set([
  ".git",
  ".wrangler",
  ".worker-dist",
  "node_modules",
  ".github",
  ".cursor",
]);

const SKIP_FILES = new Set(["_mw_detail_sample.json"]);

function shouldSkip(name) {
  return SKIP_DIRS.has(name) || SKIP_FILES.has(name);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (shouldSkip(entry.name)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
    }
  }
}

if (fs.existsSync(OUT)) {
  fs.rmSync(OUT, { recursive: true, force: true });
}

copyDir(ROOT, OUT);
const count = fs.readdirSync(OUT, { recursive: true }).length;
console.log(`Prepared ${count} entries in .worker-dist`);
