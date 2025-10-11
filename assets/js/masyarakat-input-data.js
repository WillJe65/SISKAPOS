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

document.addEventListener("DOMContentLoaded", function () {
  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((el) => {
    observer.observe(el);
  });
});

// --- MODIFIED FORM SUBMISSION HANDLER ---
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("dataForm");
  const hasilSection = document.getElementById("hasilAnalisis");
  const hasilContent = document.getElementById("hasilContent");
  const submitBtn = document.getElementById("submitBtn"); // Get the submit button

  if (form) {
    // Make the event listener function `async` to use `await`
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      // --- 1. Show a loading state ---
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Menganalisis...
      `;

      // Get form values
      const namaAnak = document.getElementById("namaAnak").value;
      const umur = parseFloat(document.getElementById("umur").value);
      const jenisKelamin = document.getElementById("jenisKelamin").value;
      const beratBadan = parseFloat(document.getElementById("beratBadan").value);
      const tinggiBadan = parseFloat(document.getElementById("tinggiBadan").value);
      const lingkarKepala = parseFloat(document.getElementById("lingkarKepala").value);

      // --- 2. Calculate local values (BMI and initial status) ---
      const bmi = beratBadan / (tinggiBadan / 100) ** 2;
      let statusGizi = "Normal";
      let statusColor = "green";

      if (bmi < 14) {
        statusGizi = "Kurus";
        statusColor = "red";
      } else if (bmi > 18) {
        statusGizi = "Gemuk";
        statusColor = "orange";
      }
      
      let rekomendasiAI = ""; // Variable to hold AI recommendation

      try {
        // --- 3. Call our backend API ---
        const apiResponse = await fetch('http://localhost:5000/api/generate-recommendation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            namaAnak,
            umur,
            jenisKelamin,
            beratBadan,
            tinggiBadan,
            bmi,
            statusGizi,
          }),
        });

        if (!apiResponse.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await apiResponse.json();
        rekomendasiAI = data.recommendation; // Get recommendation from AI

      } catch (error) {
        console.error("Failed to fetch AI recommendation:", error);
        rekomendasiAI = "Tidak dapat memuat rekomendasi dari AI. Mohon pertahankan pola makan sehat dan konsultasikan dengan petugas Posyandu untuk saran lebih lanjut."; // Fallback message
      }


      // --- 4. Display results with AI recommendation ---
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
          <h4 class="font-semibold text-blue-800 mb-2">💡 Rekomendasi dari AI</h4>
          <p class="text-blue-700">
            ${rekomendasiAI}
          </p>
          <div class="mt-4">
            <p class="text-sm text-blue-600">
              <strong>Catatan:</strong> Rekomendasi ini dihasilkan oleh AI dan bersifat saran umum. Untuk evaluasi medis yang komprehensif, silakan konsultasi dengan tenaga kesehatan di Posyandu.
            </p>
          </div>
        </div>
      `;
      
      // --- 5. Reset the button and show results ---
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      hasilSection.classList.remove("hidden");

      // Scroll to results
      setTimeout(() => {
        hasilSection.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });
  }
});