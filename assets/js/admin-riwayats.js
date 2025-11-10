// Global variables
let currentEditingId = null;
let riwayatsData = [];
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
function openRiwayatModal() {
  document.getElementById("riwayatModalTitle").textContent = "Tambah Riwayat Baru";
  document.getElementById("riwayatForm").reset();
  currentEditingId = null;
  document.getElementById("riwayatModal").classList.remove("hidden");
}

function closeRiwayatModal() {
  document.getElementById("riwayatModal").classList.add("hidden");
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

// Load riwayats from API
async function loadRiwayats(page = 1) {
  try {
    const response = await apiRequest(`/api/riwayats?page=${page}&limit=10`);
    riwayatsData = response.data;
    currentPage = response.pagination.currentPage;
    totalPages = response.pagination.totalPages;

    renderRiwayatsTable();
    updatePagination();
    updateStats();
  } catch (error) {
    console.error('Error loading riwayats:', error);
    alert('Gagal memuat data riwayat');
  }
}

// Render riwayats table
function renderRiwayatsTable() {
  const tbody = document.getElementById('riwayatsTableBody');
  tbody.innerHTML = '';

  if (riwayatsData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-8 text-center text-gray-500">
          Tidak ada riwayat ditemukan
        </td>
      </tr>
    `;
    return;
  }

  riwayatsData.forEach(riwayat => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-green-50 transition-colors';

    const createdDate = new Date(riwayat.created_at).toLocaleDateString('id-ID');

    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-green-900">${createdDate}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-green-900">${riwayat.berat_badan} g</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-green-900">${riwayat.tinggi_badan} mm</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-green-900">${riwayat.lingkar_kepala || '-'} mm</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-green-900">${riwayat.lingkar_lengan || '-'} mm</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-green-900">${riwayat.lingkar_badan || '-'} mm</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button onclick="editRiwayat(${riwayat.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Edit</button>
        <button onclick="deleteRiwayat(${riwayat.id})" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Hapus</button>
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
  const totalRiwayats = riwayatsData.length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyRiwayats = riwayatsData.filter(riwayat => {
    const riwayatDate = new Date(riwayat.created_at);
    return riwayatDate.getMonth() === currentMonth && riwayatDate.getFullYear() === currentYear;
  }).length;

  const avgWeight = riwayatsData.length > 0
    ? Math.round(riwayatsData.reduce((sum, r) => sum + r.berat_badan, 0) / riwayatsData.length)
    : 0;

  document.getElementById('totalRiwayats').textContent = totalRiwayats;
  document.getElementById('monthlyRiwayats').textContent = monthlyRiwayats;
  document.getElementById('avgWeight').textContent = `${avgWeight} g`;
}

// CRUD functions
async function editRiwayat(id) {
  try {
    const riwayat = riwayatsData.find(r => r.id == id);
    if (!riwayat) {
      alert('Riwayat tidak ditemukan');
      return;
    }

    document.getElementById("riwayatModalTitle").textContent = "Edit Riwayat";
    document.getElementById("beratBadan").value = riwayat.berat_badan;
    document.getElementById("tinggiBadan").value = riwayat.tinggi_badan;
    document.getElementById("lingkarKepala").value = riwayat.lingkar_kepala || '';
    document.getElementById("lingkarLengan").value = riwayat.lingkar_lengan || '';
    document.getElementById("lingkarBadan").value = riwayat.lingkar_badan || '';

    currentEditingId = id;
    document.getElementById("riwayatModal").classList.remove("hidden");
  } catch (error) {
    console.error('Error loading riwayat for edit:', error);
    alert('Gagal memuat data riwayat untuk diedit');
  }
}

async function deleteRiwayat(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus riwayat ini?")) {
    return;
  }

  try {
    await apiRequest(`/api/riwayats/${id}`, { method: 'DELETE' });
    alert("Riwayat berhasil dihapus!");
    loadRiwayats(currentPage);
  } catch (error) {
    console.error('Error deleting riwayat:', error);
    alert('Gagal menghapus riwayat');
  }
}

function exportRiwayats() {
  alert("Exporting riwayats...");
}

// Form submission
document.getElementById("riwayatForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = {
    berat_badan: parseInt(document.getElementById("beratBadan").value),
    tinggi_badan: parseInt(document.getElementById("tinggiBadan").value),
    lingkar_kepala: document.getElementById("lingkarKepala").value ? parseInt(document.getElementById("lingkarKepala").value) : null,
    lingkar_lengan: document.getElementById("lingkarLengan").value ? parseInt(document.getElementById("lingkarLengan").value) : null,
    lingkar_badan: document.getElementById("lingkarBadan").value ? parseInt(document.getElementById("lingkarBadan").value) : null
  };

  try {
    if (currentEditingId) {
      await apiRequest(`/api/riwayats/${currentEditingId}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      alert("Riwayat berhasil diperbarui!");
    } else {
      await apiRequest('/api/riwayats', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      alert("Riwayat berhasil dibuat!");
    }

    closeRiwayatModal();
    loadRiwayats(currentPage);
  } catch (error) {
    console.error('Error saving riwayat:', error);
    alert('Gagal menyimpan riwayat');
  }
});

// Search functionality
document.getElementById('searchRiwayats').addEventListener('input', function(e) {
  const searchTerm = e.target.value.toLowerCase();
  const filteredRiwayats = riwayatsData.filter(riwayat =>
    riwayat.berat_badan.toString().includes(searchTerm) ||
    riwayat.tinggi_badan.toString().includes(searchTerm) ||
    (riwayat.lingkar_kepala && riwayat.lingkar_kepala.toString().includes(searchTerm)) ||
    (riwayat.lingkar_lengan && riwayat.lingkar_lengan.toString().includes(searchTerm)) ||
    (riwayat.lingkar_badan && riwayat.lingkar_badan.toString().includes(searchTerm))
  );

  renderFilteredRiwayats(filteredRiwayats);
});

function renderFilteredRiwayats(filteredData) {
  const tbody = document.getElementById('riwayatsTableBody');
  tbody.innerHTML = '';

  if (filteredData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-8 text-center text-gray-500">
          Tidak ada riwayat yang sesuai dengan pencarian
        </td>
      </tr>
    `;
    return;
  }

  filteredData.forEach(riwayat => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-green-50 transition-colors';

    const createdDate = new Date(riwayat.created_at).toLocaleDateString('id-ID');

    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-green-900">${createdDate}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-green-900">${riwayat.berat_badan} g</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-green-900">${riwayat.tinggi_badan} mm</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-green-900">${riwayat.lingkar_kepala || '-'} mm</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-green-900">${riwayat.lingkar_lengan || '-'} mm</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-green-900">${riwayat.lingkar_badan || '-'} mm</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button onclick="editRiwayat(${riwayat.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Edit</button>
        <button onclick="deleteRiwayat(${riwayat.id})" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Hapus</button>
      </td>
    `;

    tbody.appendChild(row);
  });
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

// Observe all fade-in elements and load initial data
document.addEventListener("DOMContentLoaded", function () {
  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((el) => {
    observer.observe(el);
  });

  // Load initial riwayats data
  loadRiwayats();
});
