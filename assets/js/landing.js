(function () {
  const folderBtn = document.getElementById("classified-folder");
  const terminalBtn = document.getElementById("terminal-access-btn");
  const commercialBtn = document.getElementById("landing-commercial-btn");
  const witnessBtn = document.getElementById("witness-files-btn");
  const reportsBtn = document.getElementById("reports-btn");
  const archiveBtn = document.getElementById("archive-btn");
  const litprintzSiteBtn = document.getElementById("litprintz-site-btn");
  const litprintzTopCoverBtn = document.getElementById("litprintz-top-cover-btn");
  const litFlightVideo = document.getElementById("litflight-video");
  const poster = document.getElementById("landing-poster");
  const ui = document.getElementById("landing-ui");
  const footer = document.getElementById("landing-footer");

  const commercialUrl =
    window.SITE_CONFIG?.links?.commercialMembership ||
    "https://makerworld.com/en/@user_935464230#commercial-membership-open";
  const witnessFilesUrl =
    window.SITE_CONFIG?.links?.witnessFiles || "/files/declassified/";
  const vaultUrl = "/files/";
  const intelFeedUrl =
    window.SITE_CONFIG?.links?.tagWebsite ||
    window.SITE_CONFIG?.links?.intelFeed ||
    "https://theassociatedguess.com";
  const litPrintzSiteUrl =
    window.SITE_CONFIG?.links?.litPrintzSite || "https://litprintz.com";
  const litFlightRedirectBeforeEndSec =
    window.SITE_CONFIG?.videos?.litFlightRedirectBeforeEndSec ?? 1.5;

  const landingDevMode = window.SITE_CONFIG?.landingDevMode || {};
  const intelFeedLocked = landingDevMode.intelFeedLocked !== false;
  const DEV_MODE_CLICKS = Math.max(1, Number(landingDevMode.logsClicksRequired) || 5);
  const DEV_MODE_BANNER_MS = 3000;
  const INTEL_FEED_GLOW_MS = 1000;
  const INTEL_FEED_GLOW_DELAY_MS = 400;
  const DEV_MODE_SESSION_KEY = "them1947-dev-mode-unlocked";

  const params = new URLSearchParams(window.location.search);
  const isLocalHost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "[::1]";
  const isEditMode =
    params.get("edit") === "hotspots" ||
    (isLocalHost && params.get("edit") !== "off" && params.get("preview") !== "1");

  let litFlightPlaying = false;
  let litFlightRedirected = false;
  let settingsClickCount = 0;

  const isMobile =
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(pointer: coarse)").matches ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    document.documentElement.classList.add("is-mobile");
  }

  function descenderCaseUrl() {
    const slug = window.SITE_CONFIG?.featuredRelease?.pathSlug;
    return slug
      ? "/files/prints/" + slug + "/"
      : "/files/prints/the-descender-them-1947-alien-greys-spaceship/";
  }

  function isDevModeUnlocked() {
    if (!intelFeedLocked) return true;
    return sessionStorage.getItem(DEV_MODE_SESSION_KEY) === "1";
  }

  function promoteIntelFeedToLink(el) {
    if (!el || el.tagName === "A") return el;

    const link = document.createElement("a");
    link.id = el.id;
    link.className = el.className.replace(/\bis-locked\b|\bis-hover-lit\b/g, "").trim();
    if (!link.classList.contains("is-ready")) {
      link.classList.add("is-ready");
    }
    link.href = intelFeedUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.setAttribute("aria-label", "Intel feed - The Associated Guess");
    el.replaceWith(link);
    return link;
  }

  function enableIntelFeed({ withGlow = false } = {}) {
    const intelFeedBtn = document.getElementById("intel-feed-btn");
    if (!intelFeedBtn) return;

    document.body.classList.add("dev-mode-unlocked");

    if (withGlow) {
      intelFeedBtn.classList.add("is-hover-lit");
      window.setTimeout(function () {
        const current = document.getElementById("intel-feed-btn");
        if (!current) return;
        current.classList.remove("is-hover-lit", "is-locked");
        promoteIntelFeedToLink(current);
      }, INTEL_FEED_GLOW_MS);
      return;
    }

    intelFeedBtn.classList.remove("is-hover-lit", "is-locked");
    if (intelFeedBtn.tagName === "A") {
      intelFeedBtn.href = intelFeedUrl;
      intelFeedBtn.classList.add("is-ready");
      return;
    }
    promoteIntelFeedToLink(intelFeedBtn);
  }

  function wireExternalLinks() {
    if (commercialBtn) {
      commercialBtn.href = commercialUrl;
    }
    if (witnessBtn) {
      witnessBtn.href = witnessFilesUrl;
    }
    if (archiveBtn) {
      archiveBtn.href = vaultUrl;
    }
    if (reportsBtn) {
      reportsBtn.href = "/files/prints/";
    }
    const observationBtn = document.getElementById("observation-btn");
    if (observationBtn) {
      observationBtn.href = descenderCaseUrl();
    }
    const dashboardBtn = document.getElementById("dashboard-btn");
    if (dashboardBtn) {
      dashboardBtn.href = vaultUrl;
    }
    const commercialLink = document.getElementById("landing-commercial-link");
    if (commercialLink) {
      commercialLink.href = commercialUrl;
      commercialLink.classList.add("commercial-membership-link");
    }
  }

  function openClassifiedFiles() {
    window.location.href = "/files/prints/";
  }

  function openVault() {
    window.location.href = vaultUrl;
  }

  function redirectToLitPrintz() {
    if (litFlightRedirected) return;
    litFlightRedirected = true;
    window.location.href = litPrintzSiteUrl;
  }

  function showVideoElement(video) {
    if (!video) return;
    video.classList.remove("is-dormant", "is-hidden");
    video.classList.add("is-active");
  }

  function hideVideoElement(video) {
    if (!video) return;
    video.classList.remove("is-active");
    video.classList.add("is-dormant");
    video.pause();
  }

  function playVideoElement(video) {
    video.muted = false;
    return video.play().catch(function () {
      video.muted = true;
      return video.play();
    });
  }

  function hideDashboardForTransition() {
    document.body.classList.add("is-litflight-transition");
    if (poster) poster.classList.remove("is-visible");
    if (ui) ui.classList.remove("is-visible", "is-unlocked");
    if (footer) footer.classList.remove("is-visible");
  }

  function onLitFlightTimeUpdate() {
    if (!litFlightPlaying || litFlightRedirected || !litFlightVideo) return;

    if (litFlightVideo.ended) {
      redirectToLitPrintz();
      return;
    }

    const duration = litFlightVideo.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;

    if (litFlightVideo.currentTime >= duration - litFlightRedirectBeforeEndSec) {
      redirectToLitPrintz();
    }
  }

  function playLitFlightTransition() {
    if (litFlightPlaying || litFlightRedirected) return;

    if (!litFlightVideo) {
      redirectToLitPrintz();
      return;
    }

    litFlightPlaying = true;
    hideDashboardForTransition();
    showVideoElement(litFlightVideo);
    litFlightVideo.currentTime = 0;

    playVideoElement(litFlightVideo).catch(function () {
      litFlightPlaying = false;
      redirectToLitPrintz();
    });
  }

  function showDeveloperModeBanner() {
    const banner = document.getElementById("developer-mode-banner");
    if (!banner) return;

    banner.classList.add("is-active");
    banner.setAttribute("aria-hidden", "false");

    window.setTimeout(function () {
      banner.classList.remove("is-active");
      banner.setAttribute("aria-hidden", "true");
    }, DEV_MODE_BANNER_MS);
  }

  function unlockDevMode() {
    if (isDevModeUnlocked()) return;
    sessionStorage.setItem(DEV_MODE_SESSION_KEY, "1");
    showDeveloperModeBanner();
    window.setTimeout(function () {
      enableIntelFeed({ withGlow: true });
    }, INTEL_FEED_GLOW_DELAY_MS);
  }

  function onLogsClick(event) {
    event.preventDefault();

    if (isDevModeUnlocked()) {
      showDeveloperModeBanner();
      return;
    }

    settingsClickCount += 1;
    if (settingsClickCount < DEV_MODE_CLICKS) {
      return;
    }

    unlockDevMode();
  }

  function wireLogsUnlock() {
    const logsBtn = document.getElementById("logs");
    if (!logsBtn) return;
    logsBtn.addEventListener("click", onLogsClick);
  }

  function wireIntelFeed() {
    const intelFeedBtn = document.getElementById("intel-feed-btn");
    if (!intelFeedBtn) return;

    if (isDevModeUnlocked()) {
      enableIntelFeed();
      return;
    }

    intelFeedBtn.addEventListener("click", function (event) {
      event.preventDefault();
    });
  }

  function wirePlaceholderButtons() {
    ["recovery-btn", "analysis-btn", "view-all-logs-btn"].forEach(function (id) {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener("click", function (event) {
        event.preventDefault();
      });
    });
  }

  function wireClickHandlers() {
    if (folderBtn) {
      folderBtn.addEventListener("click", openClassifiedFiles);
    }

    if (reportsBtn) {
      reportsBtn.addEventListener("click", function (event) {
        event.preventDefault();
        openClassifiedFiles();
      });
    }

    if (terminalBtn) {
      terminalBtn.addEventListener("click", openVault);
    }

    if (litprintzTopCoverBtn) {
      litprintzTopCoverBtn.addEventListener("click", function (event) {
        event.preventDefault();
      });
    }

    if (litprintzSiteBtn) {
      litprintzSiteBtn.addEventListener("click", function (event) {
        event.preventDefault();
        playLitFlightTransition();
      });
    }
  }

  function initLitFlightVideo() {
    if (!litFlightVideo) return;

    litFlightVideo.addEventListener("timeupdate", onLitFlightTimeUpdate);
    litFlightVideo.addEventListener("ended", redirectToLitPrintz);
    litFlightVideo.addEventListener("error", function () {
      if (litFlightRedirected) return;
      litFlightPlaying = false;
      hideVideoElement(litFlightVideo);
      redirectToLitPrintz();
    });
  }

  function initLanding() {
    wireExternalLinks();
    initLitFlightVideo();

    if (footer) {
      footer.classList.add("is-visible");
    }

    if (!isEditMode) {
      wireClickHandlers();
      wireLogsUnlock();
      wireIntelFeed();
      wirePlaceholderButtons();
      if (!intelFeedLocked) {
        sessionStorage.setItem(DEV_MODE_SESSION_KEY, "1");
        enableIntelFeed();
      }
    }
  }

  HotspotMapper.loadLayout("/assets/js/hotspot-layouts/landing.json")
    .then(function (layout) {
      HotspotMapper.init({
        pageId: "landing",
        stageSelector: ".landing-stage",
        rootSelector: "#landing-ui",
        hotspotSelector: ".landing-hotspot",
        hotspotClassPrefix: "landing-hotspot",
        hotspotBaseClass: "hotspot landing-hotspot",
        hotspotTag: "button",
        layout: layout,
        classMap: layout.classMap,
      });
      initLanding();
    })
    .catch(function (error) {
      console.error(error);
      initLanding();
    });
})();
