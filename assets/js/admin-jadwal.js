// Global variables
let currentEditingId = null;
let schedulesData = [];
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
function openScheduleModal() {
  document.getElementById("scheduleModalTitle").textContent = "Tambah Jadwal Baru";
  document.getElementById("scheduleForm").reset();
  currentEditingId = null;
  document.getElementById("scheduleModal").classList.remove("hidden");
}

function closeScheduleModal() {
  document.getElementById("scheduleModal").classList.add("hidden");
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

  const fullUrl = `http://localhost:5000${url}`;
  const response = await fetch(fullUrl, { ...defaultOptions, ...options });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// Load schedules from API
async function loadSchedules(page = 1) {
  try {
    const response = await apiRequest(`/api/jadwals?page=${page}&limit=10`);
    schedulesData = response.data;
    currentPage = response.pagination.currentPage;
    totalPages = response.pagination.totalPages;

    renderSchedulesTable();
    updatePagination();
  } catch (error) {
    console.error('Error loading schedules:', error);
    alert('Gagal memuat data jadwal');
  }
}

// Render schedules table
function renderSchedulesTable() {
  const tbody = document.getElementById('scheduleTableBody');
  tbody.innerHTML = '';

  if (schedulesData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-gray-500">
          Tidak ada jadwal ditemukan
        </td>
      </tr>
    `;
    return;
  }

  schedulesData.forEach(schedule => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-green-50 transition-colors';

    const statusBadge = schedule.status === 'Terkonfirmasi' ?
      '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Terkonfirmasi</span>' :
      '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Menunggu Konfirmasi</span>';

    const actionButtons = schedule.status === 'Menunggu Konfirmasi' ?
      `<button onclick="confirmSchedule(${schedule.id})" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Konfirmasi</button>
       <button onclick="editSchedule(${schedule.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Edit</button>
       <button onclick="deleteSchedule(${schedule.id})" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Hapus</button>` :
      `<button onclick="editSchedule(${schedule.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Edit</button>
       <button onclick="deleteSchedule(${schedule.id})" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Hapus</button>
       <button onclick="duplicateSchedule(${schedule.id})" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Duplikasi</button>`;

    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <input type="checkbox" class="rounded border-green-300 text-green-600 focus:ring-green-500 row-select" data-id="${schedule.id}" />
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-green-900">${new Date(schedule.tanggal).toLocaleDateString('id-ID')}</div>
        <div class="text-sm text-green-500">${schedule.waktu_mulai} - ${schedule.waktu_selesai} WIB</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-green-900">${schedule.lokasi}</div>
        <div class="text-sm text-green-500">${schedule.alamat_lengkap || '-'}</div>
      </td>
      <td class="px-6 py-4">
        <div class="text-sm text-green-900">${schedule.layanan || '-'}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${statusBadge}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        ${actionButtons}
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

// CRUD functions
async function editSchedule(id) {
  try {
    const schedule = schedulesData.find(s => s.id == id);
    if (!schedule) {
      alert('Jadwal tidak ditemukan');
      return;
    }

    document.getElementById("scheduleModalTitle").textContent = "Edit Jadwal";
    document.getElementById("tanggalJadwal").value = schedule.tanggal;
    document.getElementById("waktuMulai").value = schedule.waktu_mulai;
    document.getElementById("waktuSelesai").value = schedule.waktu_selesai;
    document.getElementById("lokasiJadwal").value = schedule.lokasi;
    document.getElementById("alamatLengkap").value = schedule.alamat_lengkap || '';
    document.getElementById("keterangan").value = schedule.keterangan_tambahan || '';

    // Handle layanan checkboxes
    if (schedule.layanan) {
      const layananList = schedule.layanan.split(', ');
      layananList.forEach(layanan => {
        const checkboxId = getCheckboxIdFromLayanan(layanan);
        if (checkboxId) {
          document.getElementById(checkboxId).checked = true;
        }
      });
    }

    currentEditingId = id;
    document.getElementById("scheduleModal").classList.remove("hidden");
  } catch (error) {
    console.error('Error loading schedule for edit:', error);
    alert('Gagal memuat data jadwal untuk diedit');
  }
}

async function deleteSchedule(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
    return;
  }

  try {
    await apiRequest(`/api/jadwals/${id}`, { method: 'DELETE' });
    alert("Jadwal berhasil dihapus!");
    loadSchedules(currentPage);
  } catch (error) {
    console.error('Error deleting schedule:', error);
    alert('Gagal menghapus jadwal');
  }
}

async function confirmSchedule(id) {
  if (!confirm("Apakah Anda yakin ingin mengkonfirmasi jadwal ini?")) {
    return;
  }

  try {
    await apiRequest(`/api/jadwals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Terkonfirmasi' })
    });
    alert("Jadwal berhasil dikonfirmasi!");
    loadSchedules(currentPage);
  } catch (error) {
    console.error('Error confirming schedule:', error);
    alert('Gagal mengkonfirmasi jadwal');
  }
}

