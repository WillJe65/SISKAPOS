let currentFormData = null;
let selectedAccountId = null;

// Fungsi navigasi
function goBack() {
  window.location.href = "/admin-dashboard";
}

function logout() {
  if (confirm("Apakah Anda yakin ingin logout?")) {
    localStorage.removeItem('token');
    window.location.href = "/";
  }
}

// Memuat daftar akun (anak) ke dalam dropdown
async function loadAccountsIntoDropdown() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/accounts?limit=1000', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Gagal memuat data akun');
    
    const { data } = await response.json();
    
    const namaAnakInput = document.getElementById('namaAnak');
    
    const selectEl = document.createElement('select');
    selectEl.id = 'namaAnakSelect';
    selectEl.required = true;
    selectEl.className = 'block w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-green-500 focus:border-green-500 bg-white';
    
    selectEl.innerHTML = '<option value="">-- Pilih Anak --</option>';
    
    data.forEach(akun => {
      const option = document.createElement('option');
      option.value = akun.id;
      option.textContent = `${akun.nama_lengkap} (Username: ${akun.username})`;
      option.dataset.umur = akun.umur_bulan;
      option.dataset.kelamin = akun.jenis_kelamin;
      selectEl.appendChild(option);
    });

    namaAnakInput.parentNode.replaceChild(selectEl, namaAnakInput);

    selectEl.addEventListener('change', (e) => {
      selectedAccountId = e.target.value;
      const selectedOption = e.target.options[e.target.selectedIndex];
      
      if (selectedOption.value) {
        document.getElementById('umur').value = selectedOption.dataset.umur || '';
        document.getElementById('jenisKelamin').value = selectedOption.dataset.kelamin ? selectedOption.dataset.kelamin.toLowerCase() : '';
        document.getElementById('jenisKelamin').disabled = true;
      } else {
        document.getElementById('umur').value = '';
        document.getElementById('jenisKelamin').value = '';
        document.getElementById('jenisKelamin').disabled = false;
      }
    });

  } catch (err) {
    console.error(err);
    alert('Gagal memuat daftar anak. Halaman akan dimuat ulang.');
    location.reload();
  }
}

// Event listener untuk submit form data
document.getElementById("dataForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const submitBtn = document.getElementById("submitBtn");
  const originalBtnText = submitBtn.innerHTML;

  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Menganalisis...
  `;

  const selectEl = document.getElementById('namaAnakSelect');
  if (!selectEl || !selectEl.value) {
     alert('Silakan pilih anak terlebih dahulu.');
     submitBtn.disabled = false;
     submitBtn.innerHTML = originalBtnText;
     return;
  }
  
  const selectedOption = selectEl.options[selectEl.selectedIndex];
  const nama = selectedOption.text.split(' (')[0];
  
  const umur = parseInt(document.getElementById("umur").value);
  const jenisKelamin = document.getElementById("jenisKelamin").value;
  const beratBadan = parseFloat(document.getElementById("beratBadan").value);
  const tinggiBadan = parseFloat(document.getElementById("tinggiBadan").value);
  const lingkarKepala = parseFloat(document.getElementById("lingkarKepala").value);
  
  if (isNaN(umur) || isNaN(beratBadan) || isNaN(tinggiBadan)) {
     alert('Umur, Berat Badan, dan Tinggi Badan wajib diisi angka.');
     submitBtn.disabled = false;
     submitBtn.innerHTML = originalBtnText;
     return;
  }

  const bmi = beratBadan / Math.pow(tinggiBadan / 100, 2);
  let statusGizi, statusClass;

  // Placeholder sederhana untuk status gizi
  if (bmi < 17.0) {
    statusGizi = "Gizi Kurang";
    statusClass = "bg-yellow-100 text-yellow-800";
  } else if (bmi >= 17.0 && bmi <= 23.0) {
    statusGizi = "Normal";
    statusClass = "bg-green-100 text-green-800";
  } else if (bmi > 23.0 && bmi <= 27.0) {
    statusGizi = "Gizi Lebih";
    statusClass = "bg-orange-100 text-orange-800";
  } else {
    statusGizi = "Obesitas";
    statusClass = "bg-red-100 text-red-800";
  }

  let rekomendasiAI = "";

  try {
    // Panggil API untuk rekomendasi AI
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
    rekomendasiAI = "Gagal memuat rekomendasi dari AI. Mohon berikan saran gizi seimbang.";
  }

  // Simpan data sementara di state global
  currentFormData = {
    account_id: selectedAccountId,
    umur,
    beratBadan,
    tinggiBadan,
    lingkarKepala: !isNaN(lingkarKepala) ? lingkarKepala : null,
    bmi: bmi.toFixed(1),
    statusGizi,
    rekomendasiAI
  };

  const dataHasil = {
    bmi: bmi.toFixed(1),
    statusGizi: statusGizi,
    statusClass: statusClass,
    rekomendasiAI: rekomendasiAI,
  };

  tampilkanHasil(nama, dataHasil);

  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnText;
});

// Fungsi untuk menampilkan hasil analisis di UI
function tampilkanHasil(nama, hasil) {
  const hasilDiv = document.getElementById("hasilAnalisis");

  hasilDiv.innerHTML = `
    <div class="space-y-4">
        <div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <h4 class="font-semibold text-green-800 text-lg">Hasil Analisis untuk: ${nama}</h4>
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
        </div>
        <div class="flex gap-2 pt-2">
            <button onclick="simpanData()" id="saveBtn" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Simpan Data
            </button>
            <button onclick="resetForm()" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Input Data Baru
            </button>
        </div>
    </div>
  `;
}

// Fungsi untuk menyimpan data ke database
async function simpanData() {
  if (!currentFormData) {
    alert("Tidak ada data untuk disimpan.");
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }
  
  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.innerText = 'Menyimpan...';

  try {
    const response = await fetch('http://localhost:5000/api/antropometri', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(currentFormData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal menyimpan data.');
    }

    alert(result.message || "Data berhasil disimpan!");
    resetForm();

  } catch (err) {
    console.error("Gagal menyimpan data:", err);
    alert("Gagal menyimpan data: " + err.message);
    saveBtn.disabled = false;
    saveBtn.innerText = 'Simpan Data';
  }
}

// Fungsi untuk mereset form dan hasil analisis
function resetForm() {
  document.getElementById("dataForm").reset();
  
  document.getElementById('jenisKelamin').disabled = false;
  
  const selectEl = document.getElementById('namaAnakSelect');
  if (selectEl) {
    selectEl.selectedIndex = 0;
  }
  
  currentFormData = null;
  selectedAccountId = null;
  
  document.getElementById("hasilAnalisis").innerHTML = `
    <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <svg class="w-12 h-12 mx-auto text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p class="text-green-700 font-medium">Silakan isi form di sebelah kiri</p>
    </div>
  `;
}

// Intersection Observer untuk animasi fade-in
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.1 });

// Event listener saat dokumen selesai dimuat
document.addEventListener("DOMContentLoaded", function () {
  loadAccountsIntoDropdown();
  
  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((el) => {
    observer.observe(el);
  });
});