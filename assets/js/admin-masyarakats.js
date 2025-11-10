// Global variables
let currentEditingId = null;
let masyarakatsData = [];
let currentPage = 1;
let totalPages = 1;

// Navigation functions
function goBack() {
  window.location.href = "admin_dashboard.html";
}

function logout() {
  if (confirm("Apakah Anda yakin ingin logout?")) {
    window.location.href = "dashboard.html";
  }
}

// Modal functions
function openMasyarakatModal() {
  document.getElementById("masyarakatModalTitle").textContent = "Tambah Masyarakat Baru";
  document.getElementById("masyarakatForm").reset();
  currentEditingId = null;
  document.getElementById("masyarakatModal").classList.remove("hidden");
}

function closeMasyarakatModal() {
  document.getElementById("masyarakatModal").classList.add("hidden");
  currentEditingId = null;
}

// API functions
async function getAuthToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

async function apiRequest(url, options = {}) {
  const token = await getAuthToken();
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// Load masyarakats from API
async function loadMasyarakats(page = 1) {
  try {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchQuery = document.getElementById('searchMasyarakats').value;

    let url = `/api/masyarakats?page=${page}&limit=10`;
    if (statusFilter !== 'all') {
      url += `&status=${statusFilter}`;
    }
    if (searchQuery) {
      url += `&search=${encodeURIComponent(searchQuery)}`;
    }

    const response = await apiRequest(url);
    masyarakatsData = response.data;
    currentPage = response.pagination.currentPage;
    totalPages = response.pagination.totalPages;

    renderMasyarakatsTable();
    updatePagination();
    updateStats();
  } catch (error) {
    console.error('Error loading masyarakats:', error);
    alert('Gagal memuat data masyarakat');
  }
}

// Render masyarakats table
function renderMasyarakatsTable() {
  const tbody = document.getElementById('masyarakatsTableBody');
  tbody.innerHTML = '';

  if (masyarakatsData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-6 py-8 text-center text-gray-500">
          Tidak ada data masyarakat ditemukan
        </td>
      </tr>
    `;
    return;
  }

  masyarakatsData.forEach(masyarakat => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-green-50 transition-colors';

    const statusBadge = masyarakat.status === 'Aktif' ?
      '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aktif</span>' :
      '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Tidak Aktif</span>';

    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-green-900">${masyarakat.nik}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-green-900">${masyarakat.nama_anak}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-green-900">${masyarakat.umur_bulan} bulan</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-green-900">${masyarakat.jenis_kelamin}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-green-900">${masyarakat.nama_orang_tua || '-'}</div>
      </td>
      <td class="px-6 py-4">
        <div class="text-sm text-green-900">${masyarakat.alamat || '-'}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${statusBadge}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button onclick="editMasyarakat(${masyarakat.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Edit</button>
        <button onclick="deleteMasyarakat(${masyarakat.id})" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Hapus</button>
      </td>
    `;

    tbody.appendChild(row);
  });
}

// Update pagination
function updatePagination() {
  // Simple pagination - you can enhance this
  const paginationInfo = document.createElement('div');
  paginationInfo.className = 'text-sm text-green-600 mt-4';
  paginationInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;

  const existingPagination = document.querySelector('.pagination-info');
  if (existingPagination) {
    existingPagination.remove();
  }

  document.querySelector('.card-hover').appendChild(paginationInfo);
  paginationInfo.classList.add('pagination-info');
}

// Update statistics
function updateStats() {
  const totalMasyarakats = masyarakatsData.length;
  const maleCount = masyarakatsData.filter(m => m.jenis_kelamin === 'Laki-laki').length;
  const femaleCount = masyarakatsData.filter(m => m.jenis_kelamin === 'Perempuan').length;
  const activeCount = masyarakatsData.filter(m => m.status === 'Aktif').length;

  document.getElementById('totalMasyarakats').textContent = totalMasyarakats;
  document.getElementById('maleCount').textContent = maleCount;
  document.getElementById('femaleCount').textContent = femaleCount;
  document.getElementById('activeCount').textContent = activeCount;
}

// CRUD functions
async function editMasyarakat(id) {
  try {
    const masyarakat = masyarakatsData.find(m => m.id == id);
    if (!masyarakat) {
      alert('Masyarakat tidak ditemukan');
      return;
    }

    document.getElementById("masyarakatModalTitle").textContent = "Edit Masyarakat";
    document.getElementById("nik").value = masyarakat.nik;
    document.getElementById("namaAnak").value = masyarakat.nama_anak;
    document.getElementById("umurBulan").value = masyarakat.umur_bulan;
    document.getElementById("jenisKelamin").value = masyarakat.jenis_kelamin;
    document.getElementById("namaOrangTua").value = masyarakat.nama_orang_tua || '';
    document.getElementById("alamat").value = masyarakat.alamat || '';
    document.getElementById("noHp").value = masyarakat.no_hp || '';
    document.getElementById("status").value = masyarakat.status;

    currentEditingId = id;
    document.getElementById("masyarakatModal").classList.remove("hidden");
  } catch (error) {
    console.error('Error loading masyarakat for edit:', error);
    alert('Gagal memuat data masyarakat untuk diedit');
  }
}

async function deleteMasyarakat(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus data masyarakat ini?")) {
    return;
  }

  try {
    await apiRequest(`/api/masyarakats/${id}`, { method: 'DELETE' });
    alert("Data masyarakat berhasil dihapus!");
    loadMasyarakats(currentPage);
  } catch (error) {
    console.error('Error deleting masyarakat:', error);
    alert('Gagal menghapus data masyarakat');
  }
}

function exportMasyarakats() {
  alert("Exporting masyarakat data...");
}

// Form submission
document.getElementById("masyarakatForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = {
    nik: document.getElementById("nik").value,
    nama_anak: document.getElementById("namaAnak").value,
    umur_bulan: parseInt(document.getElementById("umurBulan").value),
    jenis_kelamin: document.getElementById("jenisKelamin").value,
    nama_orang_tua: document.getElementById("namaOrangTua").value || null,
    alamat: document.getElementById("alamat").value || null,
    no_hp: document.getElementById("noHp").value || null,
    status: document.getElementById("status").value
  };

  try {
    if (currentEditingId) {
      await apiRequest(`/api/masyarakats/${currentEditingId}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      alert("Data masyarakat berhasil diperbarui!");
    } else {
      await apiRequest('/api/masyarakats', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      alert("Data masyarakat berhasil dibuat!");
    }

    closeMasyarakatModal();
    loadMasyarakats(currentPage);
  } catch (error) {
    console.error('Error saving masyarakat:', error);
    alert('Gagal menyimpan data masyarakat');
  }
});

// Search and filter functionality
document.getElementById('searchMasyarakats').addEventListener('input', function(e) {
  loadMasyarakats(1); // Reset to first page when searching
});

document.getElementById('statusFilter').addEventListener('change', function(e) {
  loadMasyarakats(1); // Reset to first page when filtering
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

// Observe all fade-in elements and load initial data
document.addEventListener("DOMContentLoaded", function () {
  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((el) => {
    observer.observe(el);
  });

  // Load initial masyarakats data
  loadMasyarakats();
});
