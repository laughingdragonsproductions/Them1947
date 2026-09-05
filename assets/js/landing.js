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
    window.SITE_CONFIG?.links?.intelFeed || "https://theassociatedguess.com";
  const litPrintzSiteUrl =
    window.SITE_CONFIG?.links?.litPrintzSite || "https://litprintz.com";
  const litFlightRedirectBeforeEndSec =
    window.SITE_CONFIG?.videos?.litFlightRedirectBeforeEndSec ?? 1.5;

  const DEV_MODE_CLICKS = 15;
  const DEV_MODE_BANNER_MS = 3000;
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
    const intelFeedBtn = document.getElementById("intel-feed-btn");
    if (intelFeedBtn) {
      intelFeedBtn.href = intelFeedUrl;
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

  function onSettingsClick(event) {
    event.preventDefault();

    if (sessionStorage.getItem(DEV_MODE_SESSION_KEY)) {
      return;
    }

    settingsClickCount += 1;
    if (settingsClickCount < DEV_MODE_CLICKS) {
      return;
    }

    sessionStorage.setItem(DEV_MODE_SESSION_KEY, "1");
    showDeveloperModeBanner();
  }

  function wirePlaceholderButtons() {
    ["recovery-btn", "analysis-btn"].forEach(function (id) {
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

    const settingsBtn = document.getElementById("settings-btn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", onSettingsClick);
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
      wirePlaceholderButtons();
    }
  }

  HotspotMapper.loadLayout("/assets/js/hotspot-layouts/landing.json")
    .then(function (layout) {
      HotspotMapper.init({
        pageId: "landing",
        stageSelector: ".landing-stage",
        rootSelector: "#landing-ui",
        hotspotSelector: ".landing-hotspot",
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
