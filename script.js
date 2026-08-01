
const luxuryEnvelopeIntro = document.getElementById("luxuryEnvelopeIntro");
const goldWaxSeal = document.getElementById("goldWaxSeal");

// Prevent the browser restoring an old scroll position when the invitation opens.
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function returnInvitationToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

// Start every fresh visit at the top, including browser refreshes and back navigation.
returnInvitationToTop();
window.addEventListener("pageshow", returnInvitationToTop);

if (luxuryEnvelopeIntro && goldWaxSeal) {
  let envelopeOpened = false;

  goldWaxSeal.addEventListener("click", () => {
    if (envelopeOpened) return;

    envelopeOpened = true;
    goldWaxSeal.disabled = true;

    // Lock the reveal to the top of the homepage before the envelope disappears.
    returnInvitationToTop();

    // Brief tactile press on the seal.
    luxuryEnvelopeIntro.classList.add("is-pressed");

    // The complete envelope then fades away as one image.
    window.setTimeout(() => {
      returnInvitationToTop();
      luxuryEnvelopeIntro.classList.add("is-dissolving");
    }, 150);

    window.setTimeout(() => {
      returnInvitationToTop();
      document.body.classList.remove("intro-active");
      luxuryEnvelopeIntro.classList.add("is-fading");
    }, 760);

    window.setTimeout(() => {
      returnInvitationToTop();
      luxuryEnvelopeIntro.remove();
    }, 1480);
  });
}

const menu = document.getElementById("menu");
const nav = document.getElementById("nav");
const confettiCanvas = document.getElementById("confettiCanvas");
const confettiContext = confettiCanvas ? confettiCanvas.getContext("2d") : null;

if (menu && nav) {
  menu.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(open));
  });

  document.querySelectorAll("#nav a").forEach(link => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

const form = document.getElementById("form");
const submit = document.getElementById("submit");
const status = document.getElementById("status");
const thanks = document.getElementById("thanks");
const thanksTitle = document.getElementById("thanksTitle");
const REQUIRED_BACKEND_VERSION = "5.29";
let confettiFrameId = null;

/*
 * Prevent an RSVP from being submitted by pressing Enter inside a form field.
 * Enter remains available inside textareas for writing multi-line messages.
 * The RSVP can only be submitted using the visible “Send Your Reply” button.
 */
form.addEventListener("keydown", event => {
  if (event.key !== "Enter") return;

  const field = event.target;
  const isTextarea = field instanceof HTMLTextAreaElement;

  if (!isTextarea) {
    event.preventDefault();
  }
});

async function sha256(value) {
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

function checkDuplicate(endpoint, emailHash) {
  return new Promise((resolve, reject) => {
    const callbackName = `evergreenDuplicate_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const callbackScript = document.createElement("script");
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Duplicate check timed out."));
    }, 10000);

    function cleanup() {
      clearTimeout(timer);
      delete window[callbackName];
      callbackScript.remove();
    }

    window[callbackName] = result => {
      cleanup();
      resolve(result || { duplicate: false, version: "" });
    };

    callbackScript.onerror = () => {
      cleanup();
      reject(new Error("Duplicate check failed."));
    };

    const separator = endpoint.includes("?") ? "&" : "?";
    callbackScript.src = `${endpoint}${separator}action=check&hash=${encodeURIComponent(emailHash)}&callback=${encodeURIComponent(callbackName)}&_=${Date.now()}`;
    document.body.appendChild(callbackScript);
  });
}

function stopConfetti() {
  if (!confettiCanvas || !confettiContext) return;
  if (confettiFrameId) {
    cancelAnimationFrame(confettiFrameId);
    confettiFrameId = null;
  }
  confettiContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
}


function checkSubmissionStatus(endpoint, emailHash) {
  return new Promise((resolve, reject) => {
    const callbackName = `evergreenStatus_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const callbackScript = document.createElement("script");
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Submission status check timed out."));
    }, 10000);

    function cleanup() {
      clearTimeout(timer);
      delete window[callbackName];
      callbackScript.remove();
    }

    window[callbackName] = result => {
      cleanup();
      resolve(result || { found: false });
    };

    callbackScript.onerror = () => {
      cleanup();
      reject(new Error("Submission status check failed."));
    };

    const separator = endpoint.includes("?") ? "&" : "?";
    callbackScript.src = `${endpoint}${separator}action=status&hash=${encodeURIComponent(emailHash)}&callback=${encodeURIComponent(callbackName)}&_=${Date.now()}`;
    document.body.appendChild(callbackScript);
  });
}

