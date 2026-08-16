# Deploy THEM 1947 to Cloudflare Pages

Static site — no build step. Cloudflare serves files from the repo root.

## Quick deploy (when Git push does not update the live site)

GitHub may have the latest code while **them1947.com** still serves an older upload. Confirm by viewing page source on `/` — Phase 2 includes `dossier-stage`, `bypass-bar`, and the hint **Two transmissions play first**.

**Option A — GitHub Actions (recommended after one-time setup)**

1. Cloudflare dashboard → **My Profile** → **API Tokens** → Create token with **Cloudflare Pages — Edit**
2. Copy your **Account ID** from the Pages project overview
3. GitHub repo → **Settings** → **Secrets and variables** → **Actions** → add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. Push to `main` or run the **Deploy Cloudflare Pages** workflow manually (**Actions** tab)

**Option B — deploy from this machine**

```powershell
cd G:\LocalAIagent\Them1947
npx wrangler login
.\scripts\deploy-cloudflare.ps1
```

**Option C — Cloudflare dashboard**

Pages → **them1947** → **Deployments** → **Retry deployment** or reconnect the GitHub integration to `main`.

## 1. Push this repo to GitHub

```powershell
cd G:\LocalAIagent\Them1947
git add .
git commit -m "Phase 1: coming-soon landing page"
git branch -M main
git remote add origin https://github.com/laughingdragonsproductions/Them1947.git
git push -u origin main
```

If `origin` already exists, skip `remote add` and run `git push -u origin main`.

## 2. Cloudflare Pages project

Repo: `laughingdragonsproductions/Them1947`

| Setting | Value |
|---------|-------|
| Project name | `them1947` |
| Production branch | `main` |
| Framework preset | None |
| Build command | (empty) |
| Build output directory | `/` (root) |

Preview URL: `https://them1947.pages.dev`

## Owner preview deploy (password gate)

Use this when the owner needs to review the full site on the live domain before everyone else sees it.

1. In `assets/js/config.js`, confirm:
   ```javascript
   previewGate: { enabled: true, passwordHash: "…", maxFails: 3 }
   ```
   Generate `passwordHash` with `.\scripts\hash-preview-password.ps1` — do **not** commit the plaintext clearance code.
2. Push to `main` — Cloudflare redeploys.
3. Tell the owner (plain language):
   - Open **https://them1947.com**
   - Tap **Tap to begin**, watch the intro (or let it finish)
   - Click **Terminal access**
   - Enter the clearance code you give them by phone or text
   - Browse the archive; bookmark `/files/` if helpful
   - **Closing the browser ends access** — they enter the code again on the next visit

Direct links (`/files/prints/`, `/about/`, etc.) show a clearance screen until the code is entered once in that browser session.

**Security note:** Only a SHA-256 hash of the clearance code is in `config.js` (not the code itself). Verification runs in the browser — zero Cloudflare Function requests. Determined users can still brute-force short codes from the hash; this keeps casual Inspect/view-source from showing the plaintext.

### Public launch checklist

1. Set `previewGate.enabled: false` in `assets/js/config.js`
2. Commit and push to `main`
3. Verify `/`, `/files/`, and `/about/` load with no gate
4. Proceed with AdSense, Search Console, etc. (sections below)

## 3. Custom domain — them1947.com

1. Pages project → **Custom domains** → **Set up a custom domain**
2. Add `them1947.com` and `www.them1947.com`
3. Wait for SSL (usually a few minutes)

## 4. Contact form (Web3Forms)

Do **not** publish the base Gmail on the site. Use a plus-filter inbox configured only in Web3Forms.

1. Go to [web3forms.com](https://web3forms.com) → create access key
2. Destination email: **`laughingdragonsproductions+them1947@gmail.com`**
3. Gmail → create filter `to:laughingdragonsproductions+them1947@gmail.com` → label **Them1947**
4. Paste access key into `assets/js/config.js` → `web3formsAccessKey`
5. Commit and push — `/contact/` form goes live

Full network standard: [CONTACT-STANDARD.md](CONTACT-STANDARD.md)

## 5. AdSense (wired, no units on landing yet)

Publisher ID: `ca-pub-7048606415692002`

- Root `ads.txt` is set for `pub-7048606415692002`
- `assets/js/config.js` has the publisher ID; slot IDs stay empty until phase 2
- **Do not** add display ad units to the coming-soon landing page

After the domain is live:

1. AdSense → **Sites** → **Add site** → `them1947.com`
2. Verify `https://them1947.com/ads.txt`
3. Ensure Privacy and Terms are linked (footer already does this)
4. Wait for review before enabling ad units on future pages

See [ADSENSE-MANUAL.md](ADSENSE-MANUAL.md) for full steps.

## 6. Search Console

1. Add property at [Google Search Console](https://search.google.com/search-console)
2. Submit `https://them1947.com/sitemap.xml`

## 7. Ongoing updates

Push to `main`, then confirm the live site updated (see **Quick deploy** above if it did not).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Push to GitHub but live site unchanged | Git integration may be stale — run `.\scripts\deploy-cloudflare.ps1` or set up GitHub Actions secrets (see **Quick deploy**) |
| Terminal / dossier missing on landing | Live deploy is still Phase 1 — redeploy; page source should include `bypass-bar` and `dossier-stage` |
| Intro video not playing | Browsers require `muted` + `playsinline`; reduced-motion shows poster + folder immediately |
| Brief has no sound | Click the folder first (user gesture); unmute in video controls if needed |
| 404 on `/privacy/` | Ensure `privacy/index.html` exists |
| ads.txt 404 | File must be at repo root |
| Contact form says not configured | Paste Web3Forms access key in `assets/js/config.js` → `web3formsAccessKey` |
| Deploy fails on file size | Keep each video under 25 MB in `assets/video/` |
