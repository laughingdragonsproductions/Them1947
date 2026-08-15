(function () {
  const introVideo = document.getElementById("intro-video");
  const poster = document.getElementById("landing-poster");
  const logo = document.getElementById("landing-logo");
  const ui = document.getElementById("landing-ui");
  const footer = document.getElementById("landing-footer");
  const folderBtn = document.getElementById("classified-folder");
  const briefOverlay = document.getElementById("brief-overlay");
  const briefVideo = document.getElementById("brief-video");
  const closeBtn = document.getElementById("brief-close");
  const replayBtn = document.getElementById("brief-replay");
  const startOverlay = document.getElementById("start-overlay");
  const startBtn = document.getElementById("start-btn");

  const isMobile =
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(pointer: coarse)").matches ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  let experienceStarted = false;
  let introFinished = false;
  let introPlaying = false;

  if (isMobile) {
    document.documentElement.classList.add("is-mobile");
  }

  folderBtn.disabled = true;
  folderBtn.setAttribute("aria-disabled", "true");

  function hideStartOverlay() {
    if (!startOverlay) return;
    startOverlay.classList.add("is-hidden");
    startOverlay.setAttribute("aria-hidden", "true");
  }

  function hideIntroVideo() {
    introPlaying = false;
    introVideo.pause();
    introVideo.classList.remove("is-active");
    introVideo.classList.add("is-dormant", "is-hidden");
  }

  function setBriefAudio(on) {
    briefVideo.muted = !on;
    briefVideo.volume = on ? 1 : 0;
  }

  function unlockClassifiedAccess() {
    if (introFinished) return;
    introFinished = true;
    hideIntroVideo();
    poster.classList.add("is-visible");
    logo.classList.add("is-visible");
    ui.classList.add("is-visible", "is-unlocked");
    footer.classList.add("is-visible");
    folderBtn.disabled = false;
    folderBtn.removeAttribute("aria-disabled");
  }

  function checkIntroComplete() {
    if (introFinished || !introPlaying || briefOverlay.classList.contains("is-open")) {
      return;
    }

    if (introVideo.ended) {
      unlockClassifiedAccess();
      return;
    }

    const duration = introVideo.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;

    if (introVideo.currentTime >= duration - 0.15) {
      unlockClassifiedAccess();
    }
  }

  function playIntroWithAudio() {
    introFinished = false;
    introPlaying = true;
    poster.classList.remove("is-visible");
    logo.classList.remove("is-visible");
    ui.classList.remove("is-visible", "is-unlocked");
    footer.classList.remove("is-visible");
    folderBtn.disabled = true;
    folderBtn.setAttribute("aria-disabled", "true");
    introVideo.classList.remove("is-dormant", "is-hidden");
    introVideo.classList.add("is-active");
    introVideo.currentTime = 0;
    introVideo.muted = false;
    introVideo.volume = 1;
    introVideo.playsInline = true;

    return introVideo.play().catch(function () {
      introVideo.muted = true;
      return introVideo.play();
    });
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
    });
  }

  function playBriefWithAudio() {
    setBriefAudio(true);
    briefVideo.currentTime = 0;
    briefVideo.playsInline = true;
    return briefVideo.play().catch(function () {
      setBriefAudio(false);
      return briefVideo.play();
    });
  }

  function openBrief() {
    if (!introFinished) return;

    briefOverlay.classList.add("is-open");
    briefOverlay.setAttribute("aria-hidden", "false");
    playBriefWithAudio();
  }

  function closeBrief() {
    briefOverlay.classList.remove("is-open");
    briefOverlay.setAttribute("aria-hidden", "true");
    briefVideo.pause();
    briefVideo.currentTime = 0;
  }

  if (startBtn) {
    startBtn.addEventListener("click", startExperience);
  }

  introVideo.addEventListener("ended", unlockClassifiedAccess);
  introVideo.addEventListener("timeupdate", checkIntroComplete);

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      checkIntroComplete();
    }
  });

  folderBtn.addEventListener("click", openBrief);
  closeBtn.addEventListener("click", closeBrief);
  replayBtn.addEventListener("click", playBriefWithAudio);

  briefOverlay.addEventListener("click", function (event) {
    if (event.target === briefOverlay) closeBrief();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && briefOverlay.classList.contains("is-open")) {
      closeBrief();
    }
  });

  briefVideo.addEventListener("ended", function () {
    replayBtn.focus();
  });

  setBriefAudio(true);
})();
