// Fungsi navigasi
function goBack() {
  window.location.href = "/masyarakat-dashboard";
}

function logout() {
  if (confirm('Apakah Anda yakin ingin logout?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    
    window.location.href = "/login"; 
  }
}

/**
 * Mengubah string waktu "HH:MM:SS" menjadi "HH:MM"
 * @param {string} timeString - Cth: "09:30:00"
 * @returns {string} Cth: "09:30"
 */
function formatTime(timeString) {
  if (!timeString || typeof timeString !== 'string') return '';
  const parts = timeString.split(':');
  if (parts.length < 2) return timeString;
  return `${parts[0]}:${parts[1]}`;
}

/**
 * Mengubah string tanggal menjadi format "15 Sep 2025"
 * (Versi ini diubah agar tidak menampilkan jam)
 */
function formatDate(dateString) {
  if (!dateString) return "-";
  
  try {
    const date = new Date(dateString); 

    const options = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    };
    
    return new Intl.DateTimeFormat('id-ID', options).format(date);
  
  } catch (e) {
    console.error("Gagal memformat tanggal:", e, dateString);
    return dateString.split('T')[0]; 
  }
}

/**
 * Mengisi data jadwal ke kartu "Jadwal Berikutnya" dan tabel "Jadwal Posyandu"
 */
function populateJadwal(schedules) {
  if (!Array.isArray(schedules)) {
    schedules = [];
  }

  const confirmedSchedules = schedules.filter(s => s.status === 'Terkonfirmasi');

  // Logika untuk "Jadwal Berikutnya"
  const nextScheduleCard = document.getElementById("next-schedule-card-content");
  if (nextScheduleCard) {
    
    const now = new Date(); 

    const futureSchedules = confirmedSchedules
      .filter(s => {
        if (!s.tanggal) return false; 
        const scheduleDate = new Date(s.tanggal); 
        return !isNaN(scheduleDate) && scheduleDate >= now; 
      })
      .sort((a, b) => {
        const timeA = new Date(a.tanggal).getTime();
        const timeB = new Date(b.tanggal).getTime();
        if (isNaN(timeA)) return 1;
        if (isNaN(timeB)) return -1;
        return timeA - timeB; 
      });

    if (futureSchedules.length > 0) {
      const nextSchedule = futureSchedules[0]; 
      
      const scheduleDateStr = formatDate(nextSchedule.tanggal);
      const startTimeStr = formatTime(nextSchedule.waktu_mulai);
      const endTimeStr = formatTime(nextSchedule.waktu_selesai);
      
      nextScheduleCard.innerHTML = `
        <p class="text-green-800 font-semibold">${scheduleDateStr}, ${startTimeStr} - ${endTimeStr} WIB</p>
        <p class="text-green-600" id="next-schedule-location">${nextSchedule.lokasi || '-'}</p>
        <p class="text-sm text-green-500" id="next-schedule-service">${nextSchedule.layanan || 'Layanan Posyandu'}</p>
      `;
      
    } else {
      nextScheduleCard.innerHTML = `
        <p class="text-green-700 text-center">Belum ada jadwal berikutnya yang terkonfirmasi.</p>
      `;
    }
  }

  // Logika untuk Tabel "Jadwal Posyandu"
  const tableBody = document.getElementById("jadwal-table-body");
  if (tableBody) {
    tableBody.innerHTML = ""; 

    if (confirmedSchedules.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="3" class="px-6 py-4 text-center text-sm text-green-600">
            Belum ada jadwal terkonfirmasi.
          </td>
        </tr>
      `;
    } else {
      const sortedForTable = [...confirmedSchedules].sort((a, b) => {
        const timeA = new Date(a.tanggal).getTime() || 0;
        const timeB = new Date(b.tanggal).getTime() || 0;
        return timeB - timeA;
      });

      sortedForTable.forEach(s => {
        if (!s.tanggal) return; 

        const scheduleDateStr = formatDate(s.tanggal);
        const startTimeStr = formatTime(s.waktu_mulai);
        const endTimeStr = formatTime(s.waktu_selesai);

        const row = `
          <tr class="hover:bg-green-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-800">
              ${scheduleDateStr}, ${startTimeStr} - ${endTimeStr} WIB
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">
              ${s.lokasi || '-'}
            </td>
            <td class="px-6 py-4 text-sm text-green-600">
              ${s.layanan || '-'}
            </td>
          </tr>
        `;
        tableBody.innerHTML += row;
      });
    }
  }
}

// Mobile menu toggle
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

// Intersection Observer for fade-in animations
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
    alert("Sesi Anda telah berakhir. Silakan login kembali.");
    window.location.href = "/login"; 
    return; 
  }

  // Fetch Riwayat Anak
  try {
    const res = await fetch(`http://168.231.119.61/api/accounts/${userId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Gagal mengambil data riwayat.");

    const data = await res.json();

    if (data.length === 0) {
      document.querySelector(".bg-blue-50 .text-blue-800").textContent = "N/A";
      document.querySelector(".bg-blue-50 .text-blue-600").textContent = "Berat: N/A";
      document.querySelector(".bg-blue-50 .text-sm").textContent = "Tinggi: N/A";
      document.querySelector(".bg-purple-50 .text-2xl").textContent = "N/A";
      document.querySelector(".bg-purple-50 .text-lg").textContent = "N/A";
      document.querySelector(".bg-green-50 .text-2xl").textContent = "N/A";
      document.querySelector(".bg-green-50 .text-lg").textContent = "N/A";
    } else {
      const sortedData = data.sort((a, b) => new Date(b.tanggal_periksa) - new Date(a.tanggal_periksa));
      const latest = sortedData[0]; 

      document.querySelector(".bg-blue-50 .text-blue-800").textContent = latest.status_gizi || "N/A";
      document.querySelector(".bg-blue-50 .text-blue-600").textContent = `Berat: ${latest.berat_badan_kg} kg`;
      document.querySelector(".bg-blue-50 .text-sm").textContent = `Tinggi: ${latest.tinggi_badan_cm} cm`;

      const heightStatusEl = document.querySelector(".bg-purple-50 .text-lg.font-semibold");
      const weightStatusEl = document.querySelector(".bg-green-50 .text-lg.font-semibold");

      document.querySelector(".bg-purple-50 .text-2xl").textContent = `${latest.tinggi_badan_cm} cm`;
      document.querySelector(".bg-green-50 .text-2xl").textContent = `${latest.berat_badan_kg} kg`;

      heightStatusEl.classList.remove("text-purple-700");
      weightStatusEl.classList.remove("text-green-700");

      if (sortedData.length > 1) {
        const previous = sortedData[1];
        
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

        if (parseFloat(latest.tinggi_badan_cm) > parseFloat(previous.tinggi_badan_cm)) {
          heightStatusEl.textContent = "Meningtingkat";
          heightStatusEl.classList.add("text-green-700");
        } else if (parseFloat(latest.tinggi_badan_cm) < parseFloat(previous.tinggi_badan_cm)) {
          heightStatusEl.textContent = "Menurun";
          heightStatusEl.classList.add("text-red-700");
        } else {
          heightStatusEl.textContent = "Tetap";
          heightStatusEl.classList.add("text-gray-700");
        }
      } else {
        weightStatusEl.textContent = "Data Pertama";
        weightStatusEl.classList.add("text-gray-700");
        heightStatusEl.textContent = "Data Pertama";
        heightStatusEl.classList.add("text-gray-700");
      }

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

      const weightCtx = document.getElementById("beratChart");
      const heightCtx = document.getElementById("tinggiChart");

      if (Chart.getChart(weightCtx)) Chart.getChart(weightCtx).destroy();
      if (Chart.getChart(heightCtx)) Chart.getChart(heightCtx).destroy();

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
    }
    
  } catch (err) {
    console.error("Gagal memuat data dashboard (riwayat):", err);
    document.querySelector(".bg-blue-50 .text-blue-800").textContent = "Error";
    document.querySelector(".bg-blue-50 .text-blue-600").textContent = "Gagal";
    document.querySelector(".bg-blue-50 .text-sm").textContent = "Muat Data";
  }

  // Fetch Jadwal
  try {
    const scheduleRes = await fetch(`http://168.231.119.61/api/jadwal`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!scheduleRes.ok) {
        throw new Error("Gagal mengambil data jadwal.");
    }
    
    const scheduleData = await scheduleRes.json();
    
    if (scheduleData.success && Array.isArray(scheduleData.data)) {
        populateJadwal(scheduleData.data); 
    } else {
        throw new Error("Format data jadwal tidak valid.");
    }
    
  } catch (err) {
    console.error("Gagal memuat jadwal:", err);
    const tableBody = document.getElementById("jadwal-table-body");
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-center text-sm text-red-600">Gagal memuat jadwal.</td></tr>`;
    }
    const nextScheduleCard = document.getElementById("next-schedule-card-content");
    if (nextScheduleCard) {
      nextScheduleCard.innerHTML = `<p class="text-red-700 text-center">Gagal memuat jadwal.</p>`;
    }
  }
});