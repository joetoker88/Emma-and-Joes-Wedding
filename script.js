const weddingDate = new Date("2027-07-24T13:00:00+01:00");

const gate = document.getElementById("invitationGate");
const openInvitation = document.getElementById("openInvitation");
const body = document.body;

function unlockInvitation() {
  gate.classList.add("opened");
  body.classList.remove("invitation-locked");
  sessionStorage.setItem("evergreenInvitationOpened", "true");
  setTimeout(() => document.querySelector(".hero .reveal")?.classList.add("visible"), 220);
}

openInvitation.addEventListener("click", unlockInvitation);

if (sessionStorage.getItem("evergreenInvitationOpened") === "true") {
  gate.classList.add("opened");
  body.classList.remove("invitation-locked");
}

const header = document.getElementById("siteHeader");
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 45);
}, { passive: true });

const navToggle = document.getElementById("navToggle");
const primaryNav = document.getElementById("primaryNav");

navToggle.addEventListener("click", () => {
  const open = primaryNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});

primaryNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    primaryNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

function updateCountdown() {
  const now = new Date();
  let diff = weddingDate - now;

  if (diff <= 0) {
    document.getElementById("countdown").hidden = true;
    document.getElementById("weddingDayMessage").hidden = false;
    return;
  }

  const days = Math.floor(diff / 86400000);
  diff %= 86400000;
  const hours = Math.floor(diff / 3600000);
  diff %= 3600000;
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  document.getElementById("days").textContent = String(days).padStart(3, "0");
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(element => revealObserver.observe(element));

const rsvpForm = document.getElementById("rsvpForm");
const thankYou = document.getElementById("thankYou");
const thankYouTitle = document.getElementById("thankYouTitle");
const closeThankYou = document.getElementById("closeThankYou");

rsvpForm.addEventListener("submit", async event => {
  event.preventDefault();

  const submitButton = document.getElementById("submitRsvp");
  const formStatus = document.getElementById("formStatus");
  const endpoint = window.EVERGREEN_CONFIG?.RSVP_ENDPOINT?.trim();
  const formData = Object.fromEntries(new FormData(rsvpForm).entries());

  formData.submittedAt = new Date().toISOString();
  formData.pageUrl = window.location.href;
  formData.userAgent = navigator.userAgent;

  if (!endpoint || endpoint.includes("PASTE_YOUR_")) {
    formStatus.textContent = "RSVP setup is not complete yet. Please contact Emma or Joe directly.";
    formStatus.classList.add("form-error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Sending…";
  formStatus.textContent = "Sending your reply…";
  formStatus.classList.remove("form-error", "form-success");

  try {
    // Apps Script Web Apps do not expose a conventional CORS response.
    // no-cors still sends the RSVP successfully to the Google Sheet.
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(formData)
    });

    // Keep a local backup in case the guest briefly loses connectivity.
    const saved = JSON.parse(localStorage.getItem("projectEvergreenRsvps") || "[]");
    saved.push(formData);
    localStorage.setItem("projectEvergreenRsvps", JSON.stringify(saved));

    thankYouTitle.textContent = formData.attending === "Yes"
      ? "We cannot wait to celebrate with you."
      : "Thank you for letting us know.";

    formStatus.textContent = "Your RSVP has been sent.";
    formStatus.classList.add("form-success");
    thankYou.classList.add("show");
    thankYou.setAttribute("aria-hidden", "false");
    launchConfetti();
    rsvpForm.reset();
  } catch (error) {
    console.error("RSVP submission failed:", error);
    formStatus.textContent = "We could not send your RSVP. Please check your connection and try again.";
    formStatus.classList.add("form-error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send RSVP";
  }
});

closeThankYou.addEventListener("click", () => {
  thankYou.classList.remove("show");
  thankYou.setAttribute("aria-hidden", "true");
});

function launchConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const pieces = Array.from({ length: 100 }, () => ({
    x: Math.random() * innerWidth,
    y: -20 - Math.random() * innerHeight * 0.25,
    w: 5 + Math.random() * 7,
    h: 8 + Math.random() * 11,
    vy: 2 + Math.random() * 4,
    vx: -1.5 + Math.random() * 3,
    rotation: Math.random() * Math.PI,
    vr: -0.12 + Math.random() * 0.24,
    tone: Math.floor(Math.random() * 4)
  }));

  const palette = ["#b59657", "#7d927b", "#f0d7d8", "#fffdf8"];
  let frame = 0;

  function draw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = palette[p.tone];
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < 260) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
  draw();
}

const leafSecret = document.getElementById("leafSecret");
const projectPanel = document.getElementById("projectPanel");
const closePanel = document.getElementById("closePanel");

function updateSavedCount() {
  const saved = JSON.parse(localStorage.getItem("projectEvergreenRsvps") || "[]");
  document.getElementById("savedCount").textContent = saved.length;
}

leafSecret.addEventListener("click", () => {
  updateSavedCount();
  projectPanel.classList.add("show");
  projectPanel.setAttribute("aria-hidden", "false");
});

closePanel.addEventListener("click", () => {
  projectPanel.classList.remove("show");
  projectPanel.setAttribute("aria-hidden", "true");
});

// Personalised links: ?guest=John
const guest = new URLSearchParams(window.location.search).get("guest");
if (guest) {
  const safeGuest = guest.replace(/[<>]/g, "").trim().slice(0, 40);
  if (safeGuest) {
    const note = document.querySelector(".tiny-note");
    note.textContent = `Welcome, ${safeGuest}. Your invitation is ready.`;
  }
}