async function duplicateSchedule(id) {
  try {
    const schedule = schedulesData.find(s => s.id == id);
    if (!schedule) {
      alert('Jadwal tidak ditemukan');
      return;
    }

    // Create duplicate with next week's date
    const nextWeek = new Date(schedule.tanggal);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const duplicateData = {
      ...schedule,
      tanggal: nextWeek.toISOString().split('T')[0],
      id: undefined,
      created_at: undefined,
      updated_at: undefined
    };

    await apiRequest('/api/jadwals', {
      method: 'POST',
      body: JSON.stringify(duplicateData)
    });

    alert("Jadwal berhasil diduplikasi!");
    loadSchedules(currentPage);
  } catch (error) {
    console.error('Error duplicating schedule:', error);
    alert('Gagal menduplikasi jadwal');
  }
}

async function bulkConfirm() {
  const selected = document.querySelectorAll(".row-select:checked");
  if (selected.length === 0) {
    alert("Pilih jadwal yang ingin dikonfirmasi terlebih dahulu!");
    return;
  }

  if (!confirm(`Konfirmasi ${selected.length} jadwal terpilih?`)) {
    return;
  }

  try {
    const ids = Array.from(selected).map(checkbox => parseInt(checkbox.getAttribute('data-id')));

    await apiRequest('/api/jadwals/bulk/status', {
      method: 'PATCH',
      body: JSON.stringify({ ids: ids, status: 'Terkonfirmasi' })
    });

    alert(`${selected.length} jadwal berhasil dikonfirmasi!`);
    loadSchedules(currentPage);
  } catch (error) {
    console.error('Error bulk confirming schedules:', error);
    alert('Gagal mengkonfirmasi jadwal secara massal');
  }
}

function exportSchedule() {
  alert("Exporting jadwal...");
}

// Helper function to get checkbox ID from layanan text
function getCheckboxIdFromLayanan(layanan) {
  const mapping = {
    'Pemeriksaan Kesehatan Balita': 'layanan-pemeriksaan',
    'Imunisasi': 'layanan-imunisasi',
    'Timbang & Ukur': 'layanan-timbang',
    'Konsultasi Gizi': 'layanan-konsultasi'
  };
  return mapping[layanan.trim()];
}

// Get selected layanan from checkboxes
function getSelectedLayanan() {
  const checkboxes = document.querySelectorAll('#scheduleForm input[type="checkbox"]:checked');
  const layanan = Array.from(checkboxes).map(cb => {
    const label = document.querySelector(`label[for="${cb.id}"]`);
    return label ? label.textContent.trim() : '';
  }).filter(text => text);

  return layanan.join(', ');
}

// Select all functionality
document.getElementById("selectAllSchedule").addEventListener("change", function () {
  const checkboxes = document.querySelectorAll(".row-select");
  checkboxes.forEach((checkbox) => {
    checkbox.checked = this.checked;
  });
});

// Form submission
document.getElementById("scheduleForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = {
    tanggal: document.getElementById("tanggalJadwal").value,
    lokasi: document.getElementById("lokasiJadwal").value,
    waktu_mulai: document.getElementById("waktuMulai").value,
    waktu_selesai: document.getElementById("waktuSelesai").value,
    alamat_lengkap: document.getElementById("alamatLengkap").value,
    layanan: getSelectedLayanan(),
    keterangan_tambahan: document.getElementById("keterangan").value
  };

  try {
    if (currentEditingId) {
      await apiRequest(`/api/jadwals/${currentEditingId}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      alert("Jadwal berhasil diperbarui!");
    } else {
      await apiRequest('/api/jadwals', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      alert("Jadwal berhasil dibuat!");
    }

    closeScheduleModal();
    loadSchedules(currentPage);
  } catch (error) {
    console.error('Error saving schedule:', error);
    alert('Gagal menyimpan jadwal');
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

// Observe all fade-in elements and load initial data
document.addEventListener("DOMContentLoaded", function () {
  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((el) => {
    observer.observe(el);
  });

  // Load initial schedules data
  loadSchedules();
});
