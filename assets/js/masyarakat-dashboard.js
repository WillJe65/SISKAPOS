// Navigation functions
function goBack() {
  window.location.href = "masyarakat_dashboard.html";
}

function logout() {
  window.location.href = "login.html";
}

/**
 * Mengubah string tanggal YYYY-MM-DD menjadi format "15 Sep 2025"
 * @param {string} dateString - String tanggal dari database (format: YYYY-MM-DD)
 * @returns {string} Tanggal yang sudah diformat
 */
function formatDate(dateString) {
  if (!dateString) return "-";
  
  try {
    const parts = dateString.split('T')[0].split('-').map(Number);
    if (parts.length !== 3) throw new Error('Invalid date format');
    
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);

    const options = {
      day: 'numeric',   // 15
      month: 'short', // Sep
      year: 'numeric' // 2025
    };
    
    return new Intl.DateTimeFormat('id-ID', options).format(date);
  } catch (e) {
    console.error("Gagal memformat tanggal:", e, dateString);
    return dateString;
  }
}

/* --------------------------
   Mobile menu toggle
   -------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  const mobileMenuBtn =
    document.getElementById("mobile-menu-btn") ||
    document.querySelector("[data-mobile-menu-btn]");
  const sidebar =
    document.getElementById("mobile-sidebar") ||
    document.querySelector("aside");
  if (!mobileMenuBtn) {
    console.warn("[MobileMenu] Tombol mobile menu tidak ditemukan.");
    return;
  }
  if (!sidebar) {
    console.warn("[MobileMenu] Sidebar tidak ditemukan.");
    return;
  }
  try {
    const controls = mobileMenuBtn.getAttribute("aria-controls");
    if (!controls) {
      mobileMenuBtn.setAttribute(
        "aria-controls",
        sidebar.id || "mobile-sidebar"
      );
    }
  } catch (err) {}
  function isMobileView() {
    return window.innerWidth < 768;
  }
  function openMenu() {
    if (!isMobileView()) return;
    sidebar.classList.remove("hidden", "-translate-x-full");
    sidebar.classList.add("transform", "translate-x-0", "fixed", "top-0", "left-0", "h-full", "z-30");
    document.documentElement.classList.add("overflow-hidden");
    mobileMenuBtn.setAttribute("aria-expanded", "true");
  }
  function closeMenu() {
    if (!isMobileView()) return;
    sidebar.classList.add("hidden", "-translate-x-full");
    sidebar.classList.remove("translate-x-0", "fixed", "top-0", "left-0", "h-full", "z-30");
    document.documentElement.classList.remove("overflow-hidden");
    mobileMenuBtn.setAttribute("aria-expanded", "false");
  }
  function resetSidebarState() {
    if (isMobileView()) {
      sidebar.classList.add("hidden", "-translate-x-full", "transform");
      sidebar.classList.remove("translate-x-0", "fixed", "top-0", "left-0", "h-full", "z-30");
      document.documentElement.classList.remove("overflow-hidden");
      mobileMenuBtn.setAttribute("aria-expanded", "false");
    } else {
      sidebar.classList.remove("hidden", "-translate-x-full", "translate-x-0", "transform", "fixed", "top-0", "left-0", "h-full", "z-30");
      document.documentElement.classList.remove("overflow-hidden");
      mobileMenuBtn.setAttribute("aria-expanded", "false");
    }
  }
  if (!sidebar.id) {
    sidebar.id = "mobile-sidebar";
    mobileMenuBtn.setAttribute("aria-controls", sidebar.id);
  }
  resetSidebarState();
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resetSidebarState();
    }, 250);
  });
  mobileMenuBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (!isMobileView()) return;
    const isHidden =
      sidebar.classList.contains("hidden") ||
      sidebar.classList.contains("-translate-x-full");
    if (isHidden) {
      openMenu();
    } else {
      closeMenu();
    }
  });
  document.addEventListener("click", function (e) {
    if (!isMobileView()) return;
    if (!sidebar.classList.contains("hidden")) {
      if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        closeMenu();
      }
    }
  });
  document.addEventListener("keydown", function (e) {
    if (!isMobileView()) return;
    if (e.key === "Escape" || e.key === "Esc") {
      if (!sidebar.classList.contains("hidden")) {
        closeMenu();
      }
    }
  });
  const sidebarLinks = sidebar.querySelectorAll("a");
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (isMobileView()) {
        closeMenu();
      }
    });
  });
});

// Intersection Observer for fade-in animations (Kode asli)
document.addEventListener("DOMContentLoaded", function () {
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
  
  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((el) => {
    observer.observe(el);
  });
});


/* --------------------------
   LOAD DATA DINAMIS & CHARTS
   -------------------------- */
document.addEventListener("DOMContentLoaded", async function () {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    console.warn("User tidak login, data dashboard tidak dimuat.");
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/accounts/${userId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Gagal mengambil data riwayat.");

    const data = await res.json();

    // Menangani jika tidak ada data
    if (data.length === 0) {
      document.querySelector(".bg-blue-50 .text-blue-800").textContent = "N/A";
      document.querySelector(".bg-blue-50 .text-blue-600").textContent = "Berat: N/A";
      document.querySelector(".bg-blue-50 .text-sm").textContent = "Tinggi: N/A";
      document.querySelector(".bg-purple-50 .text-2xl").textContent = "N/A";
      document.querySelector(".bg-purple-50 .text-lg").textContent = "N/A";
      document.querySelector(".bg-green-50 .text-2xl").textContent = "N/A";
      document.querySelector(".bg-green-50 .text-lg").textContent = "N/A";
      return;
    }

    const sortedData = data.sort((a, b) => new Date(b.tanggal_periksa) - new Date(a.tanggal_periksa));
    const latest = sortedData[0]; // Data terbaru

    // --- 3. Update Kartu-Kartu ---
    
    // Kartu "Status Anak" (Tetap menunjukkan status gizi keseluruhan)
    document.querySelector(".bg-blue-50 .text-blue-800").textContent = latest.status_gizi || "N/A";
    document.querySelector(".bg-blue-50 .text-blue-600").textContent = `Berat: ${latest.berat_badan_kg} kg`;
    document.querySelector(".bg-blue-50 .text-sm").textContent = `Tinggi: ${latest.tinggi_badan_cm} cm`;

    // Ambil elemen status
    const heightStatusEl = document.querySelector(".bg-purple-50 .text-lg.font-semibold");
    const weightStatusEl = document.querySelector(".bg-green-50 .text-lg.font-semibold");

    // Update nilai terbaru
    document.querySelector(".bg-purple-50 .text-2xl").textContent = `${latest.tinggi_badan_cm} cm`;
    document.querySelector(".bg-green-50 .text-2xl").textContent = `${latest.berat_badan_kg} kg`;

    // Hapus kelas warna default
    heightStatusEl.classList.remove("text-purple-700");
    weightStatusEl.classList.remove("text-green-700");

    // Cek jika ada data pembanding (lebih dari 1 data)
    if (sortedData.length > 1) {
      const previous = sortedData[1]; // Data kedua terbaru
      
      // -- Cek Status Berat Badan --
      if (parseFloat(latest.berat_badan_kg) > parseFloat(previous.berat_badan_kg)) {
        weightStatusEl.textContent = "Meningkat";
        weightStatusEl.classList.add("text-green-700");
      } else if (parseFloat(latest.berat_badan_kg) < parseFloat(previous.berat_badan_kg)) {
        weightStatusEl.textContent = "Menurun";
        weightStatusEl.classList.add("text-red-700");
      } else {
        weightStatusEl.textContent = "Tetap";
        weightStatusEl.classList.add("text-gray-700");
      }

      // -- Cek Status Tinggi Badan --
      if (parseFloat(latest.tinggi_badan_cm) > parseFloat(previous.tinggi_badan_cm)) {
        heightStatusEl.textContent = "Meningkat";
        heightStatusEl.classList.add("text-green-700");
      } else if (parseFloat(latest.tinggi_badan_cm) < parseFloat(previous.tinggi_badan_cm)) {
        heightStatusEl.textContent = "Menurun";
        heightStatusEl.classList.add("text-red-700");
      } else {
        heightStatusEl.textContent = "Tetap";
        heightStatusEl.classList.add("text-gray-700");
      }

    } else {
      // Jika ini data pertama, tidak ada pembanding
      weightStatusEl.textContent = "Data Pertama";
      weightStatusEl.classList.add("text-gray-700");
      heightStatusEl.textContent = "Data Pertama";
      heightStatusEl.classList.add("text-gray-700");
    }

    // --- 4. Buat Grafik ---
    const chartData = [...sortedData].reverse();
    const chartLabels = chartData.map((d) => formatDate(d.tanggal_periksa));

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: false },
        x: { grid: { display: false } },
      },
    };

    const weightCtx = document.getElementById("beratChart"); //
    const heightCtx = document.getElementById("tinggiChart"); //

    if (Chart.getChart(weightCtx)) Chart.getChart(weightCtx).destroy();
    if (Chart.getChart(heightCtx)) Chart.getChart(heightCtx).destroy();

    // Grafik Berat Badan
    if (weightCtx) {
      new Chart(weightCtx, {
        type: "line",
        data: {
          labels: chartLabels,
          datasets: [{
            label: "Berat Badan (kg)",
            data: chartData.map((d) => d.berat_badan_kg),
            borderColor: "rgba(16, 185, 129, 1)",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgba(16, 185, 129, 1)",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
          }],
        },
        options: {
          ...chartOptions,
          scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, grid: { color: "rgba(16, 185, 129, 0.1)" } } }
        },
      });
    }

    // Grafik Tinggi Badan
    if (heightCtx) {
      new Chart(heightCtx, {
        type: "line",
        data: {
          labels: chartLabels,
          datasets: [{
            label: "Tinggi Badan (cm)",
            data: chartData.map((d) => d.tinggi_badan_cm),
            borderColor: "rgba(139, 92, 246, 1)",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgba(139, 92, 246, 1)",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
          }],
        },
        options: {
          ...chartOptions,
          scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, grid: { color: "rgba(139, 92, 246, 0.1)" } } }
        },
      });
    }

  } catch (err) {
    console.error("Gagal memuat data dashboard:", err);
    document.querySelector(".bg-blue-50 .text-blue-800").textContent = "Error";
    document.querySelector(".bg-blue-50 .text-blue-600").textContent = "Gagal";
    document.querySelector(".bg-blue-50 .text-sm").textContent = "Muat Data";
  }
});