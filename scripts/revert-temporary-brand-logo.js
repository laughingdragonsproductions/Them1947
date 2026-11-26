#!/usr/bin/env node
/** Clear temporary brand logo fields in config.js (post-promo cleanup). */
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "..", "assets", "js", "config.js");
let src = fs.readFileSync(configPath, "utf8");

if (!/temporaryLogo/.test(src)) {
  console.log("No temporary brand logo configured.");
  process.exit(0);
}

src = src.replace(
  /temporaryLogo:\s*"[^"]*",\s*\n\s*temporaryUntil:\s*"[^"]*",/,
  'temporaryLogo: "",\n    temporaryUntil: "",'
);

if (!/temporaryLogo:\s*""/.test(src)) {
  console.error("Could not clear brand.temporaryLogo in config.js");
  process.exit(1);
}

fs.writeFileSync(configPath, src);
console.log("Cleared temporary brand logo in config.js");