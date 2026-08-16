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

function formatBytes(bytes) {
  const num = Number(bytes) || 0;
  if (!num) return "—";
  if (num >= 1048576) return `${(num / 1048576).toFixed(1)} MB`;
  if (num >= 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${num} B`;
}

function formatDate(iso) {
  if (!iso) return "REDACTED";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function redacted(value, fallback = "REDACTED") {
  return value ? escapeHtml(value) : `<span class="case-redacted">${fallback}</span>`;
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
      <img class="case-gallery-hero" src="${main}" alt="${escapeHtml(item.name)}" width="640" height="480" />
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
    <span class="case-engagement-date">Released ${formatDate(detail.publishedAt)}</span>
  </div>`;
}

function renderPrintProfile(item, detail) {
  const profile = detail.printProfile || {};
  const printers = profile.printers || [];
  const pills = printers.length
    ? `<div class="case-profile-pills">${printers
        .slice(0, 8)
        .map((name, index) => `<span class="case-pill${index === 0 ? " is-active" : ""}">${escapeHtml(name)}</span>`)
        .join("")}</div>`
    : `<p class="case-redacted-block">Print profiles: REDACTED — view on MakerWorld</p>`;

  const rows = [
    ["Build plate", profile.buildPlates != null ? `${profile.buildPlates} plate${profile.buildPlates === 1 ? "" : "s"}` : null],
    ["Layer height", profile.layerHeight ? `${profile.layerHeight} mm` : null],
    ["Walls", profile.walls || null],
    ["Infill", profile.infill || null],
    ["Supports", profile.supports || null],
    ["Print time (est.)", profile.printTime || null],
    ["Difficulty", profile.difficulty || null],
  ];

  const settings = profile.title
    ? `<p class="case-profile-title">${escapeHtml(profile.title)}</p>`
    : `<p class="case-redacted-block">Profile title: REDACTED</p>`;

  return `<section class="case-dossier" aria-label="Print dossier">
    <div class="case-designer">
      ${detail.designerAvatar ? `<img src="${detail.designerAvatar}" alt="" class="case-designer-avatar" width="40" height="40" />` : ""}
      <div>
        <p class="case-label">Designer</p>
        <p class="case-designer-name">${redacted(detail.designer)}</p>
      </div>
    </div>
    <p class="case-label">Category</p>
    <p class="case-category">${redacted(detail.category)}</p>
    <p class="case-label">Print profile</p>
    ${settings}
    ${pills}
    <dl class="case-settings">
      ${rows
        .map(
          ([label, value]) => `<div class="case-setting-row">
            <dt>${label}</dt>
            <dd>${redacted(value)}</dd>
          </div>`
        )
        .join("")}
    </dl>
    <a class="case-mw-btn" href="${item.makerWorldUrl}" target="_blank" rel="noopener">View on MakerWorld</a>
    <div class="case-action-stats">
      <span title="Boosts">&#128640; ${formatStat(item.stats?.boosts)}</span>
      <span title="Likes">&#128077; ${formatStat(item.stats?.likes)}</span>
      <span title="Downloads">&#11015; ${formatStat(item.stats?.downloads)}</span>
      <span title="Shares">&#128257; ${formatStat(detail.shareCount)}</span>
    </div>
  </section>`;
}

function renderBom(detail, mwUrl) {
  const bom = detail.bom || [];
  if (!bom.length) {
    return `<section class="case-bom case-bom-empty">
      <div class="case-section-head">
        <h2>Bill of materials</h2>
        <span class="case-stamp case-stamp-green">Authorized personnel only</span>
      </div>
      <p class="case-redacted-block">Material manifest REDACTED — <a href="${mwUrl}" target="_blank" rel="noopener">View materials on MakerWorld</a></p>
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
          const price = entry.priceFrom ? `From ${escapeHtml(entry.priceFrom)}` : "REDACTED";
          const color = entry.colorOptions?.[0] || "Standard";
          return `<article class="case-bom-card">
            <img src="${entry.image || "/assets/brand/classified-placeholder.png"}" alt="" class="case-bom-swatch" loading="lazy" />
            <div class="case-bom-copy">
              <h3>${escapeHtml(entry.name)}</h3>
              <p>x${entry.quantity || 1} · ${escapeHtml(color)}</p>
              <p class="case-bom-price">${price}</p>
            </div>
          </article>`;
        })
        .join("")}
    </div>
  </section>`;
}

function renderCaseNotes(item, detail) {
  const features = detail.features?.length
    ? `<ul class="case-features">${detail.features.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
    : `<p class="case-redacted-block">Feature list REDACTED</p>`;

  return `<section class="case-notes">
    <h2>Case notes</h2>
    <p>${escapeHtml(detail.summaryText || item.blurb || "")}</p>
    ${features}
    <p class="case-stamp case-stamp-red case-stamp-care">Handle with care: non-human biological specimen</p>
  </section>`;
}

function renderAttachments(item, detail) {
  const files = detail.attachments?.length
    ? detail.attachments
    : [{ name: "Live listing dossier", label: "MakerWorld", sizeBytes: 0, url: item.makerWorldUrl }];

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
  const specimen = item.specimenLabel || detail.specimenLabel || item.name.toUpperCase();
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
          <h1>${escapeHtml(item.name)}</h1>
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
      ${renderBom(detail, mwUrl)}
      <div class="case-bottom-grid">
        ${renderCaseNotes(item, detail)}
        ${renderAttachments(item, detail)}
      </div>
      <footer class="case-folder-footer">
        <span>&#9733; Truth is out there &#9733;</span>
        <span>THEM1947.COM</span>
      </footer>
    </div>
  </article>`;
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

  initPage({
    title: `Case File ${item.caseFile || ""} — ${item.name}`,
    description: `CASE FILE ${item.caseFile || ""}: ${item.name}. Classified THEM 1947 specimen dossier with MakerWorld print data.`,
    activePath: `/files/prints/${item.pathSlug}/`,
    content: renderCaseFile(item),
  });

  document.querySelectorAll(".page-main .reveal, .case-file").forEach((node) => {
    node.classList.add("is-visible");
  });
  initCaseFileGallery();
}
