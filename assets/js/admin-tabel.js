// === KONFIGURASI UTAMA ===
const API_CONFIG = {
  BASE_URL: process.env.BASE_URL, // Biarkan kosong untuk Relative URL (Otomatis ikut domain/IP)
  ENDPOINTS: {
    ACCOUNTS: '/api/accounts'
  }
};

let currentPage = 1;
const itemsPerPage = 10;
let currentGenderFilter = "all";

// Fungsi navigasi
function goBack() {
  window.location.href = "/admin-dashboard";
}

function logout() {
  if (confirm("Apakah Anda yakin ingin logout?")) {
    localStorage.removeItem('token');
    window.location.href = "/dashboard";
  }
}

// Fungsi Modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove("hidden");
  setTimeout(() => {
    const modalBox = modal.querySelector(".transform");
    if(modalBox) {
        modalBox.classList.remove("scale-95", "opacity-0");
    }
  }, 10);
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  const modalBox = modal.querySelector(".transform");
  if(modalBox) {
    modalBox.classList.add("scale-95", "opacity-0");
  }
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
}

// Fungsi untuk mengambil detail akun
async function viewDetail(id) {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }
  
  try {
    // UPDATE: Menggunakan Config Dinamis
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCOUNTS}/${id}`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
        if(res.status === 401) window.location.href = '/login';
        throw new Error('Gagal mengambil data');
    }
    
    const data = await res.json();
    
    const contentArea = document.getElementById("detailModalContent");
    contentArea.innerHTML = `
        <p class="text-sm"><strong class="font-medium text-green-800">Username:</strong> ${data.username || 'N/A'}</p>
        <p class="text-sm"><strong class="font-medium text-green-800">Nama Lengkap:</strong> ${data.nama_lengkap}</p>
        <p class="text-sm"><strong class="font-medium text-green-800">Umur (terakhir):</strong> ${data.umur_bulan} bulan</p>
        <p class="text-sm"><strong class="font-medium text-green-800">Jenis Kelamin:</strong> ${data.jenis_kelamin}</p>
        <p class="text-sm"><strong class="font-medium text-green-800">Nama Orang Tua:</strong> ${data.nama_orang_tua || '-'}</p>
        <p class="text-sm"><strong class="font-medium text-green-800">Alamat:</strong> ${data.alamat || '-'}</p>
        <p class="text-sm"><strong class="font-medium text-green-800">Nomor HP:</strong> ${data.nomor_hp || '-'}</p>
      `;
    openModal("detailModal");
    
  } catch (err) {
    console.error(err);
    alert('Gagal memuat detail akun.');
  }
}

// Fungsi untuk mengambil riwayat pengukuran
async function viewHistory(id, nama) {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  const contentArea = document.getElementById("historyModalContent");
  contentArea.innerHTML = '<p class="text-center">Memuat riwayat...</p>';
  document.getElementById("historyModalTitle").innerText = `Riwayat Pengukuran - ${nama}`;
  openModal("historyModal");
  
  try {
    // UPDATE: Menggunakan Config Dinamis
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCOUNTS}/${id}/history`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
        if(res.status === 401) window.location.href = '/login';
        throw new Error('Gagal mengambil data riwayat');
    }
    
    const riwayat = await res.json();
    
    if (riwayat.length === 0) {
      contentArea.innerHTML = '<p class="text-center text-green-700">Tidak ada data riwayat untuk anak ini.</p>';
      return;
    }
    
    let tableHTML = `
      <div class="overflow-x-auto">
      <table class="w-full text-sm text-left text-green-700">
        <thead class="bg-green-100 text-xs text-green-800 uppercase">
          <tr>
            <th scope="col" class="px-6 py-3">Tanggal Periksa</th>
            <th scope="col" class="px-6 py-3">Umur</th>
            <th scope="col" class="px-6 py-3">BB (kg)</th>
            <th scope="col" class="px-6 py-3">TB (cm)</th>
            <th scope="col" class="px-6 py-3">Status Gizi</th>
          </tr>
        </thead>
        <tbody>
    `;

    riwayat.forEach((item) => {
      let statusClass = "bg-gray-100 text-gray-800";
      const statusGizi = item.status_gizi || 'N/A';

      if (statusGizi === "Normal") {
        statusClass = "bg-green-100 text-green-800";
      } else if (statusGizi === "Stunting" || statusGizi === "Gizi Buruk" || statusGizi === "Obesitas") {
        statusClass = "bg-red-100 text-red-800";
      } else if (statusGizi === "Risiko Stunting" || statusGizi === "Gizi Kurang") {
        statusClass = "bg-yellow-100 text-yellow-800";
      } else if (statusGizi === "Gizi Lebih") {
        statusClass = "bg-orange-100 text-orange-800";
      }

      tableHTML += `
          <tr class="bg-white border-b border-green-100 hover:bg-green-50">
            <td class="px-6 py-4 font-medium">${new Date(item.tanggal_periksa).toLocaleDateString("id-ID")}</td>
            <td class="px-6 py-4">${item.umur_bulan_saat_periksa} bln</td>
            <td class="px-6 py-4">${item.berat_badan_kg}</td>
            <td class="px-6 py-4">${item.tinggi_badan_cm}</td>
            <td class="px-6 py-4">
              <span class="px-2 py-1 font-semibold leading-tight rounded-full ${statusClass}">
                ${statusGizi}
              </span>
            </td>
          </tr>
        `;
    });

    tableHTML += `</tbody></table></div>`;
    contentArea.innerHTML = tableHTML;
    
  } catch (err) {
    console.error(err);
    contentArea.innerHTML = `<p class="text-center text-red-600">Gagal memuat data riwayat.</p>`;
  }
}

