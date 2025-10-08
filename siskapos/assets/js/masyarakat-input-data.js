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

// Form submission handler
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("dataForm");
  const hasilSection = document.getElementById("hasilAnalisis");
  const hasilContent = document.getElementById("hasilContent");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Get form values
      const namaAnak = document.getElementById("namaAnak").value;
      const umur = parseFloat(document.getElementById("umur").value);
      const jenisKelamin = document.getElementById("jenisKelamin").value;
      const beratBadan = parseFloat(
        document.getElementById("beratBadan").value
      );
      const tinggiBadan = parseFloat(
        document.getElementById("tinggiBadan").value
      );
      const lingkarKepala = parseFloat(
        document.getElementById("lingkarKepala").value
      );

      // Simple analysis logic (would be replaced with actual API call)
      const bmi = beratBadan / (tinggiBadan / 100) ** 2;
      let statusGizi = "Normal";
      let rekomendasi =
        "Pertahankan pola makan sehat dan aktivitas fisik yang cukup.";
      let statusColor = "green";

      if (bmi < 14) {
        statusGizi = "Kurus";
        rekomendasi =
          "Konsultasikan dengan dokter untuk peningkatan asupan nutrisi.";
        statusColor = "red";
      } else if (bmi > 18) {
        statusGizi = "Gemuk";
        rekomendasi = "Perhatikan pola makan dan tingkatkan aktivitas fisik.";
        statusColor = "orange";
      }

      // Display results
      hasilContent.innerHTML = `
              <div class="bg-gradient-to-r from-${statusColor}-50 to-${statusColor}-100 border border-${statusColor}-200 rounded-lg p-6">
                <h4 class="font-semibold text-${statusColor}-800 mb-2">Status Gizi: ${statusGizi}</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-${statusColor}-700">
                  <div>
                    <p><strong>Nama:</strong> ${namaAnak}</p>
                    <p><strong>Umur:</strong> ${umur} bulan</p>
                    <p><strong>Jenis Kelamin:</strong> ${jenisKelamin}</p>
                  </div>
                  <div>
                    <p><strong>Berat:</strong> ${beratBadan} kg</p>
                    <p><strong>Tinggi:</strong> ${tinggiBadan} cm</p>
                    <p><strong>Lingkar Kepala:</strong> ${lingkarKepala} cm</p>
                    <p><strong>BMI:</strong> ${bmi.toFixed(1)}</p>
                  </div>
                </div>
              </div>
              
              <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h4 class="font-semibold text-blue-800 mb-2">Rekomendasi</h4>
                <p class="text-blue-700">
                  ${rekomendasi}
                </p>
                <div class="mt-4">
                  <p class="text-sm text-blue-600">
                    <strong>Catatan:</strong> Hasil ini adalah analisis sederhana. Untuk evaluasi medis yang komprehensif, silakan konsultasi dengan tenaga kesehatan di Posyandu.
                  </p>
                </div>
              </div>
            `;

      // Show results section
      hasilSection.classList.remove("hidden");

      // Scroll to results
      setTimeout(() => {
        hasilSection.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });
  }
});
