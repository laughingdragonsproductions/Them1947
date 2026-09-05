function getCatalogItems(vault) {
  const items = window.CATALOG_DATA?.items || [];
  if (!vault) return items.slice();
  return items.filter((item) => item.vault === vault);
}

/** Classified listings link to case files when the site is public. */
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

function renderFolderStats(stats) {
  return `<div class="case-folder-tile-stats" aria-label="MakerWorld stats">
    <span><strong>${formatStat(stats.boosts)}</strong> Boosts</span>
    <span><strong>${formatStat(stats.likes)}</strong> Likes</span>
    <span><strong>${formatStat(stats.downloads)}</strong> Downloads</span>
    <span><strong>${formatStat(stats.prints)}</strong> Prints</span>
  </div>`;
}

function renderCaseFolderTile(item) {
  const displayName = cleanCaseName(item.name);
  const stats = item.stats || {};
  const caseFile = item.caseFile || "000";
  const tabLabel = `CASE ${caseFile}`;

  return `<article class="case-folder-tile reveal" data-print-id="${item.id}">
    <a class="case-folder-tile-hit" href="${item.href}" aria-label="Open case file: ${displayName}">
      <span class="case-folder-tile-tab">${tabLabel}</span>
      <span class="case-folder-tile-body">
        <span class="case-folder-tile-photo">
          <span class="case-paperclip" aria-hidden="true"></span>
          <img src="${item.image}" alt="" class="case-folder-tile-image" loading="lazy" width="400" height="300" />
          <span class="classified-stamp case-folder-tile-stamp">Classified</span>
        </span>
        <span class="case-folder-tile-meta">
          <span class="case-folder-tile-id">CASE FILE ${caseFile}</span>
          <span class="case-folder-tile-title">${displayName}</span>
          ${renderFolderStats(stats)}
        </span>
      </span>
    </a>
  </article>`;
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
    : `<span class="mw-card-cta mw-card-cta-disabled" aria-disabled="true">Open case file</span>`;

  if (isClassified && item.href) {
    return renderCaseFolderTile(item);
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

function getFeaturedReleaseItem() {
  const featured = window.SITE_CONFIG?.featuredRelease;
  if (!featured) return null;
  const items = window.CATALOG_DATA?.items || [];
  return (
    items.find((item) => item.makerWorldId === featured.makerWorldId) ||
    items.find((item) => item.pathSlug === featured.pathSlug) ||
    null
  );
}

function renderFeaturedReleaseCard({
  href,
  poster,
  posterWidth,
  posterHeight,
  eyebrow,
  caseLabel,
  title,
  tagline,
  primaryLabel = "Open case file",
  secondaryLink = "",
  modifier = "",
}) {
  const modClass = modifier ? ` vault-featured-release--${modifier}` : "";
  return `<section class="vault-featured-release reveal${modClass}" aria-label="${title} featured release">
    <a class="vault-featured-release-link" href="${href}">
      <div class="vault-featured-release-media">
        <img
          class="vault-featured-release-img"
          src="${poster}"
          alt="${title} - ${tagline}"
          width="${posterWidth}"
          height="${posterHeight}"
          loading="eager"
        />
        <span class="vault-featured-release-badge">${eyebrow}</span>
      </div>
    </a>
    <div class="vault-featured-release-copy">
      <p class="vault-featured-release-eyebrow">${caseLabel} · ${eyebrow}</p>
      <h2 class="vault-featured-release-title">${title}</h2>
      <p class="vault-featured-release-tagline">${tagline}</p>
      <div class="vault-featured-release-actions">
        <a class="btn btn-primary" href="${href}">${primaryLabel}</a>
        ${secondaryLink}
      </div>
    </div>
  </section>`;
}

function renderFeaturedRelease() {
  const featured = window.SITE_CONFIG?.featuredRelease;
  const item = getFeaturedReleaseItem();
  if (!featured || !item?.href) return "";

  const displayName = cleanCaseName(item.name);
  const poster = featured.poster || item.image;
  const eyebrow = featured.eyebrow || "New release";
  const tagline = featured.tagline || item.blurb || "";
  const caseLabel = item.caseFile ? `Case file ${item.caseFile}` : "Classified file";
  const mwUrl = itemMakerWorldUrl(item);
  const secondaryLink = mwUrl
    ? `<a class="btn btn-ghost" href="${mwUrl}" target="_blank" rel="noopener">View on MakerWorld</a>`
    : "";

  return renderFeaturedReleaseCard({
    href: item.href,
    poster,
    posterWidth: 1200,
    posterHeight: 675,
    eyebrow,
    caseLabel,
    title: displayName,
    tagline,
    secondaryLink,
    modifier: "arrival",
  });
}

function renderFeaturedCoozieRelease() {
  const coozie = window.SITE_CONFIG?.featuredCoozie;
  if (!coozie?.href) return "";

  const purchaseUrl = coozie.purchaseUrl || window.SITE_CONFIG?.links?.litPrintzCoozie || "";
  const secondaryLink = purchaseUrl
    ? `<a class="btn btn-ghost" href="${purchaseUrl}" target="_blank" rel="noopener">Get on Lit Printz</a>`
    : "";

  return renderFeaturedReleaseCard({
    href: coozie.href,
    poster: coozie.poster,
    posterWidth: 800,
    posterHeight: 800,
    eyebrow: coozie.eyebrow || "Redacted file",
    caseLabel: coozie.caseFile ? `Case file ${coozie.caseFile}` : "Redacted file",
    title: coozie.title || "THEM 1947 Alien Coozie",
    tagline: coozie.tagline || "",
    primaryLabel: "Open redacted file",
    secondaryLink,
    modifier: "coozie",
  });
}

function renderFeaturedReleases() {
  const primary = renderFeaturedRelease();
  if (!primary) return "";
  return `<div class="vault-featured-releases vault-featured-releases--arrival reveal">${primary}</div>`;
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
      <p>Browse the archive. ${classified} Grey-series case files - each folder opens a full dossier with photos, print settings, and materials. ${declassified} everyday prints sit alongside them without the classified stamp. Download files on MakerWorld.</p>
    </header>
    <section class="archive-hero reveal" aria-hidden="true">
      <img src="/assets/brand/ufo-night.png" alt="" class="archive-hero-img" />
      <span class="classified-stamp classified-stamp-lg">Classified</span>
    </section>
    ${renderFeaturedReleases()}
    ${renderCommercialMembershipCta()}
    <section class="prints-category-grid reveal">
      <a class="prints-category-card" href="/files/prints/">
        <div class="classified-frame classified-frame-cover">
          <img src="/assets/brand/classified-placeholder.png" alt="" class="prints-category-cover" />
          <span class="classified-stamp">Classified</span>
        </div>
        <div class="prints-category-copy">
          <h2>Classified case files</h2>
          <p>${classified} Grey-series 3D prints - open a folder for the full case file.</p>
        </div>
      </a>
      <a class="prints-category-card" href="/files/declassified/">
        <div class="prints-category-cover prints-category-cover-live">
          <img src="${sampleDec?.image || "/assets/brand/logo.png"}" alt="" class="prints-category-cover prints-category-cover-photo" />
        </div>
        <div class="prints-category-copy">
          <h2>Declassified</h2>
          <p>${declassified} public releases - live on MakerWorld today.</p>
        </div>
      </a>
      <a class="prints-category-card" href="/files/all/">
        <div class="prints-category-cover prints-category-cover-all" aria-hidden="true"><span>All</span></div>
        <div class="prints-category-copy">
          <h2>All classified</h2>
          <p>Every Grey-series case file in one place - ${classified} listings.</p>
        </div>
      </a>
    </section>
    <div class="prose reveal">
      <h2>Vault access</h2>
      <p>This vault collects THEM 1947 models from MakerWorld (${total} listings). Classified folders are the Grey-series figures - open one for gallery photos, print settings, materials, and a link to download. Practical prints - remote holders, shop tools, storage cases - live on the <a href="/files/declassified/">Declassified</a> page.</p>
    </div>`;
}

function renderCategoryPage({ vault, title, lede, extra = "" }) {
  const items = getCatalogItems(vault);
  const back = `<p class="print-back"><a href="/files/">&larr; Vault</a></p>`;
  const countLabel = `${items.length} listing${items.length === 1 ? "" : "s"}`;
  const featured = vault === "classified" ? renderFeaturedReleases() : "";
  return `${back}
    <header class="page-header reveal">
      <p class="pillar-eyebrow">THEM 1947</p>
      <h1>${title}</h1>
      <p>${lede} ${countLabel}.</p>
    </header>
    ${featured}
    ${renderCommercialMembershipCta()}
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
    : `<a class="btn btn-ghost" href="/">Return to landing</a>
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
  document.querySelectorAll(".page-main .reveal, .mw-grid, .case-folder-tile").forEach((node) => {
    node.classList.add("is-visible");
  });
  initPrintLightbox();
}
