// === KONFIGURASI UTAMA ===
const API_CONFIG = {
  BASE_URL: '', // Biarkan kosong untuk Relative URL (Otomatis ikut domain/IP)
  ENDPOINTS: {
    GENERATE_RESULT: '/generate-result' 
    // Catatan: Pastikan di backend route ini benar-benar ada (biasanya diawali /api/)
    // Jika error 404, coba ganti jadi '/api/generate-result'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('dataForm');
  const submitBtn = document.getElementById('submitBtn');
  const hasilAnalisisDiv = document.getElementById('hasilAnalisis');

  if (!form) return; // Mencegah error jika script di-load di halaman lain

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Simpan teks asli tombol
    const originalBtnText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin inline-block h-4 w-4 mr-2" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Menganalisis...
    `;
    
    hasilAnalisisDiv.innerHTML = '<p class="text-center text-gray-600 animate-pulse">Mohon tunggu, AI sedang menganalisis data...</p>';

    const data = {
      nama: document.getElementById('namaAnak').value,
      umur: document.getElementById('umur').value,
      jenisKelamin: document.getElementById('jenisKelamin').value,
      beratBadan: document.getElementById('beratBadan').value,
      tinggiBadan: document.getElementById('tinggiBadan').value,
      lingkarKepala: document.getElementById('lingkarKepala').value,
    };

    try {
      // UPDATE: Menggunakan Config Dinamis (Relative URL)
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATE_RESULT}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Formatting hasil agar lebih rapi
      if (result.result) {
        hasilAnalisisDiv.innerHTML = `
          <div class="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
            <h4 class="font-semibold text-green-800 mb-2">Hasil Analisis:</h4>
            <div class="text-gray-700 whitespace-pre-line leading-relaxed">
              ${result.result.replace(/\n/g, '<br>')}
            </div>
          </div>
        `;
      } else {
         hasilAnalisisDiv.innerHTML = '<p class="text-yellow-600">Analisis selesai, namun tidak ada data teks yang diterima.</p>';
      }

    } catch (error) {
      console.error(error);
      hasilAnalisisDiv.innerHTML = `
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong class="font-bold">Terjadi Kesalahan!</strong>
          <span class="block sm:inline">${error.message}</span>
          <p class="text-sm mt-2 text-red-500">Pastikan server backend berjalan dan endpoint '/generate-result' tersedia.</p>
        </div>
      `;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText; // Kembalikan teks asli (Hitung & Lihat Hasil)
    }
  });
});