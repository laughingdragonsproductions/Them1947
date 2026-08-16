# AdSense — manual steps for them1947.com

**Do not add the site or request review until launch is explicitly approved.** Slot IDs stay empty in the local hub.

## Allowlist (wired in `assets/js/site.js`)

Ads may load **only** when all of the following are true:

1. Auto ads are **off**
2. `adsense.slots` has at least one non-empty ID
3. Path starts with `/files/` or `/about/` (includes `/files/declassified/`)
4. Path is not a coming-soon stub

**Never** load ads on `/` (cinematic landing), `/contact/`, `/submissionsent/`, `/privacy/`, or `/terms/`.

## Policy notes (same matrix as Laughing Dragons)

- No Auto ads on thin pages (that caused the prior LD policy flag)
- Unique written copy on archive pages; classified placeholder images are OK if SKU blurbs are not duplicates
- No fake checkout — classified listings use a disabled CTA
- Shared publisher `ca-pub-7048606415692002` — add `them1947.com` as its own site in AdSense when launching

## When launching (later instruction)

1. AdSense → Ads → Auto ads → Disable
2. Create display units named for them1947.com (header / footer)
3. Paste slot IDs into `assets/js/config.js`
4. Confirm `/ads.txt` shows `pub-7048606415692002`
5. EU CMP message for `them1947.com` linking to `/privacy/`
