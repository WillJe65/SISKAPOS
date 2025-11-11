function logout() {
  window.location.href = "dashboard.html";
}

let giziChartInstance = null;
let genderChartInstance = null;

/**
 * Fungsi utama untuk memuat semua data dashboard
 */
async function loadDashboardData() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Sesi Anda telah berakhir. Silakan login kembali.');
    window.location.href = 'login.html';
    return;
  }

  try {
    const [accountResponse, jadwalResponse] = await Promise.all([
      fetch('http://localhost:5000/api/accounts?limit=10000', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('http://localhost:5000/api/jadwal', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    if (accountResponse.status === 401) {
       alert('Sesi Anda tidak valid. Silakan login kembali.');
       localStorage.removeItem('token');
       window.location.href = 'login.html';
       return;
    }
    
    if (!accountResponse.ok) {
      throw new Error(`Gagal mengambil data akun: ${accountResponse.statusText}`);
    }
    const { data: accountData, pagination } = await accountResponse.json();
    const stats = processAccountData(accountData);
    updateStatCards(stats, pagination.totalRecords);
    updateCharts(stats);

    if (!jadwalResponse.ok) {
      console.error(`Gagal mengambil data jadwal: ${jadwalResponse.statusText}`);
      populateJadwalTable(null, true);
    } else {
      const { data: jadwalData, success: jadwalSuccess } = await jadwalResponse.json();
      if (jadwalSuccess && Array.isArray(jadwalData)) {
        const recentSchedules = jadwalData.slice(0, 3);
        populateJadwalTable(recentSchedules, false);
      } else {
        throw new Error('Format data jadwal tidak sesuai.');
      }
    }

  } catch (error) {
    console.error('Error memuat data dashboard:', error);
    alert('Gagal memuat data statistik. Data yang ditampilkan mungkin tidak update.');
    
    populateJadwalTable(null, true);
  }
}


/**
 * Mengisi tabel jadwal di dashboard
 * @param {Array | null} schedules - Array data jadwal (sudah dislice) atau null jika error
 * @param {boolean} isError - Tandai true jika terjadi error fetch
 */
function populateJadwalTable(schedules, isError = false) {
  const tableBody = document.getElementById('dashboardJadwalBody');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (isError) {
    tableBody.innerHTML = 
      '<tr><td colspan="3" class="px-6 py-4 text-center text-sm text-red-600">Gagal memuat jadwal terbaru.</td></tr>';
    return;
  }
  
  if (!schedules || schedules.length === 0) {
    tableBody.innerHTML = 
      '<tr><td colspan="3" class="px-6 py-4 text-center text-sm text-green-600">Belum ada jadwal terbaru.</td></tr>';
    return;
  }

  schedules.forEach(s => {
    const formattedDate = new Date(s.tanggal).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const row = `
      <tr class="hover:bg-green-50 transition-colors">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-800">
          ${formattedDate}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">
          ${s.lokasi}
        </td>
        <td class="px-6 py-4 text-sm text-green-600">
          ${s.layanan || 'Layanan Umum'}
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
}

/**
 * Memproses array data akun menjadi objek statistik
 * @param {Array} accounts - Array objek akun dari API
 * @returns {Object} Objek berisi statistik yang sudah dihitung
 */
function processAccountData(accounts) {
  // ... (Fungsi ini tidak berubah)
  const stats = {
    lakiLaki: 0,
    perempuan: 0,
    giziNormal: 0,
    giziStunting: 0,
    giziBuruk: 0,
    giziLebih: 0,
    tidakDiketahui: 0 
  };

  if (!Array.isArray(accounts)) {
     console.error("Data akun bukan array:", accounts);
     return stats;
  }

  for (const akun of accounts) {
    if (akun.jenis_kelamin === 'Laki-laki') {
      stats.lakiLaki++;
    } else if (akun.jenis_kelamin === 'Perempuan') {
      stats.perempuan++;
    }

    const statusGizi = String(akun.status_gizi).trim();

    switch (statusGizi) {
      case 'Normal':
        stats.giziNormal++;
        break;
      case 'Stunting':
      case 'Gizi Kurang':
        stats.giziStunting++;
        break;
      case 'Gizi Buruk':
        stats.giziBuruk++;
        break;
      case 'Gizi Lebih':
      case 'Obesitas':
        stats.giziLebih++;
        break;
      default:
        stats.tidakDiketahui++;
        break;
    }
  }
  return stats;
}

/**
 * Memperbarui teks di dalam card statistik dan di bawah chart
 * @param {Object} stats - Objek statistik dari processAccountData
 * @param {Number} totalRecords - Total akun dari pagination
 */
function updateStatCards(stats, totalRecords) {
  const elTotal = document.getElementById('stat-total-balita');
  const elNormal = document.getElementById('stat-status-normal');
  const elStunting = document.getElementById('stat-stunting');
  const elGiziLebihCard = document.getElementById('stat-gizi-lebih'); 
  const elChartNormal = document.getElementById('chart-val-normal');
  const elChartStunting = document.getElementById('chart-val-stunting');
  const elChartGiziBuruk = document.getElementById('chart-val-gizi-buruk');
  const elChartGiziLebih = document.getElementById('chart-val-gizi-lebih');
  const elChartLaki = document.getElementById('chart-val-laki');
  const elChartPerempuan = document.getElementById('chart-val-perempuan');

  if (elTotal) elTotal.textContent = totalRecords; 
  if (elNormal) elNormal.textContent = stats.giziNormal;
  if (elStunting) elStunting.textContent = stats.giziStunting;
  if (elGiziLebihCard) elGiziLebihCard.textContent = stats.giziLebih;

  if (elChartNormal) elChartNormal.textContent = stats.giziNormal;
  if (elChartStunting) elChartStunting.textContent = stats.giziStunting;
  if (elChartGiziBuruk) elChartGiziBuruk.textContent = stats.giziBuruk;
  if (elChartGiziLebih) elChartGiziLebih.textContent = stats.giziLebih;

  if (elChartLaki) elChartLaki.textContent = stats.lakiLaki;
  if (elChartPerempuan) elChartPerempuan.textContent = stats.perempuan;
}

/**
 * Memperbarui data pada instance Chart.js
 * @param {Object} stats - Objek statistik dari processAccountData
 */
function updateCharts(stats) {
  if (giziChartInstance) {
    giziChartInstance.data.labels = ['Normal', 'Stunting', 'Gizi Buruk', 'Gizi Lebih'];
    giziChartInstance.data.datasets[0].data = [
      stats.giziNormal, 
      stats.giziStunting, 
      stats.giziBuruk,
      stats.giziLebih
    ];

    giziChartInstance.data.datasets[0].backgroundColor = [
      'rgba(16, 185, 129, 0.8)',
      'rgba(249, 115, 22, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(99, 102, 241, 0.8)'
    ];
    giziChartInstance.data.datasets[0].borderColor = [
      'rgba(16, 185, 129, 1)',
      'rgba(249, 115, 22, 1)',
      'rgba(239, 68, 68, 1)',
      'rgba(99, 102, 241, 1)'
    ];
    giziChartInstance.update();
  }
  
  if (genderChartInstance) {
    genderChartInstance.data.datasets[0].data = [
      stats.lakiLaki, 
      stats.perempuan
    ];
    genderChartInstance.update();
  }
}

document.addEventListener("DOMContentLoaded", function () {

  /* --------------------------
     Mobile menu toggle
     -------------------------- */
  const mobileMenuBtn = document.getElementById("mobile-menu-btn") || document.querySelector("[data-mobile-menu-btn]");
  const sidebar = document.getElementById("mobile-sidebar") || document.querySelector("aside");
  
  if (mobileMenuBtn && sidebar) {
    try {
      if (!mobileMenuBtn.getAttribute("aria-controls")) {
        mobileMenuBtn.setAttribute("aria-controls", sidebar.id || "mobile-sidebar");
      }
    } catch (err) {}

    function isMobileView() { return window.innerWidth < 1024; } 

    function openMenu() {
      if (!isMobileView()) return;
      sidebar.classList.remove("hidden", "lg:block");
      sidebar.classList.add("transform", "translate-x-0", "fixed", "top-0", "left-0", "h-full", "z-30");
      document.documentElement.classList.add("overflow-hidden");
      mobileMenuBtn.setAttribute("aria-expanded", "true");
    }

    function closeMenu() {
      if (!isMobileView()) return;
      sidebar.classList.add("hidden");
      sidebar.classList.remove("transform", "translate-x-0", "fixed", "top-0", "left-0", "h-full", "z-30");
      document.documentElement.classList.remove("overflow-hidden");
      mobileMenuBtn.setAttribute("aria-expanded", "false");
    }

    function resetSidebarState() {
      if (isMobileView()) {
        sidebar.classList.add("hidden");
        sidebar.classList.remove("transform", "translate-x-0", "fixed", "top-0", "left-0", "h-full", "z-30", "lg:block");
        document.documentElement.classList.remove("overflow-hidden");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
      } else {
        sidebar.classList.remove("hidden", "transform", "translate-x-0", "fixed", "top-0", "left-0", "h-full", "z-30");
        sidebar.classList.add("lg:block");
        document.documentElement.classList.remove("overflow-hidden");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
      }
    }

    if (!sidebar.id) {
      sidebar.id = "mobile-sidebar";
      mobileMenuBtn.setAttribute("aria-controls", sidebar.id);
    }
    
    if(sidebar.classList.contains("lg:block")) {
        resetSidebarState();
    }

    let resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resetSidebarState, 250);
    });

    mobileMenuBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (!isMobileView()) return;
      const isHidden = sidebar.classList.contains("hidden");
      if (isHidden) openMenu();
      else closeMenu();
    });

    document.addEventListener("click", function (e) {
      if (isMobileView() && !sidebar.classList.contains("hidden")) {
        if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
          closeMenu();
        }
      }
    });
    
    document.addEventListener("keydown", function (e) {
        if (isMobileView() && (e.key === "Escape" || e.key === "Esc") && !sidebar.classList.contains("hidden")) {
            closeMenu();
        }
    });

    sidebar.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        if (isMobileView()) closeMenu();
      });
    });
  } else {
    console.warn("[MobileMenu] Tombol menu atau sidebar tidak ditemukan.");
  }

  /* --------------------------
     Intersection Observer (Kode Asli)
     -------------------------- */
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

  /* --------------------------
     Charts (Kode Asli, Dimodifikasi)
     -------------------------- */
  
  loadDashboardData();

  const giziCtx = document.getElementById("giziChart");
  if (giziCtx) {
    giziChartInstance = new Chart(giziCtx, { 
      type: "bar",
      data: {
        labels: ["Normal", "Stunting", "Gizi Buruk", "Gizi Lebih"],
        datasets: [
          {
            label: "Jumlah Balita",
            data: [0, 0, 0, 0],
            backgroundColor: [
              "rgba(16, 185, 129, 0.8)",
              "rgba(249, 115, 22, 0.8)",
              "rgba(239, 68, 68, 0.8)",
              "rgba(99, 102, 241, 0.8)"
            ],
            borderColor: [
              "rgba(16, 185, 129, 1)",
              "rgba(249, 115, 22, 1)",
              "rgba(239, 68, 68, 1)",
              "rgba(99, 102, 241, 1)"
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
    genderChartInstance = new Chart(genderCtx, { 
      type: "doughnut",
      data: {
        labels: ["Laki-laki", "Perempuan"],
        datasets: [
          {
            data: [0, 0], 
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