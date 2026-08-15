# AdSense — manual steps for them1947.com

Phase 1 landing is intentionally **ad-free**. Complete these steps in **Google AdSense** after the domain is live (not in the repo):

## 0. Before you create ad units

1. AdSense → **Ads** → **Auto ads** → **Disable** until manual slot IDs are configured on finished content pages.
2. After deploy, view page source on `/` — confirm **no** `adsbygoogle.js` script tag on the coming-soon landing.
3. Confirm `https://them1947.com/ads.txt` loads and shows `pub-7048606415692002`.

## 1. Add the site

1. AdSense → **Sites** → **Add site** → `them1947.com`
2. Verify ownership via ads.txt (already in repo root)
3. Ensure Privacy and Terms pages are linked (footer on landing page)

## 2. Wait for review

The coming-soon page may qualify for site verification but not for serving ads yet. Do not enable ad units on thin or under-construction pages.

## 3. Phase 2 — when the full hub launches

Create display ad units only on finished content pages (games, articles, shop — not kids or coming-soon stubs).

Copy each **data-ad-slot** value into `assets/js/config.js`:

```javascript
adsense: {
  publisherId: "ca-pub-7048606415692002",
  slots: {
    header: "YOUR_SLOT_ID",
    footer: "YOUR_SLOT_ID",
    inContent: "",
  },
},
```

Then wire slots in page templates the same way as [laughing-dragons-site](https://github.com/laughingdragonsproductions/laughing-dragons-site).

## 4. Shared publisher

them1947.com uses the same AdSense publisher as laughing-dragons.com (`ca-pub-7048606415692002`). Each domain must be added separately in AdSense → Sites.
