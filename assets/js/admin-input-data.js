// Navigation functions
function goBack() {
  window.location.href = "admin_dashboard.html";
}

function logout() {
  if (confirm("Apakah Anda yakin ingin logout?")) {
    window.location.href = "dashboard.html";
  }
}

// --- MODIFIED FORM SUBMISSION ---
document.getElementById("dataForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const submitBtn = document.getElementById("submitBtn");
  const originalBtnText = submitBtn.innerHTML;

  // 1. Tambahkan loading state pada tombol submit
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Menganalisis...
  `;

  // Ambil data dari form
  const nama = document.getElementById("namaAnak").value;
  const umur = parseInt(document.getElementById("umur").value);
  const jenisKelamin = document.getElementById("jenisKelamin").value;
  const beratBadan = parseFloat(document.getElementById("beratBadan").value);
  const tinggiBadan = parseFloat(document.getElementById("tinggiBadan").value);
  const lingkarKepala = parseFloat(document.getElementById("lingkarKepala").value);

  // Hitung BMI dan tentukan status gizi awal secara lokal
  const bmi = beratBadan / Math.pow(tinggiBadan / 100, 2);
  let statusGizi, statusClass;

  if (bmi < 14) {
    statusGizi = "Gizi Kurang";
    statusClass = "bg-yellow-100 text-yellow-800";
  } else if (bmi < 12) {
    statusGizi = "Gizi Buruk";
    statusClass = "bg-red-100 text-red-800";
  } else if (bmi > 18) {
    statusGizi = "Gizi Lebih";
    statusClass = "bg-orange-100 text-orange-800";
  } else {
    statusGizi = "Normal";
    statusClass = "bg-green-100 text-green-800";
  }

  let rekomendasiAI = "";

  try {
    // 2. Panggil backend API untuk mendapatkan rekomendasi dari Gemini
    const apiResponse = await fetch('http://localhost:5000/api/generate-recommendation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        namaAnak: nama,
        umur,
        jenisKelamin,
        beratBadan,
        tinggiBadan,
        bmi,
        statusGizi,
      }),
    });

    if (!apiResponse.ok) {
      throw new Error(`Network response was not ok: ${apiResponse.statusText}`);
    }

    const data = await apiResponse.json();
    rekomendasiAI = data.recommendation;

  } catch (error) {
    console.error("Failed to fetch AI recommendation:", error);
    rekomendasiAI = "Gagal memuat rekomendasi dari AI. Pastikan server backend berjalan dan coba lagi. Untuk sementara, mohon berikan saran gizi seimbang dan aktivitas fisik yang cukup sesuai usia anak.";
  }

  // 3. Tampilkan hasil di halaman
  const dataHasil = {
    bmi: bmi.toFixed(1),
    statusGizi: statusGizi,
    statusClass: statusClass,
    rekomendasiAI: rekomendasiAI, // Gunakan rekomendasi dari AI
  };

  tampilkanHasil(nama, dataHasil);

  // 4. Kembalikan tombol ke state semula
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnText;
});

// --- MODIFIED FUNGSI UNTUK MENAMPILKAN HASIL ---
function tampilkanHasil(nama, hasil) {
  const hasilDiv = document.getElementById("hasilAnalisis");

  hasilDiv.innerHTML = `
    <div class="space-y-4">
        <div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <h4 class="font-semibold text-green-800 text-lg">Hasil Analisis untuk: ${nama}</h4>
            <p class="text-green-600 text-sm">Tanggal: ${new Date().toLocaleDateString("id-ID")}</p>
        </div>

        <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
                <span class="text-gray-700 font-medium">Status Gizi:</span>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${hasil.statusClass}">
                    ${hasil.statusGizi}
                </span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-gray-700 font-medium">BMI:</span>
                <span class="text-gray-900 font-semibold">${hasil.bmi}</span>
            </div>
        </div>

        <div class="border border-gray-200 rounded-lg p-4">
            <h5 class="font-semibold text-gray-800 mb-3">💡 Rekomendasi AI:</h5>
            <p class="text-gray-700 text-sm whitespace-pre-line">${hasil.rekomendasiAI}</p>
            <p class="text-xs text-gray-500 mt-3">
              Catatan: Rekomendasi ini dihasilkan AI. Selalu validasi dengan pengetahuan medis profesional.
            </p>
        </div>

        <div class="flex gap-2 pt-2">
            <button onclick="simpanData()" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Simpan Data
            </button>
            <button onclick="resetForm()" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Input Data Baru
            </button>
        </div>
    </div>
  `;
}

function simpanData() {
  alert("Data berhasil disimpan! (fungsi simulasi)");
  // Implementasi penyimpanan data bisa ditambahkan di sini
  // Anda mungkin ingin menyimpan `rekomendasiAI` juga
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

document.addEventListener("DOMContentLoaded", function () {
  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((el) => {
    observer.observe(el);
  });
});