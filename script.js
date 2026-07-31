const wedding = new Date("2027-07-24T13:00:00+01:00");
const gate = document.getElementById("gate");

document.getElementById("open").onclick = () => {
  gate.classList.add("open");
  document.body.classList.remove("locked");
  sessionStorage.opened = "1";
};

if (sessionStorage.opened) {
  gate.classList.add("open");
  document.body.classList.remove("locked");
}

addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 40));

menu.onclick = () => nav.classList.toggle("open");
document.querySelectorAll("nav a").forEach(link => {
  link.onclick = () => nav.classList.remove("open");
});

function tick() {
  let remaining = wedding - new Date();
  if (remaining < 0) return;

  days.textContent = String(Math.floor(remaining / 864e5)).padStart(3, "0");
  remaining %= 864e5;
  hours.textContent = String(Math.floor(remaining / 36e5)).padStart(2, "0");
  remaining %= 36e5;
  minutes.textContent = String(Math.floor(remaining / 6e4)).padStart(2, "0");
  seconds.textContent = String(Math.floor((remaining % 6e4) / 1e3)).padStart(2, "0");
}

tick();
setInterval(tick, 1000);

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(element => observer.observe(element));

const form = document.getElementById("form");
const submit = document.getElementById("submit");
const status = document.getElementById("status");
const thanks = document.getElementById("thanks");
const thanksTitle = document.getElementById("thanksTitle");

form.addEventListener("submit", async event => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const endpoint = window.EVERGREEN_CONFIG?.RSVP_ENDPOINT?.trim();
  const data = Object.fromEntries(new FormData(form).entries());

  data.submittedAt = new Date().toISOString();
  data.pageUrl = location.href;
  data.userAgent = navigator.userAgent;

  if (!endpoint || endpoint.includes("PASTE_YOUR_")) {
    status.textContent = "RSVP setup is incomplete. Please contact Emma or Joe.";
    status.className = "form-error";
    return;
  }

  submit.disabled = true;
  submit.textContent = "Sending…";
  status.textContent = "Sending your reply…";
  status.className = "";

  try {
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(data)
    });

    const saved = JSON.parse(localStorage.getItem("projectEvergreenRsvps") || "[]");
    saved.push(data);
    localStorage.setItem("projectEvergreenRsvps", JSON.stringify(saved));

    thanksTitle.textContent = data.attending === "Yes"
      ? "We cannot wait to celebrate with you."
      : "Thank you for letting us know.";

    thanks.classList.add("show");
    form.reset();
    status.textContent = "Your RSVP has been sent.";
    status.className = "form-success";
  } catch (error) {
    console.error(error);
    status.textContent = "We could not send your RSVP. Please check your connection and try again.";
    status.className = "form-error";
  } finally {
    submit.disabled = false;
    submit.textContent = "Send RSVP";
  }
});

closeThanks.onclick = () => thanks.classList.remove("show");

const guest = new URLSearchParams(location.search).get("guest");
if (guest) {
  form.elements.name.value = guest.replace(/[<>]/g, "").trim().slice(0, 60);
}
