// Navigation functions
function goBack() {
  window.location.href = "admin_dashboard.html";
}

function logout() {
  if (confirm("Apakah Anda yakin ingin logout?")) {
    window.location.href = "dashboard.html";
  }
}

// Form submission
document.getElementById("dataForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const nama = document.getElementById("namaAnak").value;
  const umur = parseInt(document.getElementById("umur").value);
  const jenisKelamin = document.getElementById("jenisKelamin").value;
  const beratBadan = parseFloat(document.getElementById("beratBadan").value);
  const tinggiBadan = parseFloat(document.getElementById("tinggiBadan").value);
  const lingkarKepala = parseFloat(
    document.getElementById("lingkarKepala").value
  );

  // Simulasi analisis antropometri
  const hasil = analisaAntropometri(
    umur,
    jenisKelamin,
    beratBadan,
    tinggiBadan,
    lingkarKepala
  );

  tampilkanHasil(nama, hasil);
});

function analisaAntropometri(umur, jenisKelamin, bb, tb, lk) {
  // Simulasi perhitungan status gizi (implementasi sebenarnya lebih kompleks)
  const bmiAktual = bb / Math.pow(tb / 100, 2);

  let statusGizi = "Normal";
  let statusClass = "bg-green-100 text-green-800";
  let recommendations = [];

  // Simulasi analisis sederhana
  if (bmiAktual < 14) {
    statusGizi = "Gizi Kurang";
    statusClass = "bg-yellow-100 text-yellow-800";
    recommendations.push("Tingkatkan asupan nutrisi");
    recommendations.push("Konsultasi dengan ahli gizi");
  } else if (bmiAktual < 12) {
    statusGizi = "Gizi Buruk";
    statusClass = "bg-red-100 text-red-800";
    recommendations.push("Segera konsultasi dokter");
    recommendations.push("Program pemulihan gizi intensif");
  } else if (bmiAktual > 18) {
    statusGizi = "Gizi Lebih";
    statusClass = "bg-orange-100 text-orange-800";
    recommendations.push("Atur pola makan seimbang");
    recommendations.push("Tingkatkan aktivitas fisik");
  } else {
    recommendations.push("Pertahankan pola makan sehat");
    recommendations.push("Rutin kontrol pertumbuhan");
  }

  return {
    bmi: bmiAktual.toFixed(1),
    statusGizi: statusGizi,
    statusClass: statusClass,
    recommendations: recommendations,
  };
}

function tampilkanHasil(nama, hasil) {
  const hasilDiv = document.getElementById("hasilAnalisis");

  hasilDiv.innerHTML = `
                <div class="space-y-4">
                    <!-- Header Hasil -->
                    <div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                        <h4 class="font-semibold text-green-800 text-lg">Hasil Analisis untuk: ${nama}</h4>
                        <p class="text-green-600 text-sm">Tanggal: ${new Date().toLocaleDateString(
                          "id-ID"
                        )}</p>
                    </div>

                    <!-- Status Gizi -->
                    <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-700 font-medium">Status Gizi:</span>
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              hasil.statusClass
                            }">
                                ${hasil.statusGizi}
                            </span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-gray-700 font-medium">BMI:</span>
                            <span class="text-gray-900 font-semibold">${
                              hasil.bmi
                            }</span>
                        </div>
                    </div>

                    <!-- Rekomendasi -->
                    <div class="border border-gray-200 rounded-lg p-4">
                        <h5 class="font-semibold text-gray-800 mb-3">Rekomendasi:</h5>
                        <ul class="space-y-2">
                            ${hasil.recommendations
                              .map(
                                (rec) => `
                                <li class="flex items-start gap-2">
                                    <svg class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <span class="text-gray-700 text-sm">${rec}</span>
                                </li>
                            `
                              )
                              .join("")}
                        </ul>
                    </div>

                    <!-- Aksi Selanjutnya -->
                    <div class="flex gap-2">
                        <button onclick="simpanData()" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            Simpan Data
                        </button>
                        <button onclick="resetForm()" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            Reset Form
                        </button>
                    </div>
                </div>
            `;
}

function simpanData() {
  alert("Data berhasil disimpan!");
  // Implementasi penyimpanan data
}

function resetForm() {
  document.getElementById("dataForm").reset();
  document.getElementById("hasilAnalisis").innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <svg class="w-12 h-12 mx-auto text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p class="text-green-700 font-medium">Silakan isi form di sebelah kiri</p>
                    <p class="text-green-600 text-sm mt-1">Hasil analisis antropometri akan muncul di sini setelah form disubmit</p>
                </div>
            `;
}

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
