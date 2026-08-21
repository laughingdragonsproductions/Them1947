function getCaseFileItem() {
  const id = window.CASE_FILE_ID;
  return (window.CATALOG_DATA?.items || []).find((item) => item.id === id) || null;
}

function formatStat(n) {
  const num = Number(n) || 0;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(num);
}

function itemMakerWorldUrl(item) {
  return item.buyHref || item.makerWorldUrl || "";
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const REDACTION_WORDS = [
  "SUBJECT",
  "SPECIMEN",
  "MATERIAL",
  "FILAMENT",
  "CLEARANCE",
  "UNKNOWN",
  "AGENT",
  "BRIEFING",
  "MANIFEST",
  "EVIDENCE",
  "CORRIDOR",
  "CONTACT",
  "OBJECT",
  "SECURE",
  "LEVEL",
  "FIELD",
  "SCAN",
  "ROSWELL",
  "CRAFT",
  "NIGHT",
  "GREY",
  "UNIT",
  "DATA",
  "FILE",
  "PRINT",
  "BASE",
];

function seededRandom(seed) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return () => {
    hash += 0x6d2b79f5;
    let t = hash;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function renderRedactionLine(rng, barCount, inline = false) {
  const parts = [];
  for (let i = 0; i < barCount; i += 1) {
    const width = 1.8 + rng() * 5.5;
    parts.push(`<span class="r-block" style="width:${width.toFixed(2)}em"></span>`);
    if (rng() > 0.58 && i < barCount - 1) {
      const word = REDACTION_WORDS[Math.floor(rng() * REDACTION_WORDS.length)];
      parts.push(`<span class="r-peek">${word}</span>`);
    }
  }
  const tag = inline ? "span" : "div";
  return `<${tag} class="redaction-line">${parts.join("")}</${tag}>`;
}

function renderRedactionBars(seed, lines = 3, variant = "block") {
  const rng = seededRandom(String(seed || "redacted"));
  const inline = variant === "inline";
  const markup = Array.from({ length: lines }, () =>
    renderRedactionLine(rng, inline ? 4 + Math.floor(rng() * 3) : 5 + Math.floor(rng() * 5), inline)
  ).join("");
  const tag = inline ? "span" : "div";
  return `<${tag} class="redaction-bars redaction-bars--${variant}" role="img" aria-label="Redacted content">${markup}</${tag}>`;
}

function redacted(value, seed = "field") {
  if (value) return escapeHtml(value);
  return renderRedactionBars(seed, 1, "inline");
}

function redactedBlock(seed, lines = 3, suffixHtml = "") {
  return `<div class="case-redacted-block">${renderRedactionBars(seed, lines, "block")}${suffixHtml}</div>`;
}

function formatBytes(bytes) {
  const num = Number(bytes) || 0;
  if (!num) return "-";
  if (num >= 1048576) return `${(num / 1048576).toFixed(1)} MB`;
  if (num >= 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${num} B`;
}

function formatDate(iso, seed = "released-date") {
  if (!iso) return renderRedactionBars(seed, 1, "inline");
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return escapeHtml(iso);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function renderGallery(item, detail) {
  const images = detail.gallery?.length ? detail.gallery : [item.image];
  const main = images[0];
  const thumbs = images.slice(0, 5);
  const stamp = item.vault === "classified" ? `<span class="case-evidence-stamp">Evidence</span>` : "";
  return `<section class="case-gallery" aria-label="Evidence photos">
    <p class="case-label">Evidence photo 001</p>
    <div class="case-gallery-main">
      <span class="case-paperclip" aria-hidden="true"></span>
      <img class="case-gallery-hero" src="${main}" alt="${escapeHtml(cleanCaseName(item.name))}" width="640" height="480" />
      ${stamp}
    </div>
    <div class="case-gallery-thumbs">
      ${thumbs
        .map(
          (src, index) =>
            `<button type="button" class="case-thumb${index === 0 ? " is-active" : ""}" data-gallery-src="${src}" aria-label="View image ${index + 1}">
              <img src="${src}" alt="" loading="lazy" />
            </button>`
        )
        .join("")}
    </div>
  </section>`;
}

function renderEngagement(item, detail) {
  const stats = item.stats || {};
  return `<div class="case-engagement" aria-label="Engagement stats">
    <span><strong>${formatStat(stats.boosts)}</strong> Boosts</span>
    <span><strong>${formatStat(stats.likes)}</strong> Likes</span>
    <span><strong>${formatStat(stats.downloads)}</strong> Downloads</span>
    <span><strong>${formatStat(stats.prints)}</strong> Prints</span>
    <span class="case-engagement-date">Released ${formatDate(detail.publishedAt, `released-${item.id}`)}</span>
  </div>`;
}

function getPrintProfiles(detail) {
  if (detail.printProfiles?.length) return detail.printProfiles;
  return detail.printProfile ? [detail.printProfile] : [];
}

function mergePrinterSpecs(profile, printerName) {
  const override = (profile.byPrinter && printerName && profile.byPrinter[printerName]) || {};
  return { ...profile, ...override };
}

function formatPlateCount(count) {
  if (count == null || count === "") return null;
  const num = Number(count);
  if (!Number.isFinite(num)) return String(count);
  return `${num} plate${num === 1 ? "" : "s"}`;
}

function formatLayerHeight(value) {
  if (!value) return null;
  const text = String(value);
  return /mm/i.test(text) ? text : `${text} mm`;
}

function renderSettingRows(profile) {
  const rows = [
    ["Build plate", formatPlateCount(profile.buildPlates)],
    ["Layer height", formatLayerHeight(profile.layerHeight)],
    ["Walls", profile.walls || null],
    ["Infill", profile.infill || null],
    ["Supports", profile.supports || null],
    ["Print time (est.)", profile.printTime || null],
    ["Filament", profile.weight || null],
    ["Difficulty", profile.difficulty || null],
  ];
  return rows
    .map(
      ([label, value]) => `<div class="case-setting-row">
            <dt>${label}</dt>
            <dd>${redacted(value, `setting-${label}`)}</dd>
          </div>`
    )
    .join("");
}

function renderPrinterPills(printers, activeName, options = {}) {
  if (!printers.length) {
    const seed = options.seed || "printer-pills";
    const link = options.mwUrl
      ? `<p class="case-redacted-note"><a href="${escapeHtml(options.mwUrl)}" target="_blank" rel="noopener">View print profiles on MakerWorld</a></p>`
      : "";
    return `${renderRedactionBars(seed, 2, "block")}${link}`;
  }
  return `<div class="case-profile-pills" role="tablist" aria-label="Printer models">${printers
    .map((name) => {
      const active = name === activeName;
      return `<button type="button" class="case-pill${active ? " is-active" : ""}" role="tab" aria-selected="${active ? "true" : "false"}" data-printer="${escapeHtml(name)}">${escapeHtml(name)}</button>`;
    })
    .join("")}</div>`;
}

function renderProfileChoices(profiles, activeIndex) {
  if (profiles.length < 2) return "";
  return `<div class="case-profile-choices" role="tablist" aria-label="Print profiles">${profiles
    .map((profile, index) => {
      const active = index === activeIndex;
      const label = profile.title || `Profile ${index + 1}`;
      return `<button type="button" class="case-profile-choice${active ? " is-active" : ""}" role="tab" aria-selected="${active ? "true" : "false"}" data-profile-index="${index}">${escapeHtml(label)}</button>`;
    })
    .join("")}</div>`;
}

function renderCoffeeLink() {
  const url = window.SITE_CONFIG?.links?.buyMeACoffee;
  if (!url) return "";
  return `<p class="case-coffee-link"><a href="${escapeHtml(url)}" target="_blank" rel="noopener">Buy Me a Coffee</a></p>`;
}

function renderCommercialMembershipLink() {
  const url = window.SITE_CONFIG?.links?.commercialMembership;
  if (!url) return "";
  return `<a class="case-commercial-btn" href="${escapeHtml(url)}" target="_blank" rel="noopener">Join Commercial Membership</a>`;
}

function isFeaturedCollabRelease(item) {
  const featured = window.SITE_CONFIG?.featuredRelease;
  if (!featured || !item) return false;
  return (
    item.makerWorldId === featured.makerWorldId ||
    item.pathSlug === featured.pathSlug
  );
}

function renderLitPrintzCoozieLink(item) {
  if (!isFeaturedCollabRelease(item)) return "";
  const url = window.SITE_CONFIG?.links?.litPrintzCoozie;
  if (!url) return "";
  return `<a class="case-litprintz-btn" href="${escapeHtml(url)}" target="_blank" rel="noopener">Custom Alien Can Coozie on Lit Printz</a>`;
}

function renderPrintProfile(item, detail) {
  const profiles = getPrintProfiles(detail);
  const profile = profiles[0] || detail.printProfile || {};
  const printers = profile.printers || [];
  const activePrinter = printers[0] || "";
  const specs = mergePrinterSpecs(profile, activePrinter);

  const settings = profile.title
    ? `<p class="case-profile-title">${escapeHtml(profile.title)}</p>`
    : redactedBlock(`profile-title-${item.id}`, 2);

  return `<section class="case-dossier" aria-label="Print dossier">
    <div class="case-designer">
      ${detail.designerAvatar ? `<img src="${detail.designerAvatar}" alt="" class="case-designer-avatar" width="40" height="40" />` : ""}
      <div>
        <p class="case-label">Designer</p>
        <div class="case-designer-name">${redacted(detail.designer, `designer-${item.id}`)}</div>
      </div>
    </div>
    <p class="case-label">Category</p>
    <div class="case-category">${redacted(detail.category, `category-${item.id}`)}</div>
    <p class="case-label">Print profile${profiles.length > 1 ? ` (${profiles.length})` : ""}</p>
    ${renderProfileChoices(profiles, 0)}
    ${settings}
    ${renderPrinterPills(printers, activePrinter, { seed: `printers-${item.id}`, mwUrl: item.makerWorldUrl })}
    <dl class="case-settings">
      ${renderSettingRows(specs)}
    </dl>
    ${renderCommercialMembershipLink()}
    ${renderLitPrintzCoozieLink(item)}
    <a class="case-mw-btn" href="${item.makerWorldUrl}" target="_blank" rel="noopener">View on MakerWorld</a>
    ${renderCoffeeLink()}
    <div class="case-action-stats">
      <span title="Boosts">&#128640; ${formatStat(item.stats?.boosts)}</span>
      <span title="Likes">&#128077; ${formatStat(item.stats?.likes)}</span>
      <span title="Downloads">&#11015; ${formatStat(item.stats?.downloads)}</span>
      <span title="Shares">&#128257; ${formatStat(detail.shareCount)}</span>
    </div>
  </section>`;
}

function renderBom(detail, mwUrl, itemId = "bom") {
  const bom = detail.bom || [];
  if (!bom.length) {
    const suffix = `<p class="case-redacted-note"><a href="${escapeHtml(mwUrl)}" target="_blank" rel="noopener">View materials on MakerWorld</a></p>`;
    return `<section class="case-bom case-bom-empty">
      <div class="case-section-head">
        <h2>Bill of materials</h2>
        <span class="case-stamp case-stamp-green">Authorized personnel only</span>
      </div>
      ${redactedBlock(`bom-${itemId}`, 4, suffix)}
    </section>`;
  }

  return `<section class="case-bom">
    <div class="case-section-head">
      <h2>Bill of materials</h2>
      <span class="case-stamp case-stamp-green">Authorized personnel only</span>
    </div>
    <div class="case-bom-grid">
      ${bom
        .map((entry) => {
          const price = entry.priceFrom
            ? `From ${escapeHtml(entry.priceFrom)}`
            : renderRedactionBars(`bom-price-${entry.name}-${itemId}`, 1, "inline");
          const color = entry.colorOptions?.[0] || "Standard";
          const card = `<article class="case-bom-card">
            <img src="${entry.image || "/assets/brand/classified-placeholder.png"}" alt="" class="case-bom-swatch" loading="lazy" />
            <div class="case-bom-copy">
              <h3>${escapeHtml(entry.name)}</h3>
              <p>x${entry.quantity || 1} · ${escapeHtml(color)}</p>
              <p class="case-bom-price">${price}</p>
            </div>
          </article>`;
          if (entry.url) {
            return `<a class="case-bom-card-link" href="${escapeHtml(entry.url)}" target="_blank" rel="noopener sponsored">${card}</a>`;
          }
          return card;
        })
        .join("")}
    </div>
  </section>`;
}

function renderCaseNotes(item, detail) {
  const features = detail.features?.length
    ? `<ul class="case-features">${detail.features.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
    : redactedBlock(`features-${item.id}`, 3);

  return `<section class="case-notes">
    <h2>Case notes</h2>
    <p>${escapeHtml(detail.summaryText || item.blurb || "")}</p>
    ${features}
    <p class="case-stamp case-stamp-red case-stamp-care">Handle with care: non-human biological specimen</p>
  </section>`;
}

function renderAttachments(item, detail) {
  const files = detail.attachments?.length
    ? detail.attachments.slice()
    : [{ name: "Live listing dossier", label: "MakerWorld", sizeBytes: 0, url: item.makerWorldUrl }];

  if (isFeaturedCollabRelease(item)) {
    const coozieUrl = window.SITE_CONFIG?.links?.litPrintzCoozie;
    if (coozieUrl) {
      files.push({
        name: "Custom Alien Can Coozie",
        label: "Lit Printz · free STL",
        sizeBytes: 0,
        url: coozieUrl,
      });
    }
  }

  return `<section class="case-attachments">
    <div class="case-section-head">
      <h2>Evidence &amp; related files</h2>
      <span class="case-stamp case-stamp-red case-stamp-secret">Top secret</span>
    </div>
    <ul class="case-file-list">
      ${files
        .map((file) => {
          const href = file.url || item.makerWorldUrl;
          const external = href.startsWith("http") ? ' target="_blank" rel="noopener"' : "";
          return `<li>
            <a href="${href}"${external}>
              <span class="case-file-name">${escapeHtml(file.name)}</span>
              <span class="case-file-meta">${escapeHtml(file.label)} · ${formatBytes(file.sizeBytes)}</span>
            </a>
          </li>`;
        })
        .join("")}
    </ul>
  </section>`;
}

function renderCaseFile(item) {
  const detail = item.detail || {};
  const caseFile = item.caseFile || detail.caseFile || "000";
  const displayName = cleanCaseName(item.name);
  const specimen = cleanCaseName(item.specimenLabel || detail.specimenLabel || item.name).toUpperCase();
  const mwUrl = itemMakerWorldUrl(item);

  return `<article class="case-file reveal">
    <p class="print-back case-back"><a href="/files/prints/">&larr; Classified vault</a></p>
    <div class="case-folder">
      <aside class="case-tab" aria-hidden="true">
        <span>CASE FILE ${caseFile}</span>
        <span>SPECIMEN: ${escapeHtml(specimen.slice(0, 28))}</span>
      </aside>
      <header class="case-header">
        <div class="case-header-brand">
          <img src="/assets/brand/logo.png" alt="THEM 1947" width="72" height="72" />
          <div>
            <p class="case-brand-url">THEM1947.COM</p>
            <p class="case-label">Archive specimen file</p>
          </div>
        </div>
        <div class="case-header-title">
          <p class="case-case-id">CASE FILE ${caseFile}</p>
          <h1>${escapeHtml(displayName)}</h1>
        </div>
        <div class="case-header-stamps">
          <span class="case-stamp case-stamp-green">Disclosure day</span>
          <span class="case-stamp case-stamp-green">Status: active</span>
          <span class="classified-stamp classified-stamp-lg">Classified</span>
        </div>
      </header>
      <div class="case-main-grid">
        <div class="case-main-left">
          ${renderGallery(item, detail)}
          ${renderEngagement(item, detail)}
        </div>
        ${renderPrintProfile(item, detail)}
      </div>
      ${renderBom(detail, mwUrl, item.id)}
      <div class="case-bottom-grid">
        ${renderCaseNotes(item, detail)}
        ${renderAttachments(item, detail)}
      </div>
      <footer class="case-folder-footer">
        <span>&#9733; The truth is out there &#9733;</span>
        <span>THEM1947.COM</span>
      </footer>
    </div>
  </article>`;
}

function initCaseFilePrinters(item) {
  const dossier = document.querySelector(".case-dossier");
  if (!dossier) return;
  const profiles = getPrintProfiles(item.detail || {});
  if (!profiles.length) return;

  let profileIndex = 0;
  let printerName = profiles[0].printers?.[0] || "";

  const titleEl = dossier.querySelector(".case-profile-title");
  const settingsEl = dossier.querySelector(".case-settings");

  function currentProfile() {
    return profiles[profileIndex] || profiles[0];
  }

  function renderPills() {
    const profile = currentProfile();
    const printers = profile.printers || [];
    if (!printers.includes(printerName)) printerName = printers[0] || "";
    const existing = dossier.querySelector(".case-profile-pills");
    const markup = renderPrinterPills(printers, printerName, {
      seed: `printers-${item.id}`,
      mwUrl: item.makerWorldUrl,
    });
    if (existing) existing.outerHTML = markup;
  }

  function applySpecs() {
    const profile = currentProfile();
    if (titleEl) titleEl.textContent = profile.title || "";
    if (settingsEl) settingsEl.innerHTML = renderSettingRows(mergePrinterSpecs(profile, printerName));
    dossier.querySelectorAll("[data-printer]").forEach((button) => {
      const active = button.getAttribute("data-printer") === printerName;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    dossier.querySelectorAll("[data-profile-index]").forEach((button) => {
      const active = Number(button.getAttribute("data-profile-index")) === profileIndex;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  dossier.addEventListener("click", (event) => {
    const profileBtn = event.target.closest("[data-profile-index]");
    if (profileBtn) {
      profileIndex = Number(profileBtn.getAttribute("data-profile-index")) || 0;
      renderPills();
      applySpecs();
      return;
    }
    const printerBtn = event.target.closest("[data-printer]");
    if (!printerBtn) return;
    printerName = printerBtn.getAttribute("data-printer") || "";
    applySpecs();
  });
}

function initCaseFileGallery() {
  const hero = document.querySelector(".case-gallery-hero");
  document.querySelectorAll(".case-thumb").forEach((button) => {
    button.addEventListener("click", () => {
      const src = button.getAttribute("data-gallery-src");
      if (!src || !hero) return;
      hero.src = src;
      document.querySelectorAll(".case-thumb").forEach((node) => node.classList.remove("is-active"));
      button.classList.add("is-active");
    });
  });
}

function getFeaturedCoozieConfig() {
  return window.SITE_CONFIG?.featuredCoozie || null;
}

function renderRedactedCoozieGallery(coozie) {
  const images = coozie.gallery?.length ? coozie.gallery : [coozie.poster];
  const main = images[0];
  const thumbs = images.slice(0, 5);
  return `<section class="case-gallery" aria-label="Evidence photos">
    <p class="case-label">${renderRedactionBars("coozie-photo-label", 1, "inline")}</p>
    <div class="case-gallery-main case-gallery-main--redacted">
      <span class="case-paperclip" aria-hidden="true"></span>
      <img class="case-gallery-hero" src="${main}" alt="" width="640" height="480" />
      <span class="case-evidence-stamp case-evidence-stamp-redacted">Redacted</span>
    </div>
    <div class="case-gallery-thumbs">
      ${thumbs
        .map(
          (src, index) =>
            `<button type="button" class="case-thumb${index === 0 ? " is-active" : ""}" data-gallery-src="${src}" aria-label="View image ${index + 1}">
              <img src="${src}" alt="" loading="lazy" />
            </button>`
        )
        .join("")}
    </div>
  </section>`;
}

function renderRedactedEngagement() {
  return `<div class="case-engagement case-engagement--redacted" aria-label="Engagement stats withheld">
    ${renderRedactionBars("coozie-engagement", 2, "block")}
  </div>`;
}

function renderRedactedCoozieDossier(purchaseUrl) {
  return `<section class="case-dossier case-dossier--redacted" aria-label="Print dossier withheld">
    <div class="case-designer">
      <div class="case-designer-avatar case-designer-avatar--redacted" aria-hidden="true"></div>
      <div>
        <p class="case-label">Designer</p>
        ${renderRedactionBars("coozie-designer", 1, "block")}
      </div>
    </div>
    <p class="case-label">Category</p>
    ${renderRedactionBars("coozie-category", 1, "block")}
    <p class="case-label">Print profile</p>
    ${renderRedactionBars("coozie-profile", 2, "block")}
    ${renderRedactionBars("coozie-printers", 1, "block")}
    <dl class="case-settings">
      ${renderSettingRows({})}
    </dl>
    <a class="case-litprintz-btn case-litprintz-btn--purchase" href="${escapeHtml(purchaseUrl)}" target="_blank" rel="noopener">Get free STL on Lit Printz</a>
    <div class="case-action-stats case-action-stats--redacted">
      ${renderRedactionBars("coozie-stats", 1, "block")}
    </div>
  </section>`;
}

function renderRedactedCoozieBom() {
  return `<section class="case-bom case-bom-empty case-bom--redacted">
    <div class="case-section-head">
      <h2>Bill of materials</h2>
      <span class="case-stamp case-stamp-red case-stamp-secret">Redacted</span>
    </div>
    ${renderRedactionBars("coozie-bom", 5, "block")}
  </section>`;
}

function renderRedactedCoozieNotes() {
  return `<section class="case-notes case-notes--redacted">
    <h2>Case notes</h2>
    ${renderRedactionBars("coozie-notes", 8, "block")}
    <p class="case-stamp case-stamp-red case-stamp-care">Handle with care: non-human biological specimen</p>
  </section>`;
}

function renderRedactedCoozieAttachments(purchaseUrl) {
  return `<section class="case-attachments case-attachments--redacted">
    <div class="case-section-head">
      <h2>Evidence &amp; related files</h2>
      <span class="case-stamp case-stamp-red case-stamp-secret">Top secret</span>
    </div>
    <ul class="case-file-list">
      <li>
        <a href="${escapeHtml(purchaseUrl)}" target="_blank" rel="noopener">
          <span class="case-file-name">Lit Printz purchase file</span>
          <span class="case-file-meta">Lit Printz · free STL</span>
        </a>
      </li>
    </ul>
  </section>`;
}

function renderRedactedCoozieCaseFile(coozie) {
  const caseFile = coozie.caseFile || "022-R";
  const title = coozie.title || "THEM 1947 Alien Coozie";
  const purchaseUrl =
    coozie.purchaseUrl || window.SITE_CONFIG?.links?.litPrintzCoozie || "";

  return `<article class="case-file case-file--redacted reveal">
    <p class="print-back case-back"><a href="/files/">&larr; Vault</a></p>
    <div class="case-folder">
      <aside class="case-tab" aria-hidden="true">
        <span>CASE FILE ${escapeHtml(caseFile)}</span>
        <span>${renderRedactionBars("coozie-tab", 1, "inline")}</span>
      </aside>
      <header class="case-header">
        <div class="case-header-brand">
          <img src="/assets/brand/logo.png" alt="THEM 1947" width="72" height="72" />
          <div>
            <p class="case-brand-url">THEM1947.COM</p>
            <p class="case-label">Archive specimen file</p>
          </div>
        </div>
        <div class="case-header-title">
          <p class="case-case-id">CASE FILE ${escapeHtml(caseFile)}</p>
          <h1>${escapeHtml(title)}</h1>
        </div>
        <div class="case-header-stamps">
          <span class="case-stamp case-stamp-red">Status: redacted</span>
          <span class="case-stamp case-stamp-red">Lit Printz only</span>
          <span class="classified-stamp classified-stamp-lg">Classified</span>
        </div>
      </header>
      <div class="case-main-grid">
        <div class="case-main-left">
          ${renderRedactedCoozieGallery(coozie)}
          ${renderRedactedEngagement()}
        </div>
        ${renderRedactedCoozieDossier(purchaseUrl)}
      </div>
      ${renderRedactedCoozieBom()}
      <div class="case-bottom-grid">
        ${renderRedactedCoozieNotes()}
        ${renderRedactedCoozieAttachments(purchaseUrl)}
      </div>
      <footer class="case-folder-footer">
        <span>&#9733; The truth is out there &#9733;</span>
        <span>THEM1947.COM</span>
      </footer>
    </div>
  </article>`;
}

function initRedactedCoozieCaseFilePage() {
  const coozie = getFeaturedCoozieConfig();
  if (!coozie) {
    initPage({
      title: "Case file not found",
      description: "Requested classified case file was not found in the archive.",
      activePath: "/files/",
      content: `<p class="print-back"><a href="/files/">&larr; Vault</a></p><p>Case file not found.</p>`,
    });
    return;
  }

  const title = coozie.title || "THEM 1947 Alien Coozie";
  initPage({
    title: `Case File ${coozie.caseFile || ""} - ${title}`,
    description: `CASE FILE ${coozie.caseFile || ""}: ${title}. Fully redacted Lit Printz companion file.`,
    activePath: coozie.href || "/files/prints/them-1947-alien-coozie/",
    content: renderRedactedCoozieCaseFile(coozie),
  });

  document.querySelectorAll(".page-main .reveal, .case-file").forEach((node) => {
    node.classList.add("is-visible");
  });
  initCaseFileGallery();
}

function initCaseFilePage() {
  const item = getCaseFileItem();
  if (!item) {
    initPage({
      title: "Case file not found",
      description: "Requested classified case file was not found in the archive.",
      activePath: "/files/prints/",
      content: `<p class="print-back"><a href="/files/prints/">&larr; Classified vault</a></p><p>Case file not found.</p>`,
    });
    return;
  }

  const displayName = cleanCaseName(item.name);
  initPage({
    title: `Case File ${item.caseFile || ""} - ${displayName}`,
    description: `CASE FILE ${item.caseFile || ""}: ${displayName}. Classified THEM 1947 specimen dossier with MakerWorld print data.`,
    activePath: `/files/prints/${item.pathSlug}/`,
    content: renderCaseFile(item),
  });

  document.querySelectorAll(".page-main .reveal, .case-file").forEach((node) => {
    node.classList.add("is-visible");
  });
  initCaseFileGallery();
  initCaseFilePrinters(item);
}