async function waitForSubmissionStatus(endpoint, emailHash) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await new Promise(resolve => window.setTimeout(resolve, 900 + attempt * 500));
    const result = await checkSubmissionStatus(endpoint, emailHash);
    if (result.found) return result;
  }
  return { found: false };
}

function runConfetti() {
  if (!confettiCanvas || !confettiContext) return;

  stopConfetti();

  const pieces = [];
  const colors = ["#c3a44f", "#49613d", "#9c2f28", "#f4eee1", "#dcc476"];
  const duration = 3200;
  const start = performance.now();

  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    confettiCanvas.width = Math.floor(window.innerWidth * ratio);
    confettiCanvas.height = Math.floor(window.innerHeight * ratio);
    confettiCanvas.style.width = window.innerWidth + "px";
    confettiCanvas.style.height = window.innerHeight + "px";
    confettiContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  resizeCanvas();

  for (let i = 0; i < 160; i++) {
    pieces.push({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * 0.3,
      w: 6 + Math.random() * 7,
      h: 10 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 4.5,
      rotation: Math.random() * Math.PI * 2,
      spin: -0.18 + Math.random() * 0.36,
      sway: Math.random() * Math.PI * 2
    });
  }

  function frame(now) {
    confettiContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const elapsed = now - start;
    const opacity = Math.max(0, 1 - elapsed / duration);

    pieces.forEach(piece => {
      piece.x += piece.vx + Math.sin((elapsed / 220) + piece.sway) * 0.7;
      piece.y += piece.vy;
      piece.rotation += piece.spin;

      confettiContext.save();
      confettiContext.globalAlpha = opacity;
      confettiContext.translate(piece.x, piece.y);
      confettiContext.rotate(piece.rotation);
      confettiContext.fillStyle = piece.color;
      confettiContext.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
      confettiContext.restore();
    });

    if (elapsed < duration) {
      confettiFrameId = requestAnimationFrame(frame);
    } else {
      confettiContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  confettiFrameId = requestAnimationFrame(frame);
}


const guestEnableToggles = document.querySelectorAll(".guest-enable");

function setRequiredForGuest(guestNumber, enabled) {
  const fields = document.querySelector(`[data-fields-for="${guestNumber}"]`);
  if (!fields) return;

  fields.querySelectorAll("input, select, textarea").forEach(control => {
    control.disabled = !enabled;
  });

  ["FirstName", "LastName", "Email"].forEach(suffix => {
    const control = fields.querySelector(`[name="guest${guestNumber}${suffix}"]`);
    if (control) control.required = enabled;
  });

  fields.querySelectorAll(`[name="guest${guestNumber}Attending"]`).forEach(control => {
    control.required = enabled;
  });
}

guestEnableToggles.forEach(toggle => {
  toggle.addEventListener("change", () => {
    const guestNumber = toggle.dataset.enableGuest;
    const fields = document.querySelector(`[data-fields-for="${guestNumber}"]`);
    if (!fields) return;

    fields.hidden = !toggle.checked;
    setRequiredForGuest(guestNumber, toggle.checked);

    if (!toggle.checked) {
      fields.querySelectorAll("input").forEach(input => {
        if (input.type === "radio" || input.type === "checkbox") input.checked = false;
        else input.value = "";
      });
      const meals = document.querySelector(`[data-meals-for="${guestNumber}"]`);
      if (meals) meals.hidden = true;
    }
  });
});

function updateMealSelection(guestNumber, attending) {
  const meals = document.querySelector(`[data-meals-for="${guestNumber}"]`);
  if (!meals) return;

  const accepting = attending === "Yes";
  meals.hidden = !accepting;

  meals.querySelectorAll("input[type=radio]").forEach(input => {
    input.disabled = !accepting;
    input.required = accepting;
    if (!accepting) input.checked = false;
  });
}

document.querySelectorAll('input[name$="Attending"]').forEach(input => {
  input.addEventListener("change", () => {
    const match = input.name.match(/^guest(\d+)Attending$/);
    if (match) updateMealSelection(match[1], input.value);
  });
});

form.addEventListener("submit", async event => {
  event.preventDefault();

  // Ignore implicit submissions. Only the visible submit button may send the RSVP.
  if (event.submitter !== submit) {
    return;
  }

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const endpoint = window.EVERGREEN_CONFIG?.RSVP_ENDPOINT?.trim();
  const data = Object.fromEntries(new FormData(form).entries());

  data.guest1Email = String(data.guest1Email || "").trim().toLowerCase();
  data.email = data.guest1Email;
  data.name = [data.guest1FirstName, data.guest1LastName].filter(Boolean).join(" ").trim();

  const guests = [1, 2, 3]
    .map(number => {
      const guest = {
        number,
        firstName: String(data[`guest${number}FirstName`] || "").trim(),
        lastName: String(data[`guest${number}LastName`] || "").trim(),
        attending: String(data[`guest${number}Attending`] || "").trim(),
        starter: String(data[`guest${number}Starter`] || "").trim(),
        main: String(data[`guest${number}Main`] || "").trim()
      };

      data[`guest${number}Name`] = [guest.firstName, guest.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      data[`guest${number}MealChoices`] = guest.attending === "Yes"
        ? `Starter: ${guest.starter || "Not supplied"} | Main: ${guest.main || "Not supplied"}`
        : guest.attending === "No"
          ? "Not attending"
          : "";

      return guest;
    })
    .filter(guest => guest.firstName || guest.lastName);

  data.attending = guests.some(guest => guest.attending === "Yes") ? "Yes" : "No";
  data.guestCount = String(guests.filter(guest => guest.attending === "Yes").length);
  data.guestNames = guests.map(guest => [guest.firstName, guest.lastName].filter(Boolean).join(" ")).join(" | ");

  const songRequests = [data.song1, data.song2, data.song3]
    .map(value => String(value || "").trim())
    .filter(Boolean);
  data.song = songRequests.join(" | ");
  data.message = String(data.message || "").trim();

  data.submittedAt = new Date().toISOString();
  data.pageUrl = location.href;
  data.userAgent = navigator.userAgent;

  if (!endpoint) {
    status.textContent = "RSVP setup is incomplete.";
    status.className = "form-error";
    return;
  }

  submit.disabled = true;
  submit.innerHTML = "Checking…";
  status.textContent = "Checking your email address…";
  status.className = "";

  try {
    const emailHash = await sha256(data.email);
    const backendCheck = await checkDuplicate(endpoint, emailHash);

    if (backendCheck.version !== REQUIRED_BACKEND_VERSION) {
      throw new Error(
        `BACKEND_VERSION_MISMATCH:${backendCheck.version || "unknown"}`
      );
    }

    if (backendCheck.duplicate) {
      status.textContent = "An RSVP has already been submitted using this email address. Please contact Emma or Joe if the response needs changing.";
      status.className = "form-error";
      return;
    }

    submit.innerHTML = "Sending…";
    status.textContent = "Sending your reply…";

    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(data)
    });

    status.textContent = "Confirming your RSVP was saved…";
    const savedStatus = await waitForSubmissionStatus(endpoint, emailHash);

    if (savedStatus.version !== REQUIRED_BACKEND_VERSION) {
      throw new Error(
        `BACKEND_VERSION_MISMATCH:${savedStatus.version || "unknown"}`
      );
    }

    if (!savedStatus.found) {
      throw new Error("SUBMISSION_NOT_CONFIRMED");
    }

    thanksTitle.textContent = data.attending === "Yes"
      ? "We cannot wait to celebrate with you."
      : "Thank you for letting us know.";

    if (data.attending === "Yes") {
      runConfetti();
    } else {
      stopConfetti();
    }
    thanks.classList.add("show");
    form.reset();
    document.querySelectorAll(".guest-fields, .meal-selection").forEach(section => {
      section.hidden = true;
    });
    [2, 3].forEach(number => setRequiredForGuest(number, false));

    if (savedStatus.emailStatus === "Sent") {
      status.textContent = "Your RSVP and meal choices were saved. Please check your inbox for confirmation.";
      status.className = "form-success";
    } else {
      status.textContent = "Your RSVP and meal choices were saved, but the confirmation email could not be sent. Please contact Emma or Joe.";
      status.className = "form-error";
    }
  } catch (error) {
    console.error(error);

    if (String(error?.message || error).startsWith("BACKEND_VERSION_MISMATCH:")) {
      status.textContent = "The RSVP service has not been updated to the latest version. Please contact Emma or Joe before trying again.";
    } else if (String(error?.message || error) === "SUBMISSION_NOT_CONFIRMED") {
      status.textContent = "Your reply may have been received, but the website could not confirm it. Please contact Emma or Joe before submitting again.";
    } else {
      status.textContent = "We could not send your RSVP. Please check your connection and try again.";
    }

    status.className = "form-error";
  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Send Your Reply <span>❧</span>';
  }
});

document.getElementById("closeThanks").addEventListener("click", () => {
  thanks.classList.remove("show");
});
