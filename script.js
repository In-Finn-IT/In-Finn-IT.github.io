const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav-list");

toggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", isOpen);
  toggle.setAttribute(
    "aria-label",
    isOpen ? "Menü schließen" : "Menü öffnen"
  );
});


document.querySelectorAll(".nav-list a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  });
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





