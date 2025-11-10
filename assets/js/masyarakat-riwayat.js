// Navigation functions
function goBack() {
  window.location.href = "masyarakat_dashboard.html";
}

function logout() {
  window.location.href = "login.html";
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
