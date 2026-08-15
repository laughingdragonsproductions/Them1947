(function () {
  const introVideo = document.getElementById("intro-video");
  const poster = document.getElementById("landing-poster");
  const logo = document.getElementById("landing-logo");
  const ui = document.getElementById("landing-ui");
  const footer = document.getElementById("landing-footer");
  const folderBtn = document.getElementById("classified-folder");
  const overlay = document.getElementById("brief-overlay");
  const briefVideo = document.getElementById("brief-video");
  const closeBtn = document.getElementById("brief-close");
  const replayBtn = document.getElementById("brief-replay");
  const soundToggle = document.getElementById("sound-toggle");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let audioUnlocked = false;
  let introFinished = false;

  function setBriefAudio(on) {
    briefVideo.muted = !on;
    briefVideo.volume = on ? 1 : 0;
  }

  function updateSoundToggle() {
    if (!soundToggle) return;
    soundToggle.textContent = audioUnlocked ? "Sound on" : "Enable audio";
    soundToggle.setAttribute("aria-label", audioUnlocked ? "Sound enabled" : "Enable sound");
    soundToggle.setAttribute("aria-pressed", audioUnlocked ? "true" : "false");
    soundToggle.classList.toggle("is-on", audioUnlocked);
  }

  function enableAudio() {
    audioUnlocked = true;
    updateSoundToggle();

    if (!introFinished) {
      introVideo.muted = false;
      introVideo.volume = 1;
      introVideo.play().catch(function () {});
      return;
    }

    introVideo.pause();
    introVideo.currentTime = 0;
    introVideo.muted = false;
    introVideo.volume = 1;
    introVideo.classList.remove("is-hidden");
    poster.classList.remove("is-visible");
    logo.classList.remove("is-visible");
    ui.classList.remove("is-visible");
    footer.classList.remove("is-visible");
    introFinished = false;

    introVideo.play().catch(function () {
      showIdleState();
    });
  }

  function showIdleState() {
    introFinished = true;
    introVideo.pause();
    introVideo.classList.add("is-hidden");
    poster.classList.add("is-visible");
    logo.classList.add("is-visible");
    ui.classList.add("is-visible");
    footer.classList.add("is-visible");
  }

  function playBriefWithAudio() {
    setBriefAudio(true);
    briefVideo.currentTime = 0;
    return briefVideo.play().catch(function () {
      setBriefAudio(false);
      return briefVideo.play();
    });
  }

  function openBrief() {
    if (!audioUnlocked) {
      audioUnlocked = true;
      updateSoundToggle();
    }

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    playBriefWithAudio();
  }

  function closeBrief() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    briefVideo.pause();
    briefVideo.currentTime = 0;
  }

  if (soundToggle) {
    soundToggle.addEventListener("click", enableAudio);
  }

  if (prefersReducedMotion) {
    introVideo.pause();
    showIdleState();
  } else {
    introVideo.addEventListener("ended", showIdleState);
    introVideo.play().catch(function () {
      showIdleState();
    });
  }

  folderBtn.addEventListener("click", openBrief);
  closeBtn.addEventListener("click", closeBrief);
  replayBtn.addEventListener("click", function () {
    playBriefWithAudio();
  });

  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) closeBrief();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && overlay.classList.contains("is-open")) {
      closeBrief();
    }
  });

  briefVideo.addEventListener("ended", function () {
    replayBtn.focus();
  });

  setBriefAudio(false);
  updateSoundToggle();
})();
