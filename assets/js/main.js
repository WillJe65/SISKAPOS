// Fungsi ini dijalankan setelah seluruh halaman dimuat
document.addEventListener("DOMContentLoaded", function () {
  // --- FUNGSI GLOBAL ---

  // Animasi fade-in saat elemen di-scroll
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

  // Toggle untuk menu mobile
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

// Fungsi navigasi yang bisa dipanggil dari HTML
function logout() {
  if (confirm("Apakah Anda yakin ingin logout?")) {
    window.location.href = "dashboard.html";
  }
}

function goBack() {
  // Coba kembali ke halaman sebelumnya dalam riwayat browser
  if (document.referrer) {
    window.history.back();
  } else {
    // Fallback jika tidak ada riwayat (misal: halaman dibuka di tab baru)
    // Arahkan ke dashboard yang sesuai
    if (window.location.pathname.includes("admin")) {
      window.location.href = "admin_dashboard.html";
    } else {
      window.location.href = "masyarakat_dashboard.html";
    }
  }
}
