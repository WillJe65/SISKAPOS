// Navigation to login page
function navigateToLogin() {
  window.location.href = "login.html";
}

// Smooth scroll to info section
function scrollToInfo() {
  document.getElementById("info").scrollIntoView({
    behavior: "smooth",
  });
}

// Intersection Observer for fade-in animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, observerOptions);

// Observe all fade-in elements
document.addEventListener("DOMContentLoaded", function () {
  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((el) => {
    observer.observe(el);
  });

  // Add smooth scroll behavior
  document.documentElement.style.scrollBehavior = "smooth";
});

// Add loading effect to images
document.addEventListener("DOMContentLoaded", function () {
  const images = document.querySelectorAll("img");
  images.forEach((img) => {
    img.addEventListener("load", function () {
      this.classList.remove("image-loading");
    });

    if (!img.complete) {
      img.classList.add("image-loading");
    }
  });
});

// Header scroll effect
window.addEventListener("scroll", function () {
  const header = document.querySelector("header");
  if (window.scrollY > 100) {
    header.classList.add("shadow-lg");
    header.style.background = "rgba(255, 255, 255, 0.95)";
  } else {
    header.classList.remove("shadow-lg");
    header.style.background = "rgba(255, 255, 255, 0.90)";
  }
});
