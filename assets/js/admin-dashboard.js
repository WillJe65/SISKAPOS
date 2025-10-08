// Logout function
function logout() {
  window.location.href = "dashboard.html";
}

// Mobile menu toggle
document.addEventListener("DOMContentLoaded", function () {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const sidebar = document.querySelector("aside");

  mobileMenuBtn.addEventListener("click", function () {
    sidebar.classList.toggle("hidden");
    sidebar.classList.toggle("fixed");
    sidebar.classList.toggle("top-0");
    sidebar.classList.toggle("left-0");
    sidebar.classList.toggle("h-full");
    sidebar.classList.toggle("z-30");
  });
});

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
});

// Charts
document.addEventListener("DOMContentLoaded", function () {
  // Grafik Status Gizi
  const giziCtx = document.getElementById("giziChart");
  if (giziCtx) {
    new Chart(giziCtx, {
      type: "bar",
      data: {
        labels: ["Normal", "Stunting", "Gizi Buruk"],
        datasets: [
          {
            label: "Jumlah Balita",
            data: [90, 20, 10],
            backgroundColor: [
              "rgba(16, 185, 129, 0.8)",
              "rgba(249, 115, 22, 0.8)",
              "rgba(239, 68, 68, 0.8)",
            ],
            borderColor: [
              "rgba(16, 185, 129, 1)",
              "rgba(249, 115, 22, 1)",
              "rgba(239, 68, 68, 1)",
            ],
            borderWidth: 2,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(16, 185, 129, 0.1)",
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }

  // Grafik Gender
  const genderCtx = document.getElementById("genderChart");
  if (genderCtx) {
    new Chart(genderCtx, {
      type: "doughnut",
      data: {
        labels: ["Laki-laki", "Perempuan"],
        datasets: [
          {
            data: [60, 60],
            backgroundColor: [
              "rgba(59, 130, 246, 0.8)",
              "rgba(236, 72, 153, 0.8)",
            ],
            borderColor: ["rgba(59, 130, 246, 1)", "rgba(236, 72, 153, 1)"],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        cutout: "60%",
      },
    });
  }
});
