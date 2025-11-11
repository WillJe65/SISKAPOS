// Navigation functions
function goBack() {
  window.location.href = "masyarakat_dashboard.html";
}

function logout() {
  window.location.href = "login.html";
}

/* --------------------------
   FUNGSI HELPER
   -------------------------- */
   
/**
 * Mengubah string tanggal YYYY-MM-DD menjadi format "15 Sep 2025, 09:30 WIB"
 * @param {string} dateString - String tanggal dari database (format ISO/UTC)
 * @returns {string} Tanggal dan waktu yang sudah diformat
 */
function formatDate(dateString) {
  if (!dateString) return "-";
  
  try {
    const date = new Date(dateString); 

    const options = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
      hour12: false
    };
    
    let formattedDate = new Intl.DateTimeFormat('id-ID', options).format(date);
    
    formattedDate = formattedDate.replace('pukul ', '');
    formattedDate = formattedDate.replace('.', ':');     
    
    return formattedDate + " WIB";
  
  } catch (e) {
    console.error("Gagal memformat tanggal:", e, dateString);
    return dateString.split('T')[0]; 
  }
}

/**
 * Menghitung selisih waktu dari sekarang (misal: "3 minggu yang lalu")
 * @param {string} dateString - String tanggal dari database (format: YYYY-MM-DD)
 * @returns {string} Waktu relatif
 */
function timeAgo(dateString) {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    const now = new Date();
    
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 0) {
      return "Baru saja";
    }

    if (seconds < 60) return "Baru saja";
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return "1 menit yang lalu";
    if (minutes < 60) return `${minutes} menit yang lalu`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "1 jam yang lalu";
    if (hours < 24) return `${hours} jam yang lalu`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "Kemarin";
    if (days < 7) return `${days} hari yang lalu`;
    
    const weeks = Math.floor(days / 7);
    if (weeks === 1) return "1 minggu yang lalu";
    if (weeks < 5) return `${weeks} minggu yang lalu`;
    
    const months = Math.floor(days / 30.44);
    if (months === 1) return "1 bulan yang lalu";
    if (months < 12) return `${months} bulan yang lalu`;
    
    const years = Math.floor(days / 365.25);
    if (years === 1) return "1 tahun yang lalu";
    return `${years} tahun yang lalu`;

  } catch (e) {
    console.error("Gagal menghitung timeAgo:", e, dateString);
    return "-";
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

/* --------------------------
   LOAD RIWAYAT ANTROPOMETRI (Termasuk Chart Dinamis)
   -------------------------- */
document.addEventListener("DOMContentLoaded", async function () {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const tbody = document.getElementById("riwayatTableBody");

  if (!tbody) {
    console.log("Bukan halaman riwayat, proses load data riwayat dihentikan.");
    return; 
  }

  if (!token || !userId) {
    alert("Sesi login berakhir. Silakan login kembali.");
    window.location.href = "login.html";
    return;
  }

  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-green-600">Memuat data riwayat...</td></tr>`;

  try {
    const res = await fetch(`http://localhost:5000/api/accounts/${userId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Gagal mengambil data riwayat antropometri.");
    }

    const data = await res.json();
    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-green-600">Belum ada data pengukuran</td></tr>`;
      
      document.querySelector(".bg-green-50 .text-green-800").textContent = "N/A";
      document.querySelector(".bg-purple-50 .text-purple-800").textContent = "N/A";
      document.querySelector(".bg-purple-50 .text-sm.text-purple-600").textContent = "Belum ada data";
      document.querySelector(".bg-blue-50 .text-2xl.font-bold").textContent = 0;
      return;
    }

    const sortedData = data.sort((a, b) => new Date(b.tanggal_periksa) - new Date(a.tanggal_periksa));
    const latest = sortedData[0];

    document.querySelector(".bg-green-50 .text-green-800").textContent = latest.status_gizi || "N/A";
    document.querySelector(".bg-purple-50 .text-purple-800").textContent = formatDate(latest.tanggal_periksa);
    document.querySelector(".bg-purple-50 .text-sm.text-purple-600").textContent = timeAgo(latest.tanggal_periksa);
    document.querySelector(".bg-blue-50 .text-2xl.font-bold").textContent = sortedData.length;

    sortedData.forEach((item) => {
      const tr = document.createElement("tr");
      tr.classList.add("hover:bg-green-50", "transition-colors");
      tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-800">
          ${formatDate(item.tanggal_periksa)}
        </td>
        <td class."px-6 py-4 whitespace-nowrap text-sm text-green-600">${item.umur_bulan_saat_periksa}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">${item.berat_badan_kg}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">${item.tinggi_badan_cm}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">${item.lingkar_kepala_cm ?? '-'}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.status_gizi?.toLowerCase().includes("normal")
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }">${item.status_gizi || 'N/A'}</span>
        </td>`;
      tbody.appendChild(tr);
    });

    // === GRAFIK DINAMIS ===
    const weightCtxEl = document.getElementById("weightChart");
    const heightCtxEl = document.getElementById("heightChart");

    let oldWeightChart = Chart.getChart(weightCtxEl);
    if (oldWeightChart) {
      oldWeightChart.destroy();
    }
    let oldHeightChart = Chart.getChart(heightCtxEl);
    if (oldHeightChart) {
      oldHeightChart.destroy();
    }

    const chartData = [...sortedData].reverse();
    const chartLabels = chartData.map((d) => formatDate(d.tanggal_periksa));

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: false, grid: { color: "rgba(16, 185, 129, 0.1)" } },
        x: { grid: { display: false } },
      },
    };

    new Chart(weightCtxEl, {
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
      options: chartOptions,
    });

    new Chart(heightCtxEl, {
      type: "line",
      data: {
        labels: chartLabels,
        datasets: [{
          label: "Tinggi Badan (cm)",
          data: chartData.map((d) => d.tinggi_badan_cm),
          borderColor: "rgba(59, 130, 246, 1)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "rgba(59, 130, 246, 1)",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 6,
        }],
      },
      options: {
        ...chartOptions,
        scales: {
          ...chartOptions.scales,
          y: {
            ...chartOptions.scales.y,
            grid: { color: "rgba(59, 130, 246, 0.1)" },
          },
        },
      },
    });

  } catch (err) {
    console.error("Gagal memuat riwayat:", err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-600">Gagal memuat data. ${err.message}</td></tr>`;
    document.querySelector(".bg-green-50 .text-green-800").textContent = "Error";
    document.querySelector(".bg-purple-50 .text-purple-800").textContent = "Error";
    document.querySelector(".bg-purple-50 .text-sm.text-purple-600").textContent = err.message;
    document.querySelector(".bg-blue-50 .text-2xl.font-bold").textContent = 0;
  }
});