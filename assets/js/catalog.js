function getCatalogItems(vault) {
  const items = window.CATALOG_DATA?.items || [];
  if (!vault) return items.slice();
  return items.filter((item) => item.vault === vault);
}

/** Classified listings unlock for viewing once the owner clearance gate is passed. */
function isVaultUnlocked() {
  const gate = window.SiteGate;
  if (!gate || !gate.isPreviewActive()) return true;
  return gate.isAccessGranted();
}

function itemMakerWorldUrl(item) {
  return item.buyHref || item.makerWorldUrl || "";
}

function formatStat(n) {
  const num = Number(n) || 0;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(num);
}

function classifiedFrame(src, alt, showStamp) {
  const stamp = showStamp ? `<span class="classified-stamp">Classified</span>` : "";
  return `<span class="classified-frame">
    <img src="${src}" alt="${alt || ""}" class="mw-card-image" loading="lazy" width="400" height="300" />
    ${stamp}
  </span>`;
}

function renderMwCard(item) {
  const isClassified = item.vault === "classified";
  const displayName = cleanCaseName(item.name);
  const stats = item.stats || {};
  const mwUrl = itemMakerWorldUrl(item);
  const showMwLink = mwUrl && (!isClassified || isVaultUnlocked());
  const cta = showMwLink
    ? `<a class="mw-card-cta" href="${mwUrl}" target="_blank" rel="noopener">View on MakerWorld</a>`
    : `<span class="mw-card-cta mw-card-cta-disabled" aria-disabled="true">Classified — clearance required</span>`;

  if (isClassified && item.href) {
    return `<article class="mw-card mw-card-link" data-print-id="${item.id}">
      <a class="mw-card-hit" href="${item.href}" aria-label="Open case file: ${displayName}">
        ${classifiedFrame(item.image, "", true)}
      </a>
      <div class="mw-card-body">
        <p class="mw-card-case-id">${item.caseFile ? `Case file ${item.caseFile}` : "Classified file"}</p>
        <h2 class="mw-card-title"><a href="${item.href}">${displayName}</a></h2>
        <div class="mw-card-stats" aria-label="MakerWorld stats">
          <span title="Likes">&#128077; ${formatStat(stats.likes)}</span>
          <span title="Collections">&#128640; ${formatStat(stats.boosts)}</span>
          <span title="Downloads">&#11015; ${formatStat(stats.downloads)}</span>
          <span title="Prints">&#128424; ${formatStat(stats.prints)}</span>
        </div>
        <a class="mw-card-cta" href="${item.href}">Open case file</a>
      </div>
    </article>`;
  }

  return `<article class="mw-card" data-print-id="${item.id}">
    <button type="button" class="mw-card-hit" aria-label="View ${displayName}">
      ${classifiedFrame(item.image, "", isClassified)}
    </button>
    <div class="mw-card-body">
      <h2 class="mw-card-title">${displayName}</h2>
      <div class="mw-card-stats" aria-label="MakerWorld stats">
        <span title="Likes">&#128077; ${formatStat(stats.likes)}</span>
        <span title="Collections">&#128640; ${formatStat(stats.boosts)}</span>
        <span title="Downloads">&#11015; ${formatStat(stats.downloads)}</span>
        <span title="Prints">&#128424; ${formatStat(stats.prints)}</span>
      </div>
      ${cta}
    </div>
  </article>`;
}

function renderCatalogGrid(vault) {
  const items = getCatalogItems(vault);
  return `<div class="mw-grid" role="list">${items.map(renderMwCard).join("")}</div>`;
}

function renderFilesHub() {
  const summary = window.CATALOG_DATA?.summary || {};
  const classified = summary.classified || getCatalogItems("classified").length;
  const declassified = summary.declassified || getCatalogItems("declassified").length;
  const total = summary.total || classified + declassified;
  const sampleDec = getCatalogItems("declassified")[0];

  return `
    <header class="page-header reveal">
      <p class="pillar-eyebrow">THEM 1947 vault</p>
      <h1>Classified files</h1>
      <p>Browse the archive. ${classified} Grey-series case files — each card opens a full dossier with photos, print settings, and materials. ${declassified} everyday prints sit alongside them without the classified stamp. Download files on MakerWorld.</p>
    </header>
    <section class="archive-hero reveal" aria-hidden="true">
      <img src="/assets/brand/ufo-night.png" alt="" class="archive-hero-img" />
      <span class="classified-stamp classified-stamp-lg">Classified</span>
    </section>
    <section class="prints-category-grid reveal">
      <a class="prints-category-card" href="/files/prints/">
        <div class="classified-frame classified-frame-cover">
          <img src="/assets/brand/classified-placeholder.png" alt="" class="prints-category-cover" />
          <span class="classified-stamp">Classified</span>
        </div>
        <div class="prints-category-copy">
          <h2>Classified case files</h2>
          <p>${classified} Grey-series 3D prints — open a card for the full case file.</p>
        </div>
      </a>
      <a class="prints-category-card" href="/files/declassified/">
        <div class="prints-category-cover prints-category-cover-live">
          <img src="${sampleDec?.image || "/assets/brand/logo.png"}" alt="" class="prints-category-cover prints-category-cover-photo" />
        </div>
        <div class="prints-category-copy">
          <h2>Declassified</h2>
          <p>${declassified} public releases — live on MakerWorld today.</p>
        </div>
      </a>
      <a class="prints-category-card" href="/files/all/">
        <div class="prints-category-cover prints-category-cover-all" aria-hidden="true"><span>All</span></div>
        <div class="prints-category-copy">
          <h2>All classified</h2>
          <p>Every Grey-series case file in one place — ${classified} listings.</p>
        </div>
      </a>
    </section>
    <div class="prose reveal">
      <h2>Vault access</h2>
      <p>This vault collects THEM 1947 models from MakerWorld (${total} listings). Classified cards are the Grey-series figures — open one for gallery photos, print settings, materials, and a link to download. Practical prints — remote holders, shop tools, storage cases — live on the <a href="/files/declassified/">Declassified</a> page.</p>
    </div>`;
}

