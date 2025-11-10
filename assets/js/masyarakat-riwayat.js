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
 * Mengubah string tanggal YYYY-MM-DD menjadi format "15 Sep 2025"
 * @param {string} dateString - String tanggal dari database (format: YYYY-MM-DD)
 * @returns {string} Tanggal yang sudah diformat
 */
function formatDate(dateString) {
  if (!dateString) return "-";
  
  try {
    // Pastikan dateString adalah YYYY-MM-DD
    const parts = dateString.split('T')[0].split('-').map(Number);
    if (parts.length !== 3) throw new Error('Invalid date format');
    
    // JS Date() month adalah 0-indexed (Januari = 0)
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
    return dateString; // Tampilkan tanggal apa adanya jika gagal
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
    const parts = dateString.split('T')[0].split('-').map(Number);
    if (parts.length !== 3) throw new Error('Invalid date format');
    
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    const now = new Date();
    
    // Hitung selisih dalam detik
    // Kita set jam ke 00:00 agar perbandingan lebih adil per hari
    now.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const seconds = Math.floor((now - date) / 1000);
    const days = Math.floor(seconds / (60 * 60 * 24));

    if (days === 0) return "Hari ini";
    if (days === 1) return "Kemarin";
    if (days > 1 && days < 7) return `${days} hari yang lalu`;
    
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
    return "-"; // Fallback
  }
}


/* --------------------------
   Mobile menu toggle (Kode asli Anda, tidak diubah)
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

  // Jika elemen tabel tidak ada di halaman ini, hentikan fungsi
  if (!tbody) {
    console.log("Bukan halaman riwayat, proses load data riwayat dihentikan.");
    return; 
  }

  if (!token || !userId) {
    alert("Sesi login berakhir. Silakan login kembali.");
    window.location.href = "login.html";
    return;
  }

  // Tampilkan pesan loading di tabel
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
    tbody.innerHTML = ""; // Kosongkan tabel setelah data diterima

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-green-600">Belum ada data pengukuran</td></tr>`;
      
      // Set kartu ke nilai default
      document.querySelector(".bg-green-50 .text-green-800").textContent = "N/A";
      document.querySelector(".bg-purple-50 .text-purple-800").textContent = "N/A";
      document.querySelector(".bg-purple-50 .text-sm.text-purple-600").textContent = "Belum ada data";
      document.querySelector(".bg-blue-50 .text-2xl.font-bold").textContent = 0;
      return;
    }

    // Data ada, proses seperti sebelumnya
    
    // Sortir data (meskipun backend sudah, ini untuk jaminan)
    const sortedData = data.sort((a, b) => new Date(b.tanggal_periksa) - new Date(a.tanggal_periksa));
    const latest = sortedData[0]; // Data terbaru

    // Update kartu ringkasan
    document.querySelector(".bg-green-50 .text-green-800").textContent = latest.status_gizi || "N/A";
    document.querySelector(".bg-purple-50 .text-purple-800").textContent = formatDate(latest.tanggal_periksa);
    document.querySelector(".bg-purple-50 .text-sm.text-purple-600").textContent = timeAgo(latest.tanggal_periksa);
    document.querySelector(".bg-blue-50 .text-2xl.font-bold").textContent = sortedData.length;

    // Tampilkan ke tabel
    sortedData.forEach((item) => {
      const tr = document.createElement("tr");
      tr.classList.add("hover:bg-green-50", "transition-colors");
      tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-800">
          ${formatDate(item.tanggal_periksa)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">${item.umur_bulan_saat_periksa}</td>
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

    // Hancurkan chart lama jika ada (mencegah error duplikasi)
    let oldWeightChart = Chart.getChart(weightCtxEl);
    if (oldWeightChart) {
      oldWeightChart.destroy();
    }
    let oldHeightChart = Chart.getChart(heightCtxEl);
    if (oldHeightChart) {
      oldHeightChart.destroy();
    }

    // Balik urutan data untuk grafik (dari paling lama ke paling baru)
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

    // Grafik Berat Badan (Weight Chart)
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

    // Grafik Tinggi Badan (Height Chart)
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
    // Juga update kartu jika gagal
    document.querySelector(".bg-green-50 .text-green-800").textContent = "Error";
    document.querySelector(".bg-purple-50 .text-purple-800").textContent = "Error";
    document.querySelector(".bg-purple-50 .text-sm.text-purple-600").textContent = err.message;
    document.querySelector(".bg-blue-50 .text-2xl.font-bold").textContent = 0;
  }
});