/** THEM 1947 — site-wide owner preview gate (sessionStorage, client-side). */
(function () {
  const STORAGE_GRANTED = "them1947.access.granted";
  const STORAGE_FAILS = "them1947.bypass.fails";
  const STORAGE_LOCKOUT = "them1947.bypass.lockout";

  const PUBLIC_ROUTE_PREFIXES = ["/privacy/", "/terms/", "/contact/", "/lockout/"];

  function normalizePath(pathname) {
    const raw = pathname || window.location.pathname || "/";
    if (raw === "/index.html") return "/";
    if (raw.endsWith("/")) return raw;
    const last = raw.slice(raw.lastIndexOf("/") + 1);
    if (last.includes(".")) return raw;
    return raw + "/";
  }

  function isPublicRoute(pathname) {
    const path = normalizePath(pathname);
    if (path === "/") return false;
    return PUBLIC_ROUTE_PREFIXES.some(function (prefix) {
      return path === prefix || path.startsWith(prefix);
    });
  }

  function getGateConfig() {
    const cfg = (window.SITE_CONFIG && window.SITE_CONFIG.previewGate) || {};
    return {
      enabled: cfg.enabled === true,
      passwordHash: (cfg.passwordHash || "").toLowerCase(),
      maxFails: typeof cfg.maxFails === "number" ? cfg.maxFails : 3,
    };
  }

  function readState() {
    let lockoutActive = false;
    let failCount = 0;
    try {
      lockoutActive = sessionStorage.getItem(STORAGE_LOCKOUT) === "1";
      const storedFails = parseInt(sessionStorage.getItem(STORAGE_FAILS) || "0", 10);
      failCount = Number.isFinite(storedFails) ? storedFails : 0;
    } catch (error) {
      lockoutActive = false;
      failCount = 0;
    }
    return { lockoutActive, failCount };
  }

  function persistState(failCount, lockoutActive) {
    try {
      sessionStorage.setItem(STORAGE_FAILS, String(failCount));
      sessionStorage.setItem(STORAGE_LOCKOUT, lockoutActive ? "1" : "0");
    } catch (error) {
      /* ignore */
    }
  }

  function sha256Hex(text) {
    const encoded = new TextEncoder().encode(text);
    return crypto.subtle.digest("SHA-256", encoded).then(function (buffer) {
      return Array.from(new Uint8Array(buffer))
        .map(function (b) {
          return b.toString(16).padStart(2, "0");
        })
        .join("");
    });
  }

  function hashesMatch(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i += 1) {
      mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
  }

  function isPreviewActive() {
    return getGateConfig().enabled;
  }

  function isAccessGranted() {
    if (!isPreviewActive()) return true;
    try {
      return sessionStorage.getItem(STORAGE_GRANTED) === "1";
    } catch (error) {
      return false;
    }
  }

  function grantAccess() {
    try {
      sessionStorage.setItem(STORAGE_GRANTED, "1");
      sessionStorage.setItem(STORAGE_FAILS, "0");
      sessionStorage.setItem(STORAGE_LOCKOUT, "0");
    } catch (error) {
      /* ignore */
    }
  }

  function applyBodyLock() {
    if (isPublicRoute()) return;
    if (isPreviewActive() && !isAccessGranted()) {
      document.documentElement.classList.add("preview-pending");
    }
  }

  function setStatusEl(el, message, tone) {
    if (!el) return;
    el.textContent = message;
    el.classList.remove("is-denied", "is-granted", "is-lockout");
    if (tone) el.classList.add("is-" + tone);
  }

  function recordFailedAttempt(state, maxFails) {
    if (state.lockoutActive || isAccessGranted()) {
      return { lockoutActive: state.lockoutActive, failCount: state.failCount, result: "lockout" };
    }

    state.failCount += 1;
    if (state.failCount >= maxFails) {
      state.lockoutActive = true;
      state.failCount = maxFails;
      persistState(state.failCount, state.lockoutActive);
      return { lockoutActive: true, failCount: state.failCount, result: "lockout" };
    }

    persistState(state.failCount, state.lockoutActive);
    return { lockoutActive: false, failCount: state.failCount, result: "denied" };
  }

  function clearanceCandidates(input) {
    const trimmed = (input || "").trim();
    const candidates = [trimmed];
    if (trimmed.length > 0) {
      const normalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      if (normalized !== trimmed) candidates.push(normalized);
    }
    return candidates;
  }

  /**
   * @returns {Promise<boolean>}
   */
  function verifyPassword(input) {
    const gateCfg = getGateConfig();
    if (!gateCfg.passwordHash) return Promise.resolve(false);
    const candidates = clearanceCandidates(input);
    return Promise.all(candidates.map(sha256Hex)).then(function (digests) {
      return digests.some(function (digest) {
        return hashesMatch(digest, gateCfg.passwordHash);
      });
    });
  }

  /**
   * @returns {Promise<"granted"|"denied"|"lockout"|"inactive">}
   */
  function checkPassword(input) {
    if (!isPreviewActive()) return Promise.resolve("inactive");
    if (isAccessGranted()) return Promise.resolve("granted");

    const gateCfg = getGateConfig();
    const state = readState();

    return verifyPassword(input).then(function (ok) {
      if (ok) {
        grantAccess();
        return "granted";
      }
      if (state.lockoutActive) return "lockout";
      return recordFailedAttempt(state, gateCfg.maxFails).result;
    });
  }

  function isLockoutActive() {
    return readState().lockoutActive;
  }

  function getRemainingAttempts() {
    const state = readState();
    const maxFails = getGateConfig().maxFails;
    if (state.lockoutActive) return 0;
    return Math.max(0, maxFails - state.failCount);
  }

  function redirectToLockout() {
    const path = window.location.pathname || "";
    if (path.startsWith("/lockout")) return;
    window.location.replace("/lockout/");
  }

  function enforceLockoutOrGate() {
    if (!isPreviewActive() || isAccessGranted()) return false;
    if (!readState().lockoutActive) return false;
    const path = normalizePath(window.location.pathname);
    if (path === "/" || isPublicRoute(path)) return false;
    redirectToLockout();
    return true;
  }

  function deniedMessage() {
    const remaining = getRemainingAttempts();
    if (remaining <= 0) return "Access denied";
    if (remaining === 1) return "Access denied — 1 attempt remaining";
    return "Access denied — " + remaining + " attempts remaining";
  }

  function handlePasswordResult(result, onGranted, onDenied) {
    if (result === "granted") {
      onGranted();
      return;
    }
    if (result === "lockout") {
      redirectToLockout();
      return;
    }
    onDenied(deniedMessage());
  }

  function mountGateOverlay() {
    if (enforceLockoutOrGate()) return;
    if (document.getElementById("preview-gate")) return;

    const gate = document.createElement("div");
    gate.id = "preview-gate";
    gate.className = "preview-gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-label", "Clearance required");

    gate.innerHTML =
      '<div class="preview-gate-inner">' +
      '<img class="preview-gate-logo" src="/assets/brand/logo.png" alt="THEM 1947" width="120" height="120" />' +
      '<p class="preview-gate-eyebrow">Restricted access</p>' +
      '<h1 class="preview-gate-title">Clearance required</h1>' +
      '<p class="preview-gate-lede">This archive is in owner preview. The dossier is on the table — read the code phrase, then enter it below.</p>' +
      '<form id="preview-gate-form" class="preview-gate-form" autocomplete="off">' +
      '<label class="preview-gate-label" for="preview-gate-input">Clearance code</label>' +
      '<div class="preview-gate-input-row">' +
      '<input id="preview-gate-input" class="preview-gate-input" type="text" name="clearance" autocomplete="off" spellcheck="false" maxlength="32" />' +
      '<button id="preview-gate-submit" class="preview-gate-submit" type="submit">Access</button>' +
      "</div>" +
      "</form>" +
      '<p id="preview-gate-status" class="preview-gate-status" aria-live="polite"></p>' +
      '<p class="preview-gate-hint"><a href="/">Return to landing transmission</a></p>' +
      "</div>";

    document.body.appendChild(gate);

    const form = document.getElementById("preview-gate-form");
    const input = document.getElementById("preview-gate-input");
    const submit = document.getElementById("preview-gate-submit");
    const status = document.getElementById("preview-gate-status");
    let state = readState();

    if (state.lockoutActive) {
      setStatusEl(
        status,
        "Clearance revoked — enter the short cyan code from the dossier",
        "lockout"
      );
    }

    if (input) {
      input.focus();
    }

    function onSuccess() {
      grantAccess();
      setStatusEl(status, "Access granted", "granted");
      window.setTimeout(function () {
        window.location.reload();
      }, 450);
    }

    function onDenied(message) {
      setStatusEl(status, message, "denied");
      if (input) {
        input.value = "";
        input.focus();
      }
      gate.classList.add("is-shake");
      window.setTimeout(function () {
        gate.classList.remove("is-shake");
      }, 480);
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (state.lockoutActive || isAccessGranted()) return;

        const attempt = input ? input.value.trim() : "";
        if (!attempt) {
          setStatusEl(status, "Enter clearance code", "denied");
          if (input) input.focus();
          return;
        }
        if (submit) submit.disabled = true;

        checkPassword(attempt)
          .then(function (result) {
            state = readState();
            handlePasswordResult(result, onSuccess, onDenied);
          })
          .catch(function () {
            setStatusEl(status, "Terminal error — try again", "denied");
            if (input) input.focus();
          })
          .finally(function () {
            state = readState();
            if (submit && !state.lockoutActive) submit.disabled = false;
          });
      });
    }
  }

  function requireAccess() {
    if (isPublicRoute()) {
      document.documentElement.classList.remove("preview-pending");
      document.body.style.overflow = "";
      return true;
    }
    if (enforceLockoutOrGate()) return false;

    if (!isPreviewActive() || isAccessGranted()) {
      document.documentElement.classList.remove("preview-pending");
      document.body.style.overflow = "";
      return true;
    }

    document.documentElement.classList.add("preview-pending");
    document.body.style.overflow = "hidden";
    mountGateOverlay();
    return false;
  }

  if (document.documentElement) {
    applyBodyLock();
    enforceLockoutOrGate();
  }

  window.SiteGate = {
    isPreviewActive: isPreviewActive,
    isAccessGranted: isAccessGranted,
    grantAccess: grantAccess,
    checkPassword: checkPassword,
    verifyPassword: verifyPassword,
    isLockoutActive: isLockoutActive,
    isPublicRoute: isPublicRoute,
    getRemainingAttempts: getRemainingAttempts,
    redirectToLockout: redirectToLockout,
    enforceLockoutOrGate: enforceLockoutOrGate,
    requireAccess: requireAccess,
    applyBodyLock: applyBodyLock,
    mountGateOverlay: mountGateOverlay,
    STORAGE_GRANTED: STORAGE_GRANTED,
    STORAGE_FAILS: STORAGE_FAILS,
    STORAGE_LOCKOUT: STORAGE_LOCKOUT,
  };
})();
