(function () {
  const introVideo = document.getElementById("intro-video");
  const briefVideo = document.getElementById("brief-video");
  const poster = document.getElementById("landing-poster");
  const scrim = document.getElementById("landing-scrim");
  const logo = document.getElementById("landing-logo");
  const ui = document.getElementById("landing-ui");
  const footer = document.getElementById("landing-footer");
  const folderBtn = document.getElementById("classified-folder");
  const terminalBtn = document.getElementById("terminal-access-btn");
  const startOverlay = document.getElementById("start-overlay");
  const startBtn = document.getElementById("start-btn");

  const isMobile =
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(pointer: coarse)").matches ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  let experienceStarted = false;
  let transmissionsComplete = false;
  let introPlaying = false;
  let briefPlaying = false;

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

  function skipToTerminalUi() {
    if (transmissionsComplete) return;
    if (!experienceStarted) {
      experienceStarted = true;
      hideStartOverlay();
    }
    introPlaying = false;
    briefPlaying = false;
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
      "a, button, .classified-folder, .landing-footer"
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
    if (ui) ui.classList.remove("is-unlocked");
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

    disableArchiveControls();
    poster.classList.remove("is-visible");
    logo.classList.remove("is-visible");
    ui.classList.remove("is-visible", "is-unlocked");
    footer.classList.remove("is-visible");

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
    window.location.href = "/files/";
  }

  if (startBtn) {
    startBtn.addEventListener("click", startExperience);
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
  document.addEventListener("pointerdown", handlePointerSkip);

  if (folderBtn) {
    folderBtn.addEventListener("click", openArchive);
  }

  if (terminalBtn) {
    terminalBtn.addEventListener("click", openArchive);
  }
})();
