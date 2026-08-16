const NAV = [
  { href: "/files/", label: "Archive" },
  { href: "/files/prints/", label: "Classified" },
  { href: "/files/declassified/", label: "Declassified" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
];

function renderHeader(activePath) {
  const cfg = window.SITE_CONFIG || {};
  return `<header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="/" aria-label="${cfg.legalName || "THEM 1947"} home">
        <img src="/assets/brand/logo.png" alt="${cfg.legalName || "THEM 1947"}" class="brand-logo" width="160" height="160" />
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <nav id="site-nav" class="site-nav" aria-label="Primary">
        ${NAV.map((item) => {
          const active =
            activePath === item.href ||
            (item.href === "/files/" && activePath === "/files/") ||
            (item.href === "/files/prints/" && activePath && activePath.startsWith("/files/prints/")) ||
            (item.href === "/files/declassified/" && activePath && activePath.startsWith("/files/declassified/")) ||
            (item.href === "/files/" && activePath === "/files/all/");
          return `<a href="${item.href}" class="nav-link${active ? " active" : ""}">${item.label}</a>`;
        }).join("")}
      </nav>
    </div>
  </header>`;
}

function renderSupportLinks() {
  const links = window.SITE_CONFIG?.links || {};
  const parts = [];
  if (links.makerWorld) {
    parts.push(
      `<a href="${links.makerWorld}" target="_blank" rel="noopener">MakerWorld</a>`
    );
  }
  if (links.buyMeACoffee) {
    parts.push(
      `<a href="${links.buyMeACoffee}" target="_blank" rel="noopener">Buy me a coffee</a>`
    );
  }
  if (!parts.length) return "";
  return `<p class="footer-support">${parts.join(" · ")}</p>`;
}

function renderFooter() {
  const cfg = window.SITE_CONFIG || {};
  const year = new Date().getFullYear();
  return `<footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <img src="/assets/brand/logo.png" alt="" class="footer-logo" width="120" height="120" loading="lazy" />
        <p class="footer-tagline">${cfg.tagline || ""}</p>
        ${renderSupportLinks()}
      </div>
      <nav class="footer-nav" aria-label="Explore">
        <strong>Archive</strong>
        ${NAV.map((item) => `<a href="${item.href}">${item.label}</a>`).join("")}
        <a href="/files/declassified/">Declassified</a>
        <a href="/files/all/">All classified</a>
      </nav>
      <nav class="footer-nav" aria-label="Legal">
        <strong>Legal</strong>
        <a href="/privacy/">Privacy</a>
        <a href="/terms/">Terms</a>
        <a href="/about/">About</a>
        <a href="/contact/">Contact</a>
      </nav>
    </div>
    <div class="container footer-bottom">
      <p>&copy; ${year} ${cfg.legalName || "THEM 1947"}. All rights reserved.</p>
    </div>
  </footer>`;
}

function hasConfiguredAdSlots() {
  const slots = window.SITE_CONFIG?.adsense?.slots || {};
  return Object.values(slots).some((id) => Boolean(id));
}

function adSlotWrap(slotKey, wrapClass, unitClass = "ad-unit") {
  const inner = renderAdSlot(slotKey, unitClass);
  return inner ? `<div class="ad-slot ${wrapClass}">${inner}</div>` : "";
}

function renderAdSlot(key, className = "ad-unit") {
  const cfg = window.SITE_CONFIG?.adsense || {};
  const slot = cfg.slots?.[key];
  if (!cfg.publisherId || !slot) return "";
  return `<ins class="adsbygoogle ${className}"
    style="display:block"
    data-ad-client="${cfg.publisherId}"
    data-ad-slot="${slot}"
    data-ad-format="auto"
    data-full-width-responsive="true"></ins>`;
}

function pushAds() {
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (_) {
    /* AdSense not loaded yet */
  }
}

const ADSENSE_ALLOW_PREFIXES = ["/files/", "/about/"];
const ADSENSE_BLOCK_SEGMENTS = ["coming-soon"];

function isMonetizablePath(path) {
  const p = path || window.location.pathname || "";
  if (p === "/" || p === "/index.html") return false;
  if (!ADSENSE_ALLOW_PREFIXES.some((prefix) => p.startsWith(prefix))) return false;
  if (ADSENSE_BLOCK_SEGMENTS.some((seg) => p.includes(seg))) return false;
  return true;
}

function loadAdSenseScript() {
  if (!hasConfiguredAdSlots()) return;
  if (!isMonetizablePath(window.location.pathname)) return;
  if (document.querySelector("script[data-t47-adsense]")) return;
  const pub = window.SITE_CONFIG?.adsense?.publisherId;
  if (!pub) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pub}`;
  s.crossOrigin = "anonymous";
  s.dataset.t47Adsense = "1";
  document.head.appendChild(s);
}

/** Strip redundant "THEM 1947" from case titles — brand already appears in site chrome. */
function cleanCaseName(name) {
  let s = String(name || "").trim().replace(/\s+/g, " ");
  s = s.replace(/(?:^|\s|[-–—])\s*THEM\s+1947(?:\s+Series)?\s*(?:[-–—]\s*)?/gi, " ");
  s = s.replace(/\s{2,}/g, " ").trim();
  s = s.replace(/^[-–—]\s*/, "").replace(/\s*[-–—]$/, "").trim();
  return s;
}

function resolveAdSlots(adSlots, activePath) {
  const path = window.location.pathname || activePath || "";
  if (!isMonetizablePath(path)) return false;
  return adSlots;
}

function initPage({ title, description, activePath, content, adSlots = true }) {
  const cfg = window.SITE_CONFIG || {};
  adSlots = resolveAdSlots(adSlots, activePath);
  document.title = title ? `${title} | ${cfg.name}` : cfg.name;
  const meta = document.querySelector('meta[name="description"]');
  if (meta && description) meta.content = description;

  const root = document.getElementById("app");
  if (!root) return;

  root.innerHTML = `
    ${renderHeader(activePath)}
    <main class="container page-main page-inner">
      ${adSlots ? adSlotWrap("header", "ad-top") : ""}
      ${content}
      ${adSlots ? adSlotWrap("footer", "ad-bottom") : ""}
    </main>
    ${renderFooter()}
  `;

  loadAdSenseScript();
  if (adSlots && hasConfiguredAdSlots()) pushAds();
  bindNav();
  bindReveal();
  bindContactForm();
}

function bindNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

function bindReveal() {
  const nodes = document.querySelectorAll(".reveal");
  if (!nodes.length || !("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: "0px 0px -5% 0px" }
  );
  nodes.forEach((n) => {
    if (n.classList.contains("print-grid") || n.classList.contains("mw-grid")) {
      n.classList.add("is-visible");
      return;
    }
    io.observe(n);
  });
}

function bindContactForm(options = {}) {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const statusEl = document.getElementById("contact-form-status");
  const cfg = window.SITE_CONFIG || {};
  const accessKey = cfg.web3formsAccessKey;
  const subjectPrefix = options.subjectPrefix || cfg.legalName || cfg.name || "THEM 1947";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!accessKey) {
      if (statusEl) {
        statusEl.textContent = "Contact form is not configured yet. Please try again later.";
        statusEl.className = "form-status form-status-error";
      }
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (statusEl) {
      statusEl.textContent = "Sending…";
      statusEl.className = "form-status form-status-pending";
    }

    const fd = new FormData(form);
    fd.append("access_key", accessKey);
    fd.append("from_name", subjectPrefix);
    const subject = fd.get("subject");
    fd.set("subject", subject ? `${subjectPrefix}: ${subject}` : `${subjectPrefix} — Contact form`);

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = `${cfg.domain || ""}/submissionsent/`;
        return;
      }
      throw new Error(data.message || "Something went wrong.");
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = err.message || "Could not send your message. Please try again.";
        statusEl.className = "form-status form-status-error";
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function renderContactForm({ intro = "" } = {}) {
  return `
    <div class="prose reveal">
      ${intro ? `<p>${intro}</p>` : ""}
      <form class="contact-form" id="contact-form" novalidate>
        <input type="checkbox" name="botcheck" class="contact-honeypot" tabindex="-1" autocomplete="off" aria-hidden="true" />
        <div class="form-field">
          <label for="contact-name">Name</label>
          <input type="text" id="contact-name" name="name" required autocomplete="name" maxlength="80" />
        </div>
        <div class="form-field">
          <label for="contact-email">Email</label>
          <input type="email" id="contact-email" name="email" required autocomplete="email" />
        </div>
        <div class="form-field">
          <label for="contact-subject">Subject <span class="optional">(optional)</span></label>
          <input type="text" id="contact-subject" name="subject" maxlength="120" />
        </div>
        <div class="form-field">
          <label for="contact-message">Message</label>
          <textarea id="contact-message" name="message" required rows="6" maxlength="5000"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Send transmission</button>
        <p class="form-status" id="contact-form-status" role="status" aria-live="polite"></p>
      </form>
    </div>`;
}
