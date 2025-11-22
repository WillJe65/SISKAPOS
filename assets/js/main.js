document.addEventListener("DOMContentLoaded", function () {

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
    mobileMenuBtn.addEventListener("click", function (e) {
      e.stopPropagation(); // Mencegah event bubbling
      sidebar.classList.toggle("hidden");
      sidebar.classList.toggle("fixed");
      sidebar.classList.toggle("top-0");
      sidebar.classList.toggle("left-0");
      sidebar.classList.toggle("h-full");
      sidebar.classList.toggle("z-30");
    });

    // Fitur tambahan: Tutup sidebar jika klik di luar (untuk UX mobile yang lebih baik)
    document.addEventListener("click", function(e) {
      if (!sidebar.classList.contains("hidden") && 
          !sidebar.contains(e.target) && 
          !mobileMenuBtn.contains(e.target) &&
          window.innerWidth < 1024) { // Hanya di layar mobile
            
        sidebar.classList.add("hidden");
        sidebar.classList.remove("fixed", "top-0", "left-0", "h-full", "z-30");
      }
    });
  }
});

// Fungsi navigasi yang bisa dipanggil dari HTML
function logout() {
  if (confirm("Apakah Anda yakin ingin logout?")) {
    // PERBAIKAN PENTING: Hapus token dari penyimpanan browser
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    
    // Redirect ke halaman utama (Login)
    window.location.href = "/";
  }
}

function goBack() {
  if (document.referrer && !document.referrer.includes(window.location.host)) {
      // Jika referer dari luar website, jangan pakai history.back()
      defaultBack();
  } else if (document.referrer) {
    window.history.back();
  } else {
    defaultBack();
  }
}

function defaultBack() {
  if (window.location.pathname.includes("admin")) {
    window.location.href = "/admin-dashboard";
  } else if (window.location.pathname.includes("masyarakat")) {
    window.location.href = "/masyarakat-dashboard"; // Perbaikan typo: underscore ke dash (biasanya URL pakai dash)
  } else {
    window.location.href = "/dashboard";
  }
}