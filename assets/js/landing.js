(function () {
  const introVideo = document.getElementById("intro-video");
  const briefVideo = document.getElementById("brief-video");
  const litprintzVideo = document.getElementById("litprintz-video");
  const poster = document.getElementById("landing-poster");
  const scrim = document.getElementById("landing-scrim");
  const logo = document.getElementById("landing-logo");
  const ui = document.getElementById("landing-ui");
  const footer = document.getElementById("landing-footer");
  const folderBtn = document.getElementById("classified-folder");
  const terminalBtn = document.getElementById("terminal-access-btn");
  const commercialBtn = document.getElementById("landing-commercial-btn");
  const litprintzSiteBtn = document.getElementById("litprintz-site-btn");
  const commercialUrl =
    window.SITE_CONFIG?.links?.commercialMembership ||
    "https://makerworld.com/en/@user_935464230#commercial-membership-open";
  const litPrintzSiteUrl =
    window.SITE_CONFIG?.links?.litPrintzSite || "https://litprintz.com";
  const startOverlay = document.getElementById("start-overlay");
  const startBtn = document.getElementById("start-btn");
  const litprintzCta = document.getElementById("litprintz-cta");

  const isMobile =
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(pointer: coarse)").matches ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  let experienceStarted = false;
  let experiencePath = null;
  let transmissionsComplete = false;
  let introPlaying = false;
  let briefPlaying = false;
  let litprintzPlaying = false;

  const SKIP_INPUT_COUNT = 5;
  const SKIP_INPUT_WINDOW_MS = 2500;
  let skipInputCount = 0;
  let skipInputTimer = null;

  if (isMobile) {
    document.documentElement.classList.add("is-mobile");
  }

  function resetSkipInputCount() {
    skipInputCount = 0;
    if (skipInputTimer) {
      window.clearTimeout(skipInputTimer);
      skipInputTimer = null;
    }
  }

  function hideLitprintzSiteBtn() {
    if (!litprintzSiteBtn) return;
    litprintzSiteBtn.hidden = true;
    litprintzSiteBtn.setAttribute("aria-hidden", "true");
  }

  function showLitprintzSiteBtn() {
    if (!litprintzSiteBtn) return;
    litprintzSiteBtn.href = litPrintzSiteUrl;
    litprintzSiteBtn.hidden = false;
    litprintzSiteBtn.removeAttribute("aria-hidden");
  }

  function skipToTerminalUi() {
    if (transmissionsComplete) return;
    if (!experienceStarted) {
      experienceStarted = true;
      hideStartOverlay();
    }
    introPlaying = false;
    briefPlaying = false;
    litprintzPlaying = false;
    showPostVideoUi();
    resetSkipInputCount();
  }

  function registerSkipInput() {
    if (transmissionsComplete) return false;

    skipInputCount += 1;
    if (skipInputTimer) {
      window.clearTimeout(skipInputTimer);
    }
    skipInputTimer = window.setTimeout(resetSkipInputCount, SKIP_INPUT_WINDOW_MS);

    if (skipInputCount >= SKIP_INPUT_COUNT) {
      skipToTerminalUi();
      return true;
    }
    return false;
  }

  function handleEnterSkip(event) {
    if (event.key !== "Enter") return;
    if (registerSkipInput()) {
      event.preventDefault();
    }
  }

  function isInteractiveSkipTarget(target) {
    if (!target || !target.closest) return false;
    return !!target.closest(
      "a, button, .classified-folder, .landing-footer, .commercial-membership-landing-btn, .litprintz-cta, .litprintz-site-btn"
    );
  }

  function handlePointerSkip(event) {
    if (transmissionsComplete) return;
    if (isInteractiveSkipTarget(event.target)) return;
    if (registerSkipInput()) {
      event.preventDefault();
    }
  }

  function enableArchiveControls() {
    if (folderBtn) {
      folderBtn.disabled = false;
      folderBtn.removeAttribute("aria-disabled");
    }
    if (terminalBtn) {
      terminalBtn.hidden = false;
      terminalBtn.removeAttribute("aria-hidden");
      terminalBtn.disabled = false;
    }
    if (commercialBtn) {
      commercialBtn.href = commercialUrl;
      commercialBtn.hidden = false;
      commercialBtn.removeAttribute("aria-hidden");
    }
    if (experiencePath === "litprintz") {
      showLitprintzSiteBtn();
    } else {
      hideLitprintzSiteBtn();
    }
    if (ui) ui.classList.add("is-unlocked");
  }

  function disableArchiveControls() {
    if (folderBtn) {
      folderBtn.disabled = true;
      folderBtn.setAttribute("aria-disabled", "true");
    }
    if (terminalBtn) {
      terminalBtn.hidden = true;
      terminalBtn.setAttribute("aria-hidden", "true");
      terminalBtn.disabled = true;
    }
    if (commercialBtn) {
      commercialBtn.hidden = true;
      commercialBtn.setAttribute("aria-hidden", "true");
    }
    hideLitprintzSiteBtn();
    if (ui) ui.classList.remove("is-unlocked");
  }

  function hideStartOverlay() {
    if (!startOverlay) return;
    startOverlay.classList.add("is-hidden");
    startOverlay.setAttribute("aria-hidden", "true");
  }

  function restoreStartOverlay() {
    if (!startOverlay) return;
    startOverlay.classList.remove("is-hidden");
    startOverlay.setAttribute("aria-hidden", "false");
  }

  function hideVideoElement(video) {
    if (!video) return;
    video.pause();
    video.classList.remove("is-active");
    video.classList.add("is-dormant", "is-hidden");
  }

  function showVideoElement(video) {
    if (!video) return;
    video.classList.remove("is-dormant", "is-hidden");
    video.classList.add("is-active");
    video.currentTime = 0;
    video.muted = false;
    video.volume = 1;
    video.playsInline = true;
  }

  function playVideoElement(video) {
    return video.play().catch(function () {
      video.muted = true;
      return video.play();
    });
  }

  function hideIntroVideo() {
    introPlaying = false;
    hideVideoElement(introVideo);
  }

  function hideBriefVideo() {
    briefPlaying = false;
    hideVideoElement(briefVideo);
  }

  function hideLitprintzVideo() {
    litprintzPlaying = false;
    hideVideoElement(litprintzVideo);
  }

  function hideAllVideos() {
    hideIntroVideo();
    hideBriefVideo();
    hideLitprintzVideo();
  }

  function showPosterBackground() {
    if (poster) poster.classList.add("is-visible");
    if (scrim) scrim.classList.remove("is-terminal");
  }

  function showPostVideoUi() {
    if (transmissionsComplete) return;
    transmissionsComplete = true;
    hideAllVideos();
    showPosterBackground();

    logo.classList.add("is-visible");
    ui.classList.add("is-visible");
    footer.classList.add("is-visible");
    enableArchiveControls();
  }

  function onIntroEnded() {
    if (transmissionsComplete || briefPlaying) return;
    hideIntroVideo();
    playBriefVideo();
  }

  function onBriefEnded() {
    if (transmissionsComplete) return;
    showPostVideoUi();
  }

  function onLitprintzEnded() {
    if (transmissionsComplete) return;
    showPostVideoUi();
  }

  function checkIntroComplete() {
    if (transmissionsComplete || !introPlaying || briefPlaying) return;

    if (introVideo.ended) {
      onIntroEnded();
      return;
    }

    const duration = introVideo.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;

    if (introVideo.currentTime >= duration - 0.15) {
      onIntroEnded();
    }
  }

  function checkBriefComplete() {
    if (transmissionsComplete || !briefPlaying) return;

    if (briefVideo.ended) {
      onBriefEnded();
      return;
    }

    const duration = briefVideo.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;

    if (briefVideo.currentTime >= duration - 0.15) {
      onBriefEnded();
    }
  }

  function checkLitprintzComplete() {
    if (transmissionsComplete || !litprintzPlaying) return;

    if (litprintzVideo.ended) {
      onLitprintzEnded();
      return;
    }

    const duration = litprintzVideo.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;

    if (litprintzVideo.currentTime >= duration - 0.15) {
      onLitprintzEnded();
    }
  }

  function playBriefVideo() {
    if (!briefVideo) {
      showPostVideoUi();
      return;
    }

    briefPlaying = true;
    showVideoElement(briefVideo);

    playVideoElement(briefVideo).catch(function () {
      briefPlaying = false;
      showPostVideoUi();
    });
  }

  function playIntroWithAudio() {
    transmissionsComplete = false;
    introPlaying = true;
    briefPlaying = false;
    litprintzPlaying = false;

    disableArchiveControls();
    poster.classList.remove("is-visible");
    logo.classList.remove("is-visible");
    ui.classList.remove("is-visible", "is-unlocked");
    footer.classList.remove("is-visible");

    hideBriefVideo();
    hideLitprintzVideo();
    showVideoElement(introVideo);

    return playVideoElement(introVideo);
  }

  function playLitprintzVideo() {
    transmissionsComplete = false;
    litprintzPlaying = true;
    introPlaying = false;
    briefPlaying = false;

    disableArchiveControls();
    poster.classList.remove("is-visible");
    logo.classList.remove("is-visible");
    ui.classList.remove("is-visible", "is-unlocked");
    footer.classList.remove("is-visible");

    hideIntroVideo();
    hideBriefVideo();

    if (!litprintzVideo) {
      showPostVideoUi();
      return Promise.resolve();
    }

    showVideoElement(litprintzVideo);
    return playVideoElement(litprintzVideo);
  }

  function resetExperienceState() {
    experienceStarted = false;
    experiencePath = null;
    introPlaying = false;
    briefPlaying = false;
    litprintzPlaying = false;
  }

  function startExperience() {
    if (experienceStarted) return;
    experienceStarted = true;
    experiencePath = "transmissions";
    hideStartOverlay();
    playIntroWithAudio().catch(function () {
      restoreStartOverlay();
      resetExperienceState();
    });
  }

  function startLitprintzExperience() {
    if (experienceStarted) return;
    experienceStarted = true;
    experiencePath = "litprintz";
    hideStartOverlay();
    playLitprintzVideo().catch(function () {
      restoreStartOverlay();
      resetExperienceState();
    });
  }

  function openArchive() {
    window.location.href = "/files/";
  }

  if (startBtn) {
    startBtn.addEventListener("click", startExperience);
  }

  if (litprintzCta) {
    litprintzCta.addEventListener("click", startLitprintzExperience);
  }

  if (introVideo) {
    introVideo.addEventListener("ended", onIntroEnded);
    introVideo.addEventListener("timeupdate", checkIntroComplete);
  }

  if (briefVideo) {
    briefVideo.addEventListener("ended", onBriefEnded);
    briefVideo.addEventListener("timeupdate", checkBriefComplete);
    briefVideo.addEventListener("error", function () {
      if (transmissionsComplete) return;
      briefPlaying = false;
      showPostVideoUi();
    });
  }

  if (litprintzVideo) {
    litprintzVideo.addEventListener("ended", onLitprintzEnded);
    litprintzVideo.addEventListener("timeupdate", checkLitprintzComplete);
    litprintzVideo.addEventListener("error", function () {
      if (transmissionsComplete) return;
      litprintzPlaying = false;
      showPostVideoUi();
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      checkIntroComplete();
      checkBriefComplete();
      checkLitprintzComplete();
    }
  });

  document.addEventListener("keydown", handleEnterSkip);
  document.addEventListener("pointerdown", handlePointerSkip);

  if (folderBtn) {
    folderBtn.addEventListener("click", openArchive);
  }

  if (terminalBtn) {
    terminalBtn.addEventListener("click", openArchive);
  }

  const commercialLink = document.getElementById("landing-commercial-link");
  if (commercialLink) {
    commercialLink.href = commercialUrl;
    commercialLink.classList.add("commercial-membership-link");
  }
})();
