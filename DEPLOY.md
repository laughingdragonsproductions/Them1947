# Deploy THEM 1947 to Cloudflare Pages

Static site — no build step. Cloudflare serves files from the repo root.

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

Push to `main` — Cloudflare redeploys automatically.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Intro video not playing | Browsers require `muted` + `playsinline`; reduced-motion shows poster + folder immediately |
| Brief has no sound | Click the folder first (user gesture); unmute in video controls if needed |
| 404 on `/privacy/` | Ensure `privacy/index.html` exists |
| ads.txt 404 | File must be at repo root |
| Contact form says not configured | Paste Web3Forms access key in `assets/js/config.js` → `web3formsAccessKey` |
| Deploy fails on file size | Keep each video under 25 MB in `assets/video/` |
