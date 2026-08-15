# Contact standard — DO NOT FORGET

**Rule:** Never put `laughingdragonsproductions@gmail.com` on a public page. Use Web3Forms + Gmail plus addressing instead.

Contact standard: see this file before adding `mailto:` links anywhere.

## How it works

1. Create a Web3Forms access key at [web3forms.com](https://web3forms.com)
2. Set destination to the site-specific plus address (below) — **not** the base Gmail
3. Paste the access key into that site's `assets/js/config.js` → `web3formsAccessKey`
4. Privacy/Terms link to `/contact/` only — no public email
5. In Gmail: filter `to:plus-address` → label per site

## Per-site inbox map (Web3Forms dashboard only — never on-site)

| Site | Plus address | Config file |
|------|----------------|-------------|
| them1947.com | `laughingdragonsproductions+them1947@gmail.com` | `G:\LocalAIagent\Them1947\assets\js\config.js` |
| litprintz.com | `laughingdragonsproductions+litprintz@gmail.com` | `G:\LocalAIagent\lit-printz-site\assets\js\config.js` |
| laughing-dragons.com | `laughingdragonsproductions+laughingdragons@gmail.com` | `G:\LocalAIagent\laughing-dragons-site\assets\js\config.js` |

Reference implementation: Chittinn Chattin (`G:\Laughing Dragons\Chittinnchattin.com`) — privacy links to `/contact/`, Web3Forms disclosed, no mailto.

## AdSense compliance

- Privacy policy must disclose Web3Forms and AdSense cookies (already on Them1947)
- Contact **form** linked from privacy/terms is sufficient — raw email not required
- Do not expose the base `@gmail.com` inbox publicly

---

## Later sites to migrate (checklist)

- [ ] **Lit Printz** — create Web3Forms key → `+litprintz`; fill empty `web3formsAccessKey`; privacy already form-first
- [ ] **Laughing Dragons** — create key → `+laughingdragons`; remove mailto from `about/index.html` and `privacy/index.html`; point to `/contact/`
- [ ] **Each new site** — one Web3Forms key, one plus address, one Gmail filter label, zero public base Gmail

## Them1947 setup (do once)

1. [web3forms.com](https://web3forms.com) → new access key → email: `laughingdragonsproductions+them1947@gmail.com`
2. Gmail → filter → `to:laughingdragonsproductions+them1947@gmail.com` → label **Them1947**
3. Paste key into `assets/js/config.js` → `web3formsAccessKey`
4. Push to GitHub — contact form goes live
