// Logout function
function logout() {
  window.location.href = "dashboard.html";
}

// Mobile menu toggle
document.addEventListener("DOMContentLoaded", function () {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const sidebar = document.querySelector("aside");

  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener("click", function () {
      sidebar.classList.toggle("hidden");
      sidebar.classList.toggle("fixed");
      sidebar.classList.toggle("top-0");
      sidebar.classList.toggle("left-0");
      sidebar.classList.toggle("h-full");
      sidebar.classList.toggle("z-30");
    });
  }
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
  // Grafik Riwayat Imunisasi
  const imunisasiCtx = document.getElementById("imunisasiChart");
  if (imunisasiCtx) {
    new Chart(imunisasiCtx, {
      type: "line",
      data: {
        labels: ["0 Bulan", "2 Bulan", "4 Bulan", "6 Bulan", "9 Bulan"],
        datasets: [
          {
            label: "Jumlah Imunisasi",
            data: [1, 2, 3, 4, 5],
            borderColor: "rgba(59, 130, 246, 1)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgba(59, 130, 246, 1)",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
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
            max: 6,
            grid: {
              color: "rgba(59, 130, 246, 0.1)",
            },
            ticks: {
              stepSize: 1,
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

  // KODE BARU: Grafik Perkembangan Tinggi Badan
  const tinggiCtx = document.getElementById("tinggiChart"); // Menggunakan ID baru
  if (tinggiCtx) {
    new Chart(tinggiCtx, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"],
        datasets: [
          {
            label: "Tinggi Badan (cm)",
            data: [75.7, 77.0, 78.2, 79.5, 80.8, 82.0], // Data tinggi badan (contoh)
            borderColor: "rgba(124, 58, 237, 1)",
            backgroundColor: "rgba(124, 58, 237, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgba(124, 58, 237, 1)",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
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
            beginAtZero: false, // Tinggi badan tidak mulai dari 0
            grid: {
              color: "rgba(167, 139, 250, 0.1)",
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

  // Grafik Perkembangan Berat Badan
  const beratCtx = document.getElementById("beratChart");
  if (beratCtx) {
    new Chart(beratCtx, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"],
        datasets: [
          {
            label: "Berat Badan (kg)",
            data: [10.2, 10.8, 11.2, 11.8, 12.1, 12.5],
            borderColor: "rgba(16, 185, 129, 1)",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgba(16, 185, 129, 1)",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
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
});
