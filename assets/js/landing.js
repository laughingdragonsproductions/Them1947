(function () {
  const introVideo = document.getElementById("intro-video");
  const briefVideo = document.getElementById("brief-video");
  const poster = document.getElementById("landing-poster");
  const dossierStage = document.getElementById("dossier-stage");
  const scrim = document.getElementById("landing-scrim");
  const logo = document.getElementById("landing-logo");
  const ui = document.getElementById("landing-ui");
  const footer = document.getElementById("landing-footer");
  const folderBtn = document.getElementById("classified-folder");
  const startOverlay = document.getElementById("start-overlay");
  const startBtn = document.getElementById("start-btn");
  const bypassBtn = document.getElementById("bypass-btn");
  const bypassBar = document.getElementById("bypass-bar");
  const bypassForm = document.getElementById("bypass-form");
  const bypassInput = document.getElementById("bypass-input");
  const bypassSubmit = document.getElementById("bypass-submit");
  const bypassStatus = document.getElementById("bypass-status");

  const gate = window.SiteGate;
  const previewActive = gate && gate.isPreviewActive();

  if (previewActive && gate && gate.enforceLockoutOrGate()) {
    return;
  }

  const isMobile =
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(pointer: coarse)").matches ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  let experienceStarted = false;
  let transmissionsComplete = false;
  let introPlaying = false;
  let briefPlaying = false;
  let siteAccessGranted = gate ? gate.isAccessGranted() : true;
  let bypassBarOpen = false;
  let lockoutActive = gate ? gate.isLockoutActive() : false;

  const SKIP_ENTER_COUNT = 5;
  const SKIP_ENTER_WINDOW_MS = 2500;
  let enterSkipCount = 0;
  let enterSkipTimer = null;

  function resetEnterSkipCount() {
    enterSkipCount = 0;
    if (enterSkipTimer) {
      window.clearTimeout(enterSkipTimer);
      enterSkipTimer = null;
    }
  }

  function skipToTerminalUi() {
    if (transmissionsComplete) return;
    if (!experienceStarted) {
      experienceStarted = true;
      hideStartOverlay();
    }
    introPlaying = false;
    briefPlaying = false;
    showPostVideoUi();
    resetEnterSkipCount();
  }

  function handleEnterSkip(event) {
    if (event.key !== "Enter") return;
    if (transmissionsComplete) return;
    if (bypassInput && document.activeElement === bypassInput) return;

    enterSkipCount += 1;
    if (enterSkipTimer) {
      window.clearTimeout(enterSkipTimer);
    }
    enterSkipTimer = window.setTimeout(resetEnterSkipCount, SKIP_ENTER_WINDOW_MS);

    if (enterSkipCount >= SKIP_ENTER_COUNT) {
      event.preventDefault();
      skipToTerminalUi();
    }
  }

  if (isMobile) {
    document.documentElement.classList.add("is-mobile");
  }

  function enableFolder() {
    if (!folderBtn) return;
    folderBtn.disabled = false;
    folderBtn.removeAttribute("aria-disabled");
    ui.classList.add("is-unlocked");
  }

  function disableFolder() {
    if (!folderBtn) return;
    folderBtn.disabled = true;
    folderBtn.setAttribute("aria-disabled", "true");
    ui.classList.remove("is-unlocked");
  }

  if (siteAccessGranted) {
    enableFolder();
  } else {
    disableFolder();
  }

  function setBypassStatus(message, tone) {
    if (!bypassStatus) return;
    bypassStatus.textContent = message;
    bypassStatus.classList.remove("is-denied", "is-granted", "is-lockout");
    if (tone) {
      bypassStatus.classList.add("is-" + tone);
    }
  }

  function hideBypassButton() {
    if (!bypassBtn) return;
    bypassBtn.hidden = true;
    bypassBtn.setAttribute("aria-hidden", "true");
    bypassBtn.disabled = true;
  }

  function hideBypassControls() {
    bypassBarOpen = false;
    hideBypassButton();
    if (bypassBar) {
      bypassBar.hidden = true;
      bypassBar.setAttribute("aria-hidden", "true");
      bypassBar.classList.remove("is-open");
    }
    if (bypassInput) {
      bypassInput.value = "";
      bypassInput.disabled = true;
    }
    if (bypassSubmit) {
      bypassSubmit.disabled = true;
    }
    setBypassStatus("", null);
  }

  function openBypassBar() {
    if (!previewActive || lockoutActive || siteAccessGranted) return;
    bypassBarOpen = true;
    hideBypassButton();
    if (bypassBar) {
      bypassBar.hidden = false;
      bypassBar.removeAttribute("aria-hidden");
      bypassBar.classList.add("is-open");
    }
    if (bypassInput) {
      bypassInput.disabled = false;
      bypassInput.focus();
    }
    if (bypassSubmit) {
      bypassSubmit.disabled = false;
    }
    setBypassStatus("", null);
  }

  function activateLockout() {
    if (gate) gate.redirectToLockout();
  }

  function showDeniedStatus(message) {
    setBypassStatus(message, "denied");
    if (bypassInput) {
      bypassInput.value = "";
      bypassInput.focus();
    }
    if (bypassBar) {
      bypassBar.classList.add("is-shake");
      window.setTimeout(function () {
        if (bypassBar) bypassBar.classList.remove("is-shake");
      }, 480);
    }
  }

  async function handleBypassSubmit(event) {
    event.preventDefault();
    if (!previewActive || lockoutActive || siteAccessGranted || !gate) return;

    const attempt = bypassInput ? bypassInput.value.trim() : "";
    if (!attempt) {
      showDeniedStatus("Enter clearance code");
      return;
    }

    if (bypassSubmit) bypassSubmit.disabled = true;

    try {
      const result = await gate.checkPassword(attempt);
      lockoutActive = gate.isLockoutActive();

      if (result === "granted") {
        grantSiteAccess();
        return;
      }
      if (result === "lockout") {
        activateLockout();
        return;
      }

      const remaining = gate.getRemainingAttempts();
      const message =
        remaining === 1
          ? "Access denied — 1 attempt remaining"
          : "Access denied — " + remaining + " attempts remaining";
      showDeniedStatus(message);
    } catch (error) {
      showDeniedStatus("Terminal error — try again");
    } finally {
      lockoutActive = gate.isLockoutActive();
      if (bypassSubmit && !lockoutActive) {
        bypassSubmit.disabled = false;
      }
    }
  }
  function grantSiteAccess() {
    if (siteAccessGranted) return;
    siteAccessGranted = true;
    if (gate) gate.grantAccess();
    enableFolder();
    hideBypassControls();
    setBypassStatus("Access granted", "granted");
    window.setTimeout(function () {
      window.location.href = "/files/";
    }, 650);
  }

  function hideStartOverlay() {
    if (!startOverlay) return;
    startOverlay.classList.add("is-hidden");
    startOverlay.setAttribute("aria-hidden", "true");
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

  function hideAllVideos() {
    hideIntroVideo();
    hideBriefVideo();
  }

  function showDossierStage() {
    if (poster) {
      poster.classList.remove("is-visible");
    }
    if (dossierStage) {
      dossierStage.hidden = false;
      dossierStage.removeAttribute("aria-hidden");
      dossierStage.classList.add("is-visible");
    }
    if (scrim) {
      scrim.classList.add("is-terminal");
    }
  }

  function hideDossierStage() {
    if (dossierStage) {
      dossierStage.hidden = true;
      dossierStage.setAttribute("aria-hidden", "true");
      dossierStage.classList.remove("is-visible");
    }
    if (scrim) {
      scrim.classList.remove("is-terminal");
    }
  }

  function showPosterBackground() {
    hideDossierStage();
    if (poster) {
      poster.classList.add("is-visible");
    }
  }

  function showPostVideoUi() {
    if (transmissionsComplete) return;
    transmissionsComplete = true;
    hideAllVideos();

    if (previewActive && !siteAccessGranted) {
      showDossierStage();
      ui.classList.add("is-dossier-mode");
    } else {
      showPosterBackground();
      ui.classList.remove("is-dossier-mode");
    }

    logo.classList.add("is-visible");
    ui.classList.add("is-visible");
    footer.classList.add("is-visible");

    lockoutActive = gate ? gate.isLockoutActive() : false;

    if (siteAccessGranted || !previewActive) {
      enableFolder();
      hideBypassControls();
      return;
    }

    disableFolder();

    if (lockoutActive) {
      activateLockout();
      return;
    }

    openBypassBar();
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

    disableFolder();
    poster.classList.remove("is-visible");
    logo.classList.remove("is-visible");
    ui.classList.remove("is-visible", "is-unlocked", "is-dossier-mode");
    footer.classList.remove("is-visible");
    hideDossierStage();
    hideBypassControls();
    if (bypassBar) {
      bypassBar.classList.remove("is-locked");
    }

    hideBriefVideo();
    showVideoElement(introVideo);

    return playVideoElement(introVideo);
  }

  function startExperience() {
    if (experienceStarted) return;
    experienceStarted = true;
    hideStartOverlay();
    playIntroWithAudio().catch(function () {
      hideStartOverlay();
      if (startOverlay) {
        startOverlay.classList.remove("is-hidden");
        startOverlay.setAttribute("aria-hidden", "false");
      }
      experienceStarted = false;
      introPlaying = false;
      briefPlaying = false;
    });
  }

  function openArchive() {
    if (previewActive && !siteAccessGranted) return;
    window.location.href = "/files/";
  }

  if (previewActive && siteAccessGranted) {
    hideBypassControls();
  } else if (previewActive) {
    hideBypassButton();
  }

  if (startBtn) {
    startBtn.addEventListener("click", startExperience);
  }

  if (bypassForm) {
    bypassForm.addEventListener("submit", handleBypassSubmit);
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

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      checkIntroComplete();
      checkBriefComplete();
    }
  });

  document.addEventListener("keydown", handleEnterSkip);

  if (folderBtn) {
    folderBtn.addEventListener("click", openArchive);
  }
})();
