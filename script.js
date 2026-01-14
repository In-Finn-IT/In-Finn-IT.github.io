const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav-list");

toggle.addEventListener("click", () => {
  nav.classList.toggle("open");
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