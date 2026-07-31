const menu = document.getElementById("menu");
const nav = document.getElementById("nav");
menu.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menu.setAttribute("aria-expanded", String(open));
});
document.querySelectorAll("#nav a").forEach(link => {
  link.addEventListener("click", () => nav.classList.remove("open"));
});

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

  if (!endpoint) {
    status.textContent = "RSVP setup is incomplete.";
    status.className = "form-error";
    return;
  }

  submit.disabled = true;
  submit.innerHTML = "Sending…";
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
    submit.innerHTML = 'Send Your Reply <span>❧</span>';
  }
});

document.getElementById("closeThanks").addEventListener("click", () => {
  thanks.classList.remove("show");
});

const guest = new URLSearchParams(location.search).get("guest");
if (guest && form.elements.name) {
  form.elements.name.value = guest.replace(/[<>]/g, "").trim().slice(0, 60);
}
