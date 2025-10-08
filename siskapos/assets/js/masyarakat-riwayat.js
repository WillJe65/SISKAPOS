// Navigation functions
function goBack() {
  window.location.href = "masyarakat_dashboard.html";
}

function logout() {
  window.location.href = "beranda_umum.html";
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
  // Sample data - would be fetched from API in real application
  const weightData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep"],
    datasets: [
      {
        label: "Berat Badan (kg)",
        data: [9.8, 10.2, 10.5, 10.8, 11.2, 11.8, 12.1, 12.5],
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
  };

  const heightData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep"],
    datasets: [
      {
        label: "Tinggi Badan (cm)",
        data: [72, 74, 76, 78, 78.5, 80, 82, 83.5, 85],
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
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
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
  };

  // Weight Chart
  const weightCtx = document.getElementById("weightChart");
  if (weightCtx) {
    new Chart(weightCtx, {
      type: "line",
      data: weightData,
      options: chartOptions,
    });
  }

  // Height Chart
  const heightCtx = document.getElementById("heightChart");
  if (heightCtx) {
    new Chart(heightCtx, {
      type: "line",
      data: heightData,
      options: {
        ...chartOptions,
        scales: {
          ...chartOptions.scales,
          y: {
            ...chartOptions.scales.y,
            grid: {
              color: "rgba(59, 130, 246, 0.1)",
            },
          },
        },
      },
    });
  }
});
