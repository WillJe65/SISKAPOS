// --- Helper untuk API & Navigasi ---

// Fungsi untuk mendapatkan token dari localStorage
function getToken() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Anda belum login. Silakan login terlebih dahulu.');
    window.location.href = 'dashboard.html';
    return null;
  }
  return token;
}

// Pengaturan header untuk request API
function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

function goBack() {
  window.location.href = 'admin_dashboard.html';
}

function logout() {
  if (confirm('Apakah Anda yakin ingin logout?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'dashboard.html';
  }
}

// --- Fungsi Modal ---

const scheduleModal = document.getElementById('scheduleModal');
const scheduleForm = document.getElementById('scheduleForm');
const modalTitle = document.getElementById('scheduleModalTitle');

// Menyimpan ID jadwal yang sedang diedit
let currentEditId = null;

// Membuka modal untuk menambah atau mengedit jadwal
function openScheduleModal(id = null) {
  scheduleForm.reset();
  currentEditId = id;

  if (id) {
    modalTitle.textContent = 'Edit Jadwal';
    fetch(`/api/jadwal/${id}`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((response) => {
        if (response.success) {
          fillForm(response.data);
        } else {
          alert(`Gagal mengambil data: ${response.message}`);
        }
      });
  } else {
    modalTitle.textContent = 'Tambah Jadwal Baru';
  }

  scheduleModal.classList.remove('hidden');
}

// Menutup modal jadwal
function closeScheduleModal() {
  scheduleModal.classList.add('hidden');
  currentEditId = null;
}

// --- Logika CRUD (Create, Read, Update, Delete) ---

// Memuat data saat halaman dibuka
document.addEventListener('DOMContentLoaded', () => {
  loadSchedules();
  setupFormListener();
  setupSelectAllListener();
});

// Memuat semua data jadwal dari API
async function loadSchedules() {
  const token = getToken();
  if (!token) return;

  try {
    const response = await fetch('/api/jadwal', {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401)
        throw new Error('Otentikasi gagal, silakan login ulang.');
      throw new Error('Gagal memuat data jadwal.');
    }

    const result = await response.json();
    if (result.success) {
      populateTable(result.data);
      updateStats(result.data);
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (error) {
    console.error('Error loading schedules:', error);
    alert(error.message);
  }
}

// Memperbarui kartu statistik
function updateStats(schedules) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthSchedules = schedules.filter((s) => {
    const scheduleDate = new Date(s.tanggal);
    return (
      scheduleDate.getMonth() === currentMonth &&
      scheduleDate.getFullYear() === currentYear
    );
  });

  const pending = schedules.filter(
    (s) => s.status === 'Menunggu Konfirmasi'
  ).length;
  const confirmed = schedules.filter(
    (s) => s.status === 'Terkonfirmasi'
  ).length;

  document.getElementById('stat-bulan-ini').textContent =
    thisMonthSchedules.length;
  document.getElementById('stat-menunggu').textContent = pending;
  document.getElementById('stat-terkonfirmasi').textContent = confirmed;
}

// Mengisi tabel dengan data jadwal
function populateTable(schedules) {
  const tableBody = document.getElementById('scheduleTableBody');
  tableBody.innerHTML = '';

  if (schedules.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="7" class="text-center p-6 text-green-700">Belum ada jadwal.</td></tr>';
    return;
  }

  schedules.forEach((s) => {
    const statusClass =
      s.status === 'Terkonfirmasi'
        ? 'bg-green-100 text-green-800'
        : 'bg-orange-100 text-orange-800';

    const formattedDate = new Date(s.tanggal).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const actionButtons = `
      ${
        s.status === 'Menunggu Konfirmasi'
          ? `<button onclick="confirmSchedule(${s.id})" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Konfirmasi</button>`
          : ''
      }
      <button onclick="openScheduleModal(${
        s.id
      })" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Edit</button>
      <button onclick="deleteSchedule(${
        s.id
      })" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Hapus</button>
      <button onclick="duplicateSchedule(${
        s.id
      })" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Duplikasi</button>
    `;

    const row = `
      <tr class="hover:bg-green-50 transition-colors">
        <td class="px-6 py-4 whitespace-nowrap">
          <input type="checkbox" class="rounded border-green-300 text-green-600 focus:ring-green-500 row-select" data-id="${
            s.id
          }">
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm font-medium text-green-900">${formattedDate}</div>
          <div class="text-sm text-green-500">${s.waktu_mulai} - ${
      s.waktu_selesai
    } WIB</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm font-medium text-green-900">${s.lokasi}</div>
          <div class="text-sm text-green-500">${s.alamat_lengkap || '-'}</div>
        </td>
        <td class="px-6 py-4">
          <div class="text-sm text-green-900">${s.layanan || 'Layanan Umum'}</div>
          <div class="text-sm text-green-500">${
            s.keterangan_tambahan || '-'
          }</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
            ${s.status}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
          ${actionButtons}
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
}

// Event listener untuk submit form (Create/Update)
function setupFormListener() {
  scheduleForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const layananCheckboxes = document.querySelectorAll(
      '#scheduleForm input[type="checkbox"]:checked'
    );
    const layananLabels = Array.from(layananCheckboxes).map((cb) => {
      const label = document.querySelector(`label[for="${cb.id}"]`);
      return label ? label.textContent.trim() : '';
    });
    const layananString = layananLabels.join(', ');

    const lokasiSelect = document.getElementById('lokasiJadwal');
    const lokasiText = lokasiSelect.options[lokasiSelect.selectedIndex].text;

    const formData = {
      tanggal: document.getElementById('tanggalJadwal').value,
      waktu_mulai: document.getElementById('waktuMulai').value,
      waktu_selesai: document.getElementById('waktuSelesai').value,
      lokasi: lokasiText,
      alamat_lengkap: document.getElementById('alamatLengkap').value,
      layanan: layananString,
      keterangan_tambahan: document.getElementById('keterangan').value,
    };

    let url = '/api/jadwal';
    let method = 'POST';

    if (currentEditId) {
      url = `/api/jadwal/${currentEditId}`;
      method = 'PUT';
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        closeScheduleModal();
        loadSchedules();
      } else {
        alert(`Gagal menyimpan: ${result.message}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Terjadi kesalahan saat menyimpan data.');
    }
  });
}

// Fungsi hapus jadwal (Delete)
async function deleteSchedule(id) {
  if (confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
    try {
      const response = await fetch(`/api/jadwal/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        loadSchedules();
      } else {
        alert(`Gagal menghapus: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Terjadi kesalahan.');
    }
  }
}

// Fungsi konfirmasi jadwal (Update Status)
async function confirmSchedule(id) {
  if (confirm('Apakah Anda yakin ingin mengkonfirmasi jadwal ini?')) {
    try {
      const response = await fetch(`/api/jadwal/${id}/confirm`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        loadSchedules();
      } else {
        alert(`Gagal konfirmasi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error confirming schedule:', error);
      alert('Terjadi kesalahan.');
    }
  }
}

// Fungsi duplikasi jadwal (Create)
async function duplicateSchedule(id) {
  if (
    confirm(
      'Duplikasi jadwal ini? (Form akan diisi otomatis, Anda perlu menyimpan manual)'
    )
  ) {
    try {
      const response = await fetch(`/api/jadwal/${id}`, {
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      if (result.success) {
        openScheduleModal(null);
        fillForm(result.data);
        document.getElementById('tanggalJadwal').value = '';
        modalTitle.textContent = 'Duplikasi Jadwal (Silakan atur tanggal)';
      } else {
        alert(`Gagal mengambil data untuk duplikasi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error duplicating schedule:', error);
    }
  }
}

// Helper untuk mengisi form (digunakan oleh Edit dan Duplikasi)
function fillForm(data) {
  document.getElementById('tanggalJadwal').value = data.tanggal.split('T')[0];
  document.getElementById('waktuMulai').value = data.waktu_mulai;
  document.getElementById('waktuSelesai').value = data.waktu_selesai;
  document.getElementById('alamatLengkap').value = data.alamat_lengkap;
  document.getElementById('keterangan').value = data.keterangan_tambahan;

  const lokasiSelect = document.getElementById('lokasiJadwal');
  Array.from(lokasiSelect.options).forEach((option) => {
    if (option.text === data.lokasi) {
      option.selected = true;
    }
  });

  const layananString = data.layanan || '';
  document
    .querySelectorAll('#scheduleForm input[type="checkbox"]')
    .forEach((cb) => {
      const label = document.querySelector(`label[for="${cb.id}"]`);
      if (label && layananString.includes(label.textContent.trim())) {
        cb.checked = true;
      } else {
        cb.checked = false;
      }
    });
}

// --- Fungsi Aksi Massal (Bulk) ---

// Konfirmasi jadwal yang terpilih
async function bulkConfirm() {
  const selectedCheckboxes = document.querySelectorAll('.row-select:checked');
  if (selectedCheckboxes.length === 0) {
    alert('Pilih jadwal yang ingin dikonfirmasi terlebih dahulu!');
    return;
  }

  const idsToConfirm = Array.from(selectedCheckboxes).map(
    (cb) => cb.dataset.id
  );

  if (confirm(`Konfirmasi ${idsToConfirm.length} jadwal terpilih?`)) {
    try {
      const response = await fetch('/api/jadwal/bulk-confirm', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: idsToConfirm }),
      });
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        loadSchedules();
      } else {
        alert(`Gagal konfirmasi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error bulk confirming:', error);
      alert('Terjadi kesalahan.');
    }
  }
}

// Logika untuk checkbox 'Pilih Semua'
function setupSelectAllListener() {
  const selectAll = document.getElementById('selectAllSchedule');
  selectAll.addEventListener('change', function () {
    const checkboxes = document.querySelectorAll('.row-select');
    checkboxes.forEach((checkbox) => {
      checkbox.checked = this.checked;
    });
  });

  const tableHeadCheckbox = document.querySelector(
    'thead input[type="checkbox"]'
  );
  if (tableHeadCheckbox) {
    tableHeadCheckbox.addEventListener('change', function () {
      const checkboxes = document.querySelectorAll('.row-select');
      checkboxes.forEach((checkbox) => {
        checkbox.checked = this.checked;
      });
      selectAll.checked = this.checked;
    });
  }
}

// --- Animasi ---
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px',
};
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', function () {
  const fadeElements = document.querySelectorAll('.fade-in');
  fadeElements.forEach((el) => {
    observer.observe(el);
  });
});