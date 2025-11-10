// Logout function
function logout() {
  window.location.href = "dashboard.html";
}

/* --------------------------
   Mobile menu toggle (perbaikan untuk desktop & mobile)
   -------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  // Cari tombol menu mobile: id utama atau fallback ke attribute data
  const mobileMenuBtn =
    document.getElementById("mobile-menu-btn") ||
    document.querySelector("[data-mobile-menu-btn]");

  // Cari sidebar mobile: id utama atau fallback ke <aside>
  const sidebar =
    document.getElementById("mobile-sidebar") ||
    document.querySelector("aside");

  // Jika elemen tidak ditemukan, log peringatan dan hentikan (mempermudah debug)
  if (!mobileMenuBtn) {
    console.warn(
      "[MobileMenu] Tombol mobile menu tidak ditemukan. Harap pastikan ada id='mobile-menu-btn' atau attribute data-mobile-menu-btn."
    );
    return;
  }
  if (!sidebar) {
    console.warn(
      "[MobileMenu] Sidebar tidak ditemukan. Harap pastikan ada <aside id='mobile-sidebar'> atau setidaknya satu <aside> di DOM."
    );
    return;
  }

  // Pastikan attribute aria-controls ter-set (aksesibilitas)
  try {
    const controls = mobileMenuBtn.getAttribute("aria-controls");
    if (!controls) {
      mobileMenuBtn.setAttribute(
        "aria-controls",
        sidebar.id || "mobile-sidebar"
      );
    }
  } catch (err) {
    // safe-ignore
  }

  // Helper: cek apakah sedang di mobile view
  function isMobileView() {
    return window.innerWidth < 768; // md breakpoint Tailwind = 768px
  }

  // Helper: buka menu (hanya untuk mobile)
  function openMenu() {
    if (!isMobileView()) return; // Jangan manipulasi di desktop

    // Hapus class yang menyembunyikan dan tambahkan class untuk menampilkan sidebar
    sidebar.classList.remove("hidden", "-translate-x-full");
    // Tambahkan class posisi/animasi agar terlihat sebagai overlay pada mobile
    sidebar.classList.add(
      "transform",
      "translate-x-0",
      "fixed",
      "top-0",
      "left-0",
      "h-full",
      "z-30"
    );
    // Cegah scrolling halaman utama saat sidebar terbuka (UX)
    document.documentElement.classList.add("overflow-hidden");
    // Update aria-expanded untuk tombol
    mobileMenuBtn.setAttribute("aria-expanded", "true");
  }

  // Helper: tutup menu (hanya untuk mobile)
  function closeMenu() {
    if (!isMobileView()) return; // Jangan manipulasi di desktop

    // Sembunyikan kembali sidebar
    sidebar.classList.add("hidden", "-translate-x-full");
    sidebar.classList.remove(
      "translate-x-0",
      "fixed",
      "top-0",
      "left-0",
      "h-full",
      "z-30"
    );
    // Kembalikan ability scroll pada halaman
    document.documentElement.classList.remove("overflow-hidden");
    // Update aria-expanded
    mobileMenuBtn.setAttribute("aria-expanded", "false");
  }

  // Helper: reset sidebar state berdasarkan ukuran layar
  function resetSidebarState() {
    if (isMobileView()) {
      // Mode mobile: sidebar hidden by default
      sidebar.classList.add("hidden", "-translate-x-full", "transform");
      sidebar.classList.remove(
        "translate-x-0",
        "fixed",
        "top-0",
        "left-0",
        "h-full",
        "z-30"
      );
      document.documentElement.classList.remove("overflow-hidden");
      mobileMenuBtn.setAttribute("aria-expanded", "false");
    } else {
      // Mode desktop: sidebar visible, hapus semua class mobile
      sidebar.classList.remove(
        "hidden",
        "-translate-x-full",
        "translate-x-0",
        "transform",
        "fixed",
        "top-0",
        "left-0",
        "h-full",
        "z-30"
      );
      document.documentElement.classList.remove("overflow-hidden");
      mobileMenuBtn.setAttribute("aria-expanded", "false");
    }
  }

  // Inisialisasi state: jika sidebar belum punya id, beri id agar aria-controls konsisten
  if (!sidebar.id) {
    sidebar.id = "mobile-sidebar";
    mobileMenuBtn.setAttribute("aria-controls", sidebar.id);
  }

  // Set initial state berdasarkan ukuran layar saat load
  resetSidebarState();

  // Event: resize window - reset state sidebar
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resetSidebarState();
    }, 250); // Debounce 250ms
  });

  // Event: klik tombol toggle (hanya aktif di mobile)
  mobileMenuBtn.addEventListener("click", function (e) {
    e.stopPropagation();

    if (!isMobileView()) return; // Ignore di desktop

    const isHidden =
      sidebar.classList.contains("hidden") ||
      sidebar.classList.contains("-translate-x-full");
    if (isHidden) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  // Event: klik di luar sidebar akan menutup menu (UX mobile only)
  document.addEventListener("click", function (e) {
    if (!isMobileView()) return; // Ignore di desktop

    if (!sidebar.classList.contains("hidden")) {
      if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        closeMenu();
      }
    }
  });

  // Event: tombol Escape menutup menu (mobile only)
  document.addEventListener("keydown", function (e) {
    if (!isMobileView()) return; // Ignore di desktop

    if (e.key === "Escape" || e.key === "Esc") {
      if (!sidebar.classList.contains("hidden")) {
        closeMenu();
      }
    }
  });

  // Jika ada link di sidebar, menutup menu setelah klik (UX mobile only)
  const sidebarLinks = sidebar.querySelectorAll("a");
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
      // Tutup menu setelah navigasi (berguna di mobile)
      if (isMobileView()) {
        closeMenu();
      }
    });
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

// API functions for dashboard
async function getAuthToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

async function apiRequest(url, options = {}) {
  const token = await getAuthToken();
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const fullUrl = `http://localhost:5000${url}`;
  const response = await fetch(fullUrl, { ...defaultOptions, ...options });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// Load dashboard schedules
async function loadDashboardSchedules() {
  try {
    const response = await apiRequest('/api/jadwals?page=1&limit=5'); // Load first 5 schedules
    const schedules = response.data;

    const tbody = document.getElementById('dashboardScheduleTableBody');
    tbody.innerHTML = '';

    if (schedules.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" class="px-6 py-8 text-center text-gray-500">
            Tidak ada jadwal tersedia
          </td>
        </tr>
      `;
      return;
    }

    schedules.forEach(schedule => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-green-50 transition-colors';

      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-800">
          ${new Date(schedule.tanggal).toLocaleDateString('id-ID')}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">
          ${schedule.lokasi}
        </td>
        <td class="px-6 py-4 text-sm text-green-600">
          ${schedule.layanan || '-'}
        </td>
      `;

      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading dashboard schedules:', error);
    const tbody = document.getElementById('dashboardScheduleTableBody');
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="px-6 py-8 text-center text-red-500">
          Gagal memuat data jadwal
        </td>
      </tr>
    `;
  }
}

// Charts
document.addEventListener("DOMContentLoaded", function () {
  // Load dashboard data
  loadDashboardSchedules();

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
