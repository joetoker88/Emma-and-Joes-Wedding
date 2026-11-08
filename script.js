
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
