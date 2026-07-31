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
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Duplicate check timed out."));
    }, 10000);

    function cleanup() {
      clearTimeout(timer);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = result => {
      cleanup();
      resolve(Boolean(result?.duplicate));
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Duplicate check failed."));
    };

    const separator = endpoint.includes("?") ? "&" : "?";
    script.src = `${endpoint}${separator}action=check&hash=${encodeURIComponent(emailHash)}&callback=${encodeURIComponent(callbackName)}`;
    document.body.appendChild(script);
  });
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const endpoint = window.EVERGREEN_CONFIG?.RSVP_ENDPOINT?.trim();
  const data = Object.fromEntries(new FormData(form).entries());

  data.email = String(data.email || "").trim().toLowerCase();
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

    thanks.classList.add("show");
    form.reset();
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