// Fungsi filter dan pencarian
function applyFilters() {
  loadAccounts(1);
}

function filterData(gender) {
  currentGenderFilter = gender;
  loadAccounts(1);
}

// Fungsi untuk merender tabel
function renderTable(data, pagination) {
  const tableBody = document.getElementById('dataTableBody');
  tableBody.innerHTML = '';

  if (!data || data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-green-700">Tidak ada data ditemukan.</td></tr>`;
    return;
  }

  data.forEach((akun, index) => {
    const isLaki = akun.jenis_kelamin && akun.jenis_kelamin.toLowerCase().includes('laki');
    const avatarColor = isLaki ? 'blue' : 'pink';
    const genderBadgeColor = isLaki ? 'blue' : 'pink';
    const status = akun.status_gizi || "Belum Ada Data";
    
    let statusClass = "bg-gray-100 text-gray-800";
    if (status === "Normal") {
      statusClass = "bg-green-100 text-green-800";
    } else if (status === "Stunting" || status === "Gizi Buruk" || status === "Obesitas") {
      statusClass = "bg-red-100 text-red-800";
    } else if (status === "Risiko Stunting" || status === "Gizi Kurang") {
      statusClass = "bg-yellow-100 text-yellow-800";
    } else if (status === "Gizi Lebih") {
      statusClass = "bg-orange-100 text-orange-800";
    }
    
    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ')
                  .map(word => word[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();
    };
    const initials = getInitials(akun.nama_lengkap);


    const tr = document.createElement('tr');
    tr.className = 'hover:bg-green-50 transition-colors';
    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm text-green-800">${(pagination.currentPage - 1) * pagination.limit + index + 1}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-gradient-to-br from-${avatarColor}-500 to-${avatarColor}-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
            <span class="text-white font-medium">${initials}</span>
          </div>
          <div>
            <div class="text-sm font-medium text-green-900">${akun.nama_lengkap}</div>
            <div class="text-sm text-green-500">ID: ${akun.username}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">${akun.umur_bulan} bulan</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${genderBadgeColor}-100 text-${genderBadgeColor}-800">${akun.jenis_kelamin}</span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">${status}</span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button onclick="viewDetail('${akun.id}')" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">
          Detail
        </button>
        <button onclick="viewHistory('${akun.id}', '${akun.nama_lengkap.replace(/'/g, "\\'")}')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">
          Riwayat
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// Fungsi untuk merender pagination
function renderPagination(pagination) {
  const container = document.querySelector('.sm\\:justify-between');
  if (!container) return;

  const paginationText = container.querySelector('p');
  if(paginationText) {
      if (pagination.totalRecords > 0) {
        paginationText.innerHTML = `
            Menampilkan <span class="font-medium">${(pagination.currentPage - 1) * pagination.limit + 1}</span> 
            sampai <span class="font-medium">${Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)}</span> 
            dari <span class="font-medium">${pagination.totalRecords}</span> hasil
        `;
      } else {
         paginationText.innerHTML = `Tidak ada hasil ditemukan.`;
      }
  }

  const navContainer = container.querySelector('nav');
  if (!navContainer) return;
  
  const { currentPage, totalPages } = pagination;
  let buttons = [];

  buttons.push(`
    <button 
      class="pagination-button relative inline-flex items-center px-2 py-2 rounded-l-md border border-green-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-green-500 hover:bg-green-50'}"
      ${currentPage === 1 ? 'disabled' : `data-page="${currentPage - 1}"`}
    >
      <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
    </button>
  `);

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      buttons.push(`
        <button 
          class="pagination-button relative inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium ${i === currentPage ? 'bg-green-600 text-white' : 'bg-white text-green-600 hover:bg-green-50'}"
          data-page="${i}"
        >
          ${i}
        </button>
      `);
    } else if (
      (i === currentPage - 2 && currentPage > 3) ||
      (i === currentPage + 2 && currentPage < totalPages - 2)
    ) {
      buttons.push(`<span class="relative inline-flex items-center px-4 py-2 border border-green-300 bg-white text-sm font-medium text-green-700">...</span>`);
    }
  }

  buttons.push(`
    <button 
      class="pagination-button relative inline-flex items-center px-2 py-2 rounded-r-md border border-green-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-green-500 hover:bg-green-50'}"
      ${currentPage === totalPages ? 'disabled' : `data-page="${currentPage + 1}"`}
    >
      <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>
    </button>
  `);
  
  navContainer.innerHTML = buttons.join('');
  
  document.querySelectorAll('.pagination-button').forEach(button => {
    button.addEventListener('click', (e) => {
      const page = e.currentTarget.dataset.page;
      if (page) {
        loadAccounts(parseInt(page));
      }
    });
  });
}


// Fungsi untuk memuat akun dari API
async function loadAccounts(page = 1) {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }
  
  const tableBody = document.getElementById('dataTableBody');
  tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-green-700">
    <div class="flex justify-center items-center"><svg class="animate-spin h-5 w-5 mr-3 text-green-500" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    Memuat data...
    </div>
  </td></tr>`;

  const searchFilter = document.getElementById("search").value;

  try {
    // UPDATE: Menggunakan Config Dinamis
    // Sebelumnya: http://localhost:5000/api/accounts... (ERROR di VPS)
    let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCOUNTS}?page=${page}&limit=${itemsPerPage}`;
    
    if (searchFilter) {
      url += `&search=${encodeURIComponent(searchFilter)}`;
    }
    if (currentGenderFilter !== 'all') {
      url += `&gender=${encodeURIComponent(currentGenderFilter)}`;
    }
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
       if(response.status === 401) window.location.href = '/login';
       throw new Error('Gagal memuat data');
    }
    
    const { data, pagination } = await response.json();
    currentPage = pagination.currentPage;
    
    renderTable(data, pagination);
    renderPagination(pagination);

  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-red-600">Gagal memuat data. ${err.message}</td></tr>`;
  }
}

// Inisialisasi saat DOM Selesai Dimuat
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search");
  searchInput.addEventListener("keyup", (e) => {
     applyFilters();
  });
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.1 });
  
  document.querySelectorAll(".fade-in").forEach((el) => {
    observer.observe(el);
  });
  
  ['detailModal', 'historyModal'].forEach(modalId => {
      const modal = document.getElementById(modalId);
      if(modal) {
          modal.addEventListener('click', function(e) {
              if (e.target === this) {
                  closeModal(modalId);
              }
          });
      }
  });

  loadAccounts(1);
});