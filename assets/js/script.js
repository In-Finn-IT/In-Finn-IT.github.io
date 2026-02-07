const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav-list");

function openMenu() {
  nav.classList.add("open");
  toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-label", "Menü schließen");

  // Fokus auf ersten Link
  const firstLink = nav.querySelector("a");
  firstLink?.focus();
}

function closeMenu() {
  nav.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Menü öffnen");
}

toggle.addEventListener("click", () => {
  const isOpen = nav.classList.contains("open");
  isOpen ? closeMenu() : openMenu();
});

// ESC schließt Menü
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("open")) {
    closeMenu();
    toggle.focus();
  }
});

// Klick auf Link schließt Menü
nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => closeMenu());
});

// Klick außerhalb schließt Menü (mobile)
document.addEventListener("click", (e) => {
  if (!nav.classList.contains("open")) return;
  const clickedInside = nav.contains(e.target) || toggle.contains(e.target);
  if (!clickedInside) closeMenu();
});


// Scroll Fade-In Animation

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.2
  }
);

document.querySelectorAll(".fade-in").forEach((element) => {
  observer.observe(element);

});