function renderCategoryPage({ vault, title, lede, extra = "" }) {
  const items = getCatalogItems(vault);
  const back = `<p class="print-back"><a href="/files/">&larr; Vault</a></p>`;
  const countLabel = `${items.length} listing${items.length === 1 ? "" : "s"}`;
  return `${back}
    <header class="page-header reveal">
      <p class="pillar-eyebrow">THEM 1947</p>
      <h1>${title}</h1>
      <p>${lede} ${countLabel}.</p>
    </header>
    ${renderCatalogGrid(vault)}
    ${extra}`;
}

function ensurePrintLightbox() {
  let overlay = document.getElementById("print-lightbox");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "print-lightbox";
  overlay.className = "print-lightbox";
  overlay.hidden = true;
  overlay.innerHTML = `<div class="print-lightbox-dialog" role="dialog" aria-modal="true" aria-labelledby="print-lightbox-title">
    <button type="button" class="print-lightbox-close" aria-label="Close">&times;</button>
    <div class="classified-frame classified-frame-lightbox" id="print-lightbox-frame">
      <img class="print-lightbox-image" alt="" />
      <span class="classified-stamp classified-stamp-lg print-lightbox-stamp">Classified</span>
    </div>
    <div class="print-lightbox-actions">
      <h2 class="print-lightbox-title" id="print-lightbox-title"></h2>
      <p class="print-lightbox-blurb"></p>
      <div class="print-lightbox-stats"></div>
      <div class="print-lightbox-buttons"></div>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  return overlay;
}

function closePrintLightbox() {
  const overlay = document.getElementById("print-lightbox");
  if (!overlay) return;
  overlay.hidden = true;
  document.body.classList.remove("print-lightbox-open");
}

function openPrintLightbox(item) {
  const overlay = ensurePrintLightbox();
  const img = overlay.querySelector(".print-lightbox-image");
  const title = overlay.querySelector(".print-lightbox-title");
  const blurb = overlay.querySelector(".print-lightbox-blurb");
  const statsEl = overlay.querySelector(".print-lightbox-stats");
  const buttons = overlay.querySelector(".print-lightbox-buttons");
  const stamp = overlay.querySelector(".print-lightbox-stamp");
  const isClassified = item.vault === "classified";
  const mwUrl = itemMakerWorldUrl(item);
  const showMwLink = mwUrl && (!isClassified || isVaultUnlocked());

  const displayName = cleanCaseName(item.name);
  img.src = item.image;
  img.alt = displayName;
  title.textContent = displayName;
  blurb.textContent = item.blurb || "";
  if (stamp) stamp.hidden = !isClassified;

  const stats = item.stats || {};
  statsEl.innerHTML = `<div class="mw-card-stats">
    <span>&#128077; ${formatStat(stats.likes)}</span>
    <span>&#128640; ${formatStat(stats.boosts)}</span>
    <span>&#11015; ${formatStat(stats.downloads)}</span>
    <span>&#128424; ${formatStat(stats.prints)}</span>
  </div>`;

  buttons.innerHTML = showMwLink
    ? `<a class="btn btn-primary" href="${mwUrl}" target="_blank" rel="noopener">Open on MakerWorld</a>
       <button type="button" class="btn btn-ghost print-lightbox-dismiss">Close</button>`
    : `<span class="btn btn-disabled" aria-disabled="true">Classified — clearance required</span>
       <a class="btn btn-ghost" href="/">Return to landing</a>
       <button type="button" class="btn btn-ghost print-lightbox-dismiss">Close</button>`;

  overlay.hidden = false;
  document.body.classList.add("print-lightbox-open");
  overlay.querySelector(".print-lightbox-close")?.focus();
}

function initPrintLightbox() {
  ensurePrintLightbox();
  const overlay = document.getElementById("print-lightbox");
  const byId = Object.fromEntries((window.CATALOG_DATA.items || []).map((item) => [item.id, item]));

  document.querySelectorAll(".mw-card[data-print-id]").forEach((card) => {
    const hit = card.querySelector(".mw-card-hit");
    if (!hit || hit.tagName === "A") return;
    hit.addEventListener("click", () => {
      const item = byId[card.getAttribute("data-print-id") || ""];
      if (item) openPrintLightbox(item);
    });
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closePrintLightbox();
  });
  overlay.querySelector(".print-lightbox-close")?.addEventListener("click", closePrintLightbox);
  overlay.addEventListener("click", (event) => {
    if (event.target.classList.contains("print-lightbox-dismiss")) closePrintLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closePrintLightbox();
  });
}

function initCatalogPage(opts) {
  initPage(opts);
  document.querySelectorAll(".page-main .reveal, .mw-grid").forEach((node) => {
    node.classList.add("is-visible");
  });
  initPrintLightbox();
}
