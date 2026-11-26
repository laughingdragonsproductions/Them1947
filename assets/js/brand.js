/** Resolve site logo (temporary promo + favicon). */
(function () {
  function getBrandConfig() {
    return (window.SITE_CONFIG && window.SITE_CONFIG.brand) || {};
  }

  function getBrandLogoUrl() {
    const brand = getBrandConfig();
    const fallback = brand.defaultLogo || "/assets/brand/logo.png";
    const temp = brand.temporaryLogo;
    const until = brand.temporaryUntil;
    if (!temp || !until) return fallback;
    const endsAt = Date.parse(until);
    if (!Number.isFinite(endsAt) || Date.now() >= endsAt) return fallback;
    return temp;
  }

  function isTemporaryBrandActive() {
    const brand = getBrandConfig();
    if (!brand.temporaryLogo || !brand.temporaryUntil) return false;
    const endsAt = Date.parse(brand.temporaryUntil);
    return Number.isFinite(endsAt) && Date.now() < endsAt;
  }

  function applyBrandFavicon() {
    const url = getBrandLogoUrl();
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      document.head.appendChild(link);
    }
    if (link.getAttribute("href") !== url) {
      link.setAttribute("href", url);
    }
    document.documentElement.classList.toggle("brand-logo-promo", isTemporaryBrandActive());
  }

  window.getBrandLogoUrl = getBrandLogoUrl;
  window.isTemporaryBrandActive = isTemporaryBrandActive;
  window.applyBrandFavicon = applyBrandFavicon;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyBrandFavicon);
  } else {
    applyBrandFavicon();
  }
})();