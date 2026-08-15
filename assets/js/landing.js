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

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouchDevice =
    window.matchMedia("(pointer: coarse)").matches ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  let experienceStarted = false;
  let introFinished = false;

  function hideStartOverlay() {
    if (startOverlay) {
      startOverlay.classList.add("is-hidden");
      startOverlay.setAttribute("aria-hidden", "true");
    }
  }

  function setBriefAudio(on) {
    briefVideo.muted = !on;
    briefVideo.volume = on ? 1 : 0;
  }

  function showIdleState() {
    if (introFinished) return;
    introFinished = true;

    introVideo.pause();
    if (Number.isFinite(introVideo.duration) && introVideo.duration > 0) {
      try {
        introVideo.currentTime = Math.max(0, introVideo.duration - 0.05);
      } catch (err) {
        /* iOS may reject seek while transitioning */
      }
    }

    introVideo.classList.add("is-hidden");
    poster.classList.add("is-visible");
    logo.classList.add("is-visible");
    ui.classList.add("is-visible");
    footer.classList.add("is-visible");
  }

  function checkIntroComplete() {
    if (introFinished || !experienceStarted || briefOverlay.classList.contains("is-open")) {
      return;
    }

    if (introVideo.ended) {
      showIdleState();
      return;
    }

    const duration = introVideo.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;

    if (introVideo.currentTime >= duration - 0.2) {
      showIdleState();
    }
  }

  function playIntroWithAudio() {
    introFinished = false;
    introVideo.classList.remove("is-hidden");
    poster.classList.remove("is-visible");
    logo.classList.remove("is-visible");
    ui.classList.remove("is-visible");
    footer.classList.remove("is-visible");
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

    if (prefersReducedMotion) {
      showIdleState();
      return;
    }

    playIntroWithAudio().catch(function () {
      showIdleState();
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
    if (!experienceStarted) {
      startExperience();
    }

    briefOverlay.classList.add("is-open");
    briefOverlay.setAttribute("aria-hidden", "false");
    playBriefWithAudio();
  }

  function closeBrief() {
    briefOverlay.classList.remove("is-open");
    briefOverlay.setAttribute("aria-hidden", "true");
    briefVideo.pause();
    briefVideo.currentTime = 0;

    if (experienceStarted && !introFinished) {
      checkIntroComplete();
    }
  }

  if (startBtn) {
    startBtn.addEventListener("click", startExperience);
  }

  introVideo.addEventListener("ended", showIdleState);
  introVideo.addEventListener("timeupdate", checkIntroComplete);
  introVideo.addEventListener("pause", checkIntroComplete);

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

  if (!isTouchDevice && !prefersReducedMotion) {
    hideStartOverlay();
    experienceStarted = true;
    introVideo.muted = true;
    introVideo.play().then(function () {
      introVideo.muted = false;
      introVideo.volume = 1;
    }).catch(function () {
      experienceStarted = false;
      if (startOverlay) {
        startOverlay.classList.remove("is-hidden");
        startOverlay.setAttribute("aria-hidden", "false");
      }
    });
  }
})();
