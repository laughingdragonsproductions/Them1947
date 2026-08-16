# THEM 1947 - them1947.com

**Contact standard:** see [CONTACT-STANDARD.md](CONTACT-STANDARD.md) before adding `mailto:` links anywhere.

**Do not launch or `git push` this hub until given an explicit instruction.** Local preview only.

Phase 1 landing: two transmissions, then the **mainfile dossier** appears on the table (background clue) with **Terminal access** for clearance. Derive the short cyan code from the dossier - the long CodePhrase line is a red herring; only the compact clearance code works.

## Local preview

```powershell
cd G:\LocalAIagent\Them1947
python -m http.server 8080
```

Open `http://localhost:8080/` then `http://localhost:8080/files/`

## Brand

| File | Use |
|------|-----|
| `assets/brand/logo.png` | Header, favicon |
| `assets/brand/classified-placeholder.png` | Classified tile image (logo stamp) |
| `assets/brand/logo-dark.jpg` | Secondary badge (digital category card) |
| `assets/brand/ufo-night.png` | Archive hero still (classified / UFO night scene) |

## Catalog (MakerWorld pull)

```powershell
python scripts/pull-makerworld-catalog.py
```

Generates [`assets/js/catalog-data.js`](assets/js/catalog-data.js), downloads thumbnails to `assets/catalog/classified/` and `assets/catalog/declassified/`, and builds one **case-file page** per classified listing under `files/prints/{slug}/`.

- **Classified** - THEM 1947 / alien models (stamped previews, full dossier pages with MakerWorld stats, print profiles, BOM, and gallery)
- **Declassified** - non-alien public releases with MakerWorld links

Re-run weekly to refresh titles, stats, gallery images, and regenerate case-file shells. Agent Town or any scheduled runner can invoke the same script on a weekly cadence to keep token use low during manual edits.

## Owner preview gate

Before public launch, the site can stay behind a clearance code so the owner can review layout on the live domain.

In [`assets/js/config.js`](assets/js/config.js):

```javascript
previewGate: {
  enabled: true,      // set false for public launch
  passwordHash: "…",  // SHA-256 hex only - never commit the plaintext code
  maxFails: 3,
},
```

Generate a hash when setting or changing the clearance code:

```powershell
.\scripts\hash-preview-password.ps1
```

Paste the printed hex into `passwordHash`. The plaintext code is not stored in the repo; Inspect shows only the hash (short codes can still be brute-forced offline).

- **Landing** - after the intro video, click **Terminal access** and enter the code.
- **Inner pages** (`/files/`, `/about/`, etc.) - full-screen clearance gate if visited directly without access.
- Access is **session-only** (`sessionStorage`): closing the browser ends the session; owner re-enters the code on the next visit.
- Shared module: [`assets/js/site-gate.js`](assets/js/site-gate.js)

Local test: open `/files/` in a fresh tab - you should see the gate until the correct code is entered.

## AdSense

See [ADSENSE-MANUAL.md](ADSENSE-MANUAL.md). Slot IDs stay empty. Script does not load until slots are filled **and** the path is `/files/` or `/about/`. Landing stays ad-free.

## Deploy

See [DEPLOY.md](DEPLOY.md). Wait for a launch instruction before push / Cloudflare.
