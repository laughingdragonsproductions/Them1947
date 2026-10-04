#!/usr/bin/env node
/** Telegram + Pushover alerts for THEM 1947 deploys and catalog rescans. Never fails the caller. */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SCAN_REPORT = path.join(ROOT, ".scan-report.json");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function loadSecrets() {
  const fromEnv = {
    telegramToken: process.env.TELEGRAM_BOT_TOKEN || "",
    telegramChat: process.env.TELEGRAM_CHAT_ID || "",
    pushoverUser:
      process.env.PUSHOVER_USER_KEY ||
      process.env.PUSHOVER_USER ||
      "",
    pushoverToken:
      process.env.PUSHOVER_APP_TOKEN ||
      process.env.APP_TOKEN ||
      "",
  };
  if (
    fromEnv.telegramToken &&
    fromEnv.telegramChat &&
    fromEnv.pushoverUser &&
    fromEnv.pushoverToken
  ) {
    return fromEnv;
  }
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const tg = parseEnvFile(path.join(home, ".openclaw", "secrets", "jarvis-telegram.env"));
  const po = parseEnvFile(path.join(home, ".openclaw", "secrets", "jarvis-pushover.env"));
  return {
    telegramToken: fromEnv.telegramToken || tg.TELEGRAM_BOT_TOKEN || "",
    telegramChat: fromEnv.telegramChat || tg.TELEGRAM_CHAT_ID || "",
    pushoverUser:
      fromEnv.pushoverUser || po.PUSHOVER_USER_KEY || po.PUSHOVER_USER || "",
    pushoverToken:
      fromEnv.pushoverToken || po.PUSHOVER_APP_TOKEN || po.APP_TOKEN || "",
  };
}

async function sendTelegram(token, chatId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
}

async function sendPushover(userKey, appToken, title, message) {
  const body = new URLSearchParams({
    token: appToken,
    user: userKey,
    title,
    message,
  });
  const res = await fetch("https://api.pushover.net/1/messages.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pushover HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
}

async function notify(title, message) {
  const secrets = loadSecrets();
  const errors = [];
  if (secrets.telegramToken && secrets.telegramChat) {
    try {
      await sendTelegram(secrets.telegramToken, secrets.telegramChat, `${title}\n\n${message}`);
    } catch (err) {
      errors.push(String(err.message || err));
    }
  } else {
    errors.push("Telegram secrets missing");
  }
  if (secrets.pushoverUser && secrets.pushoverToken) {
    try {
      await sendPushover(secrets.pushoverUser, secrets.pushoverToken, title, message);
    } catch (err) {
      errors.push(String(err.message || err));
    }
  } else {
    errors.push("Pushover secrets missing");
  }
  if (errors.length) {
    console.warn("notify warnings:", errors.join("; "));
  }
}

function readScanReport() {
  if (!fs.existsSync(SCAN_REPORT)) return null;
  try {
    return JSON.parse(fs.readFileSync(SCAN_REPORT, "utf8"));
  } catch {
    return null;
  }
}

function formatScanMessage(report) {
  const lines = [];
  if (report.blocked) lines.push("Scan blocked by MakerWorld safety guard.");
  lines.push(`Classified: ${report.classifiedCount} (was ${report.previousClassifiedCount})`);
  if (report.added?.length) {
    lines.push(`New (${report.added.length}): ${report.added.map((a) => a.name).join(", ")}`);
  }
  if (report.removed?.length) {
    lines.push(`Removed (${report.removed.length}): ${report.removed.map((a) => a.name).join(", ")}`);
  }
  if (report.renamed?.length) {
    for (const row of report.renamed) {
      lines.push(`Renamed: ${row.name} -> /files/prints/${row.to}/`);
    }
  }
  if (report.detailFailureRate) {
    lines.push(`Detail failures: ${(report.detailFailureRate * 100).toFixed(1)}%`);
  }
  if (report.prunedAssets?.length) {
    lines.push(`Pruned assets: ${report.prunedAssets.length}`);
  }
  return lines.join("\n");
}

async function main() {
  const mode = process.argv[2] || "deploy";
  const sourceFlag = process.argv.indexOf("--source");
  const source =
    sourceFlag !== -1 ? process.argv[sourceFlag + 1] || "local" : process.env.NOTIFY_SOURCE || "github";

  if (mode === "scan") {
    const report = readScanReport();
    if (!report?.bigUpdate) {
      console.log("Scan report: no big update alert needed.");
      return;
    }
    const title = report.blocked
      ? "THEM1947 catalog rescan blocked"
      : "THEM1947 catalog big update";
    await notify(title, formatScanMessage(report));
    return;
  }

  const ok = process.env.GITHUB_JOB_STATUS
    ? String(process.env.GITHUB_JOB_STATUS).toLowerCase() === "success"
    : process.argv.includes("--success") || !process.argv.includes("--failure");
  const sha = (process.env.GITHUB_SHA || "").slice(0, 7);
  const actor = process.env.GITHUB_ACTOR || "local";
  const event = process.env.GITHUB_EVENT_NAME || source;
  const runUrl =
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : "";
  const title = ok ? "THEM1947 deployed" : "THEM1947 deploy FAILED";
  const lines = [
    ok ? "Live: https://them1947.com" : "Deploy did not complete successfully.",
    `Trigger: ${event}`,
    `By: ${actor}`,
  ];
  if (sha) lines.push(`Commit: ${sha}`);
  if (runUrl) lines.push(`Run: ${runUrl}`);
  await notify(title, lines.join("\n"));
}

main().catch((err) => {
  console.warn("notify failed soft:", err.message || err);
});
