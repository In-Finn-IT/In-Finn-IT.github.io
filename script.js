const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav-list");

toggle.addEventListener("click", () => {
  nav.classList.toggle("open");
});

//Kontaktdaten
document.addEventListener("DOMContentLoaded", () => {
  const user = "mack.katrin83";
  const domain = "gmail.com";
  const email = `${user}@${domain}`;

  const emailLink = document.createElement("a");
  emailLink.href = `mailto:${email}`;
  emailLink.textContent = email;

  const emailContainer = document.getElementById("email");
  emailContainer.appendChild(emailLink);
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
