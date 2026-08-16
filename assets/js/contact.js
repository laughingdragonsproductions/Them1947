(function () {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const statusEl = document.getElementById("contact-form-status");
  const cfg = window.SITE_CONFIG || {};
  const accessKey = cfg.web3formsAccessKey;
  const subjectPrefix = cfg.legalName || cfg.name || "THEM 1947";

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!accessKey) {
      if (statusEl) {
        statusEl.textContent = "Contact form is not configured yet. Please try again later.";
        statusEl.className = "form-status form-status-error";
      }
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (statusEl) {
      statusEl.textContent = "Sending…";
      statusEl.className = "form-status form-status-pending";
    }

    const fd = new FormData(form);
    fd.append("access_key", accessKey);
    fd.append("from_name", subjectPrefix);
    const subject = fd.get("subject");
    fd.set("subject", subject ? subjectPrefix + ": " + subject : subjectPrefix + " - Contact form");

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = (cfg.domain || "") + "/submissionsent/";
        return;
      }
      throw new Error(data.message || "Something went wrong.");
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = err.message || "Could not send your message. Please try again.";
        statusEl.className = "form-status form-status-error";
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();
