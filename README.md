# THEM 1947 — them1947.com

**Contact standard:** see [CONTACT-STANDARD.md](CONTACT-STANDARD.md) before adding `mailto:` links anywhere.

Phase 1 is a cinematic coming-soon landing page: intro video, classified folder, brief video overlay. Static HTML — no build step. Deploys via GitHub → Cloudflare Pages like Laughing Dragons and Lit Printz.
## Local preview

```powershell
cd G:\LocalAIagent\Them1947
python -m http.server 8080
```

Open `http://localhost:8080/`

## Asset sources

Original media lives on `G:\Laughing Dragons\them1947.com`. Compressed web copies are in `assets/video/`:

| File | Source |
|------|--------|
| `assets/video/landing.mp4` | `Videos/Final cuts/Landingvideo.mp4` |
| `assets/video/classified-brief.mp4` | `Videos/Final cuts/Classified Brief.mp4` |
| `assets/video/landing-poster.jpg` | Last frame of landing video |
| `assets/brand/logo.png` | `Pictures/real logo.png` |

## Phase 2 (later)

Full Laughing Dragons-style hub: games, shop, tools, nav, AdSense ad units on finished pages.

## Deploy

See [DEPLOY.md](DEPLOY.md).

## AdSense

See [ADSENSE-MANUAL.md](ADSENSE-MANUAL.md). Coming-soon landing has no ad units — only `ads.txt` and config wiring for later.
