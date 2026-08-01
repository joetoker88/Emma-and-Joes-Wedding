
const luxuryEnvelopeIntro = document.getElementById("luxuryEnvelopeIntro");
const goldWaxSeal = document.getElementById("goldWaxSeal");

if (luxuryEnvelopeIntro && goldWaxSeal) {
  let envelopeOpened = false;

  goldWaxSeal.addEventListener("click", () => {
    if (envelopeOpened) return;

    envelopeOpened = true;
    goldWaxSeal.disabled = true;

    // Brief tactile press on the seal.
    luxuryEnvelopeIntro.classList.add("is-pressed");

    // The complete envelope then fades away as one image.
    window.setTimeout(() => {
      luxuryEnvelopeIntro.classList.add("is-dissolving");
    }, 150);

    window.setTimeout(() => {
      document.body.classList.remove("intro-active");
      luxuryEnvelopeIntro.classList.add("is-fading");
    }, 760);

    window.setTimeout(() => {
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
let confettiFrameId = null;

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
      resolve(Boolean(result?.duplicate));
    };

    callbackScript.onerror = () => {
      cleanup();
      reject(new Error("Duplicate check failed."));
    };

    const separator = endpoint.includes("?") ? "&" : "?";
    callbackScript.src = `${endpoint}${separator}action=check&hash=${encodeURIComponent(emailHash)}&callback=${encodeURIComponent(callbackName)}`;
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

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const endpoint = window.EVERGREEN_CONFIG?.RSVP_ENDPOINT?.trim();
  const data = Object.fromEntries(new FormData(form).entries());

  data.guest1Email = String(data.guest1Email || "").trim().toLowerCase();
  data.guest2Email = String(data.guest2Email || "").trim().toLowerCase();
  data.guest3Email = String(data.guest3Email || "").trim().toLowerCase();

  data.email = data.guest1Email;
  data.name = [data.guest1FirstName, data.guest1LastName].filter(Boolean).join(" ").trim();

  const guests = [1, 2, 3]
    .map(number => ({
      number,
      firstName: String(data[`guest${number}FirstName`] || "").trim(),
      lastName: String(data[`guest${number}LastName`] || "").trim(),
      email: String(data[`guest${number}Email`] || "").trim().toLowerCase(),
      attending: String(data[`guest${number}Attending`] || "").trim(),
      starter: String(data[`guest${number}Starter`] || "").trim(),
      main: String(data[`guest${number}Main`] || "").trim()
    }))
    .filter(guest => guest.firstName || guest.lastName || guest.email);

  data.attending = guests.some(guest => guest.attending === "Yes") ? "Yes" : "No";
  data.guestCount = String(guests.filter(guest => guest.attending === "Yes").length);
  data.guestNames = guests.map(guest => [guest.firstName, guest.lastName].filter(Boolean).join(" ")).join(" | ");

  const songRequests = [data.song1, data.song2, data.song3]
    .map(value => String(value || "").trim())
    .filter(Boolean);
  data.song = songRequests.join(" | ");
  data.message = "";

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
    const duplicate = await checkDuplicate(endpoint, emailHash);

    if (duplicate) {
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
    status.textContent = "Your RSVP has been sent. Please check your inbox for confirmation.";
    status.className = "form-success";
  } catch (error) {
    console.error(error);
    status.textContent = "We could not verify or send your RSVP. Please check your connection and try again.";
    status.className = "form-error";
  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Send Your Reply <span>❧</span>';
  }
});

document.getElementById("closeThanks").addEventListener("click", () => {
  thanks.classList.remove("show");
});
