// admin-edit-akun.js
let currentGenderFilter = "all"; // Menyimpan filter gender yang aktif
let currentSearch = ""; // <-- PERUBAHAN: Menyimpan query pencarian
let editingId = null; // Menyimpan ID yang sedang diedit
let debug = true; // Enable debug logging

// Utility functions for consistent token handling and debugging
function getAuthToken() {
    const token = localStorage.getItem('token');
    if (debug) console.log('Token retrieved:', token ? 'Present' : 'Missing');
    return token;
}

function handleTokenError() {
    console.warn('No token found or token expired');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

function logError(message, error) {
    console.error(`[Error] ${message}:`, error);
    console.error('Stack:', error.stack);
}

// Fungsi navigasi
function goBack() {
  window.location.href = "admin_dashboard.html";
}

function logout() {
  if (confirm("Apakah Anda yakin ingin logout?")) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = "dashboard.html";
  }
}

// Fungsi untuk modal (tambah/edit)
function openAddModal() {
  document.getElementById("modalTitle").textContent = "Tambah Akun Baru";
  document.getElementById("accountForm").reset();
  
  // Show username/password fields for new accounts
  document.getElementById("userCredentials").classList.remove("hidden");
  document.getElementById("username").required = true;
  document.getElementById("password").required = true;
  
  document.getElementById("accountModal").classList.remove("hidden");
  editingId = null;
}

function closeModal() {
  document.getElementById("accountModal").classList.add("hidden");
  editingId = null;
}

function editAccount(id) {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  fetch(`http://localhost:5000/api/accounts/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then((res) => {
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = 'login.html';
          throw new Error('Sesi habis. Silakan login kembali.');
        }
        throw new Error('Gagal mengambil data');
      }
      return res.json();
    })
    .then((item) => {
      document.getElementById('modalTitle').textContent = 'Edit Akun';
      document.getElementById('namaLengkap').value = item.nama_lengkap || '';
      document.getElementById('umurModal').value = item.umur_bulan || '';
      document.getElementById('jenisKelaminModal').value = item.jenis_kelamin ? item.jenis_kelamin.toLowerCase() : '';
      document.getElementById('namaOrangTua').value = item.nama_orang_tua || '';
      document.getElementById('alamat').value = item.alamat || '';
      document.getElementById('nomorHP').value = item.nomor_hp || '';

      // Hide and disable username/password fields when editing
      document.getElementById("userCredentials").classList.add("hidden");
      document.getElementById("username").required = false;
      document.getElementById("password").required = false;

      editingId = id;
      document.getElementById('accountModal').classList.remove('hidden');
    })
    .catch((err) => {
      console.error('fetch error', err);
      alert('Gagal mengambil data untuk diedit: ' + err.message);
    });
}

function deleteAccount(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus akun ini? Data yang sudah dihapus tidak dapat dikembalikan.')) return;
  
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Show loading overlay
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (row) {
    row.style.opacity = '0.5';
    row.style.pointerEvents = 'none';
  }

  fetch(`http://localhost:5000/api/accounts/${id}`, { 
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(async (res) => {
  // PERBAIKAN: Handle response dengan benar
  const responseText = await res.text();
  let data;
  
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch (e) {
    console.error('JSON parse error:', e);
    throw new Error('Format respons server tidak valid');
  }

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
      throw new Error('Sesi habis. Silakan login kembali.');
    }
    throw new Error(data.message || data.error || 'Gagal menghapus data');
  }
  
  return data;
})
    .then((data) => {
  if (data.success === false) {
    throw new Error(data.message || 'Gagal menghapus akun');
  }
  
  showNotification(data.message || 'Akun berhasil dihapus!', 'success');
  loadAccounts(currentPage); // Refresh the table
})
}

// Fungsi untuk menangani submit form
document.getElementById('accountForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  
  if (debug) console.log('Form submission started');
  
  // Show loading state
  const submitButton = document.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  
  try {
    const formData = {
      nama_lengkap: document.getElementById('namaLengkap').value.trim(),
      umur_bulan: Number(document.getElementById('umurModal').value),
      jenis_kelamin: document.getElementById('jenisKelaminModal').value,
      nama_orang_tua: document.getElementById('namaOrangTua').value.trim(),
      alamat: document.getElementById('alamat').value.trim(),
      nomor_hp: document.getElementById('nomorHP').value.trim(),
    };

    if (debug) console.log('Form data collected:', formData);

    // Validasi nomor HP (hanya angka dan minimal 10 digit)
    const phoneRegex = /^[0-9]{10,}$/;
    if (formData.nomor_hp && !phoneRegex.test(formData.nomor_hp)) {
      throw new Error('Nomor HP harus berisi minimal 10 digit angka.');
    }

    // Validasi nama lengkap (minimal 3 karakter)
    if (formData.nama_lengkap.length < 3) {
      throw new Error('Nama lengkap harus minimal 3 karakter.');
    }

    // For new accounts, username is required and will trigger user creation
    if (!editingId) {
      formData.username = document.getElementById('username').value.trim();
      formData.password = document.getElementById('password').value.trim();

      if (!formData.username || formData.username.length < 4) {
        throw new Error('Username wajib diisi dan minimal 4 karakter.');
      }

      // Password validation for new accounts
      if (!formData.password || formData.password.length < 6) {
        throw new Error('Password wajib diisi dan minimal 6 karakter.');
      }
    }

    // Basic validation
    if (!formData.nama_lengkap || isNaN(formData.umur_bulan) || !formData.jenis_kelamin) {
      throw new Error('Nama, umur, dan jenis kelamin wajib diisi.');
    }

    // Normalize jenis_kelamin to match DB enum ('Laki-laki' or 'Perempuan')
    if (formData.jenis_kelamin) {
      const jk = String(formData.jenis_kelamin).toLowerCase();
      if (jk.includes('laki')) formData.jenis_kelamin = 'Laki-laki';
      else if (jk.includes('perempuan')) formData.jenis_kelamin = 'Perempuan';
      else {
        throw new Error('Nilai jenis kelamin tidak valid');
      }
    }

    const token = getAuthToken();
    if (!token) {
      handleTokenError();
      return;
    }

    const url = editingId 
      ? `http://localhost:5000/api/accounts/${editingId}`
      : 'http://localhost:5000/api/accounts';

    if (debug) console.log('Making API request to:', url);

    submitButton.innerHTML = `
      <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Menyimpan...
    `;
    submitButton.disabled = true;

    if (debug) {
      console.log('Sending request with data:', {
        url,
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.substring(0, 10) + '...',
          'Accept': 'application/json'
        },
        body: formData
      });
    }

    // Log the request details in debug mode
    if (debug) {
      console.log('Sending edit request:', {
        url,
        method: editingId ? 'PUT' : 'POST',
        formData
      });
    }

    const response = await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(formData),
    }).catch(error => {
      console.error('Network error:', error);
      throw new Error('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    });

    if (debug) console.log('API Response status:', response.status);

    const responseText = await response.text();
let data;

try {
  data = responseText ? JSON.parse(responseText) : {};
  if (debug) console.log('Parsed API Response data:', data);
} catch (parseError) {
  console.error('JSON Parse Error:', parseError);
  throw new Error('Format respons server tidak valid');
}

if (!response.ok) {
  const errorMessage = data.message || data.error || `Error ${response.status}`;
  
  if (response.status === 401) {
    handleTokenError();
    throw new Error('Sesi habis. Silakan login kembali.');
  }
  
  throw new Error(errorMessage);
}

    if (!response.ok) {
      console.error('Server response not OK:', { status: response.status, statusText: response.statusText, data: data });

      // If the server provided a message, show it. Fall back to generic messages.
      const serverMessage = data && (data.message || data.error || (data.details && data.details.sqlMessage));

      if (response.status === 401) {
        handleTokenError();
        throw new Error(serverMessage || 'Sesi habis. Silakan login kembali.');
      }
      if (response.status === 400) {
        throw new Error(serverMessage || (data && data.message) || 'Data yang dimasukkan tidak valid');
      }
      // For 5xx errors prefer server message if available
      if (response.status >= 500) {
        throw new Error(serverMessage || 'Terjadi kesalahan pada server. Silakan coba lagi nanti.');
      }
      throw new Error(serverMessage || `Error ${response.status}: Gagal menyimpan data`);
    }

     // For successful edit/create, response should have success flag or message
    if (!data || (typeof data !== 'object' && !data.message)) {
      console.error('Invalid response structure:', data);
      throw new Error('Format data dari server tidak sesuai');
    }

    closeModal();
showNotification(
  data.message || (editingId ? 'Data akun berhasil diperbarui!' : 'Akun baru berhasil ditambahkan!'), 
  'success'
);    // Reset to first page when adding new account, stay on current page when editing
    await loadAccounts(editingId ? currentPage : 1);
    
  } catch (err) {
    logError('Form submission failed', err);
    showNotification(err.message, 'error');
  } finally {
    // Restore button state
    submitButton.innerHTML = originalButtonText;
    submitButton.disabled = false;
  }
});
  

// =======================================================
// PERBAIKAN LOGIKA FILTER DIMULAI DI SINI
// =======================================================
// Fungsi untuk filter dan pencarian
function applyFilters() {
  // Logika search dihapus dari sini, karena sudah ditangani backend
  const tableBody = document.getElementById("accountTableBody");
  const tableRows = tableBody.getElementsByTagName("tr");

  for (const row of tableRows) {
    const genderCell = row.getElementsByTagName("td")[3]; // Asumsi kolom ke-4

    if (genderCell) {
      const genderText = (genderCell.textContent || genderCell.innerText)
        .trim()
        .toLowerCase();

      // Pencocokan HANYA berdasarkan filter gender
      const genderMatch =
        currentGenderFilter === "all" || genderText === currentGenderFilter;

      row.style.display = (genderMatch) ? "" : "none";
    }
  }
}

function filterData(gender) {
  currentGenderFilter = gender;
  // Panggil applyFilters, BUKAN loadAccounts
  // karena kita hanya ingin memfilter data yang sudah ada di halaman
  applyFilters();
}
// =======================================================
// PERBAIKAN LOGIKA FILTER BERAKHIR DI SINI
// =======================================================


// Fungsi untuk merender tabel dengan data dinamis
function renderAccountTable(data) {
  const tableBody = document.getElementById('accountTableBody');
  const container = document.querySelector('.card-hover');
  
  // Kosongkan tabel
  tableBody.innerHTML = '';
  
  // Jika tidak ada data, tampilkan pesan
  if (!data || data.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-green-600">
          <div class="flex flex-col items-center">
            <svg class="w-12 h-12 text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.88-6.09-2.32M3 12h.01M21 12h.01"></path>
            </svg>
            <p class="text-lg font-medium">Tidak ada data akun yang ditemukan</p>
            <p class="text-sm text-gray-500">Coba ubah kata kunci pencarian Anda.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  // Render setiap baris data
  data.forEach((account) => {
    tableBody.appendChild(renderAccountRow(account));
  });
  
  // Setup checkbox "Pilih Semua"
  setupSelectAllCheckbox();
}

// Render pagination controls
function renderPagination(pagination) {
  // Remove existing pagination if any
  const existingPagination = document.getElementById('pagination-controls');
  if (existingPagination) {
    existingPagination.remove();
  }

  const container = document.querySelector('.card-hover');
  const paginationHtml = `
    <div id="pagination-controls" class="px-6 py-4 border-t border-green-100">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <p class="text-sm text-green-600">
            Menampilkan ${(pagination.currentPage - 1) * pagination.limit + 1} - 
            ${Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} 
            dari ${pagination.totalRecords} data
          </p>
        </div>
        <div class="flex gap-2">
          ${generatePaginationButtons(pagination)}
        </div>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', paginationHtml);

  // Add event listeners to pagination buttons
  document.querySelectorAll('.pagination-button').forEach(button => {
    button.addEventListener('click', () => {
      const page = parseInt(button.dataset.page);
      if (page !== pagination.currentPage) {
        loadAccounts(page);
      }
    });
  });
}

// Generate pagination buttons HTML
function generatePaginationButtons(pagination) {
  const { currentPage, totalPages } = pagination;
  let buttons = [];

  // Previous button
  buttons.push(`
    <button 
      class="pagination-button px-3 py-1 rounded-md text-sm ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-700 hover:bg-green-200'}"
      ${currentPage === 1 ? 'disabled' : `data-page="${currentPage - 1}"`}
    >
      Sebelumnya
    </button>
  `);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || // First page
      i === totalPages || // Last page
      (i >= currentPage - 1 && i <= currentPage + 1) // Pages around current
    ) {
      buttons.push(`
        <button 
          class="pagination-button px-3 py-1 rounded-md text-sm ${i === currentPage ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}"
          data-page="${i}"
        >
          ${i}
        </button>
      `);
    } else if (
      (i === currentPage - 2 && currentPage > 3) ||
      (i === currentPage + 2 && currentPage < totalPages - 2)
    ) {
      buttons.push(`<span class="px-2 text-green-600">...</span>`);
    }
  }

  // Next button
  buttons.push(`
    <button 
      class="pagination-button px-3 py-1 rounded-md text-sm ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-700 hover:bg-green-200'}"
      ${currentPage === totalPages ? 'disabled' : `data-page="${currentPage + 1}"`}
    >
      Selanjutnya
    </button>
  `);

  return buttons.join('');
}

// Render a single row in the table
function renderAccountRow(account) {
  const tr = document.createElement('tr');
  tr.className = 'hover:bg-green-50 transition-colors';
  tr.dataset.id = account.id; // Add data-id attribute

  // Format the row data
  const isLaki = account.jenis_kelamin && account.jenis_kelamin.toLowerCase().includes('laki');
  const avatarColor = isLaki ? 'blue' : 'pink';
  const genderBadgeColor = isLaki ? 'blue' : 'pink';
  
  // Get initials safely
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ')
              .map(word => word[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();
  };

  // Get initials for avatar
  const initials = account.nama_lengkap 
    ? account.nama_lengkap.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()
    : '??';

  tr.innerHTML = `
    <td class="px-6 py-4 whitespace-nowrap">
      <input type="checkbox" class="rounded border-green-300 text-green-600 focus:ring-green-500 row-select" />
    </td>
    <td class="px-6 py-4 whitespace-nowrap">
      <div class="flex items-center">
        <div class="w-10 h-10 bg-gradient-to-br from-${avatarColor}-500 to-${avatarColor}-600 rounded-full flex items-center justify-center mr-3">
          <span class="text-white font-medium">${getInitials(account.nama_lengkap)}</span>
        </div>
        <div>
          <div class="text-sm font-medium text-green-900">${account.nama_lengkap || 'N/A'}</div>
          <div class="text-sm text-green-500">
            <span class="font-medium">Username:</span> ${account.username || 'N/A'}
          </div>
        </div>
      </div>
    </td>
    <td class="px-6 py-4 whitespace-nowrap">
      <div class="text-sm text-green-600">${account.umur_bulan || 0} bulan</div>
      <div class="text-xs text-green-500">${account.nama_orang_tua ? 'Ortu: ' + account.nama_orang_tua : ''}</div>
    </td>
    <td class="px-6 py-4 whitespace-nowrap">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${genderBadgeColor}-100 text-${genderBadgeColor}-800">
        ${account.jenis_kelamin || 'N/A'}
      </span>
      ${account.nomor_hp ? `
        <div class="text-xs text-green-500 mt-1">
          <span class="font-medium">HP:</span> ${account.nomor_hp}
        </div>
      ` : ''}
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
      <button onclick="editAccount('${account.id}')" 
              class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">
        Edit
      </button>
      <button onclick="deleteAccount('${account.id}')" 
              class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">
        Hapus
      </button>
    </td>
  `;

  return tr;
}

// Fungsi untuk setup checkbox "Pilih Semua"
function setupSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById('selectAll');
  const rowCheckboxes = document.querySelectorAll('.row-select');
  
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function() {
      rowCheckboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
      });
    });
    
    // Update status "Pilih Semua" ketika checkbox baris diubah
    rowCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const allChecked = Array.from(rowCheckboxes).every(cb => cb.checked);
        const someChecked = Array.from(rowCheckboxes).some(cb => cb.checked);
        
        if (allChecked) {
          selectAllCheckbox.checked = true;
          selectAllCheckbox.indeterminate = false;
        } else if (someChecked) {
          selectAllCheckbox.checked = false;
          selectAllCheckbox.indeterminate = true;
        } else {
          selectAllCheckbox.checked = false;
          selectAllCheckbox.indeterminate = false;
        }
      });
    });
  }
}

// State untuk pagination
let currentPage = 1;
const itemsPerPage = 10;

// =======================================================
// PERBAIKAN LOGIKA LOAD DATA DIMULAI DI SINI
// =======================================================
async function loadAccounts(page = 1) {
  const tableBody = document.getElementById('accountTableBody');
  
  if (debug) {
    console.log(`Loading accounts - Page: ${page}, Search: '${currentSearch}'`);
  }

  try {
    const token = getAuthToken();
    if (!token) {
      console.warn('No token found in localStorage');
      handleTokenError();
      return;
    }

    if (debug) {
      console.log('Using token:', token.substring(0, 10) + '...');
    }

    // Show loading state
    const loadingHtml = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-green-600">
          <div class="flex flex-col items-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            <p class="mt-2">Memuat data...</p>
          </div>
        </td>
      </tr>
    `;
    
    tableBody.innerHTML = loadingHtml;
    
    // PERUBAHAN: Tambahkan parameter 'search' ke URL
    const apiUrl = `http://localhost:5000/api/accounts?page=${page}&limit=${itemsPerPage}&search=${encodeURIComponent(currentSearch)}`;
    
    if (debug) console.log('Making API request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'same-origin'
    }).catch(error => {
      console.error('Network error:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Tidak dapat terhubung ke server. Pastikan server berjalan di http://localhost:5000');
      }
      throw new Error('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    });

    if (debug) {
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    }

    // Get the raw response text first
    const responseText = await response.text().catch(error => {
      console.error('Error reading response:', error);
      throw new Error('Gagal membaca respons dari server');
    });

    if (debug) {
      console.log('Raw server response:', responseText);
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      if (debug) console.log('API response:', responseData);
    } catch (error) {
      console.error('JSON Parse Error:', error);
      console.error('Response Text:', responseText);
      throw new Error('Format respons server tidak valid');
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        throw new Error('Sesi habis. Silakan login kembali.');
      }
      throw new Error(responseData.message || `Error ${response.status}: Gagal memuat data`);
    }

    if (!responseData || !responseData.data) {
      throw new Error('Format data tidak valid');
    }

    const { data, pagination } = responseData;
    currentPage = pagination.currentPage;
    
    // Render table content
    renderAccountTable(data);
    
    // Render pagination controls
    renderPagination(pagination);
    
    // PERUBAHAN: Terapkan filter GENDER ke data yang baru dimuat
    applyFilters();

  } catch (err) {
    console.error('Failed to load accounts:', err);
    
    // Show error state
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-red-600">
          <div class="flex flex-col items-center">
            <svg class="w-12 h-12 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-lg font-medium">Gagal memuat data</p>
            <p class="text-sm mt-1">${err.message}</p>
          </div>
        </td>
      </tr>
    `;
  }

}
// =======================================================
// PERBAIKAN LOGIKA LOAD DATA BERAKHIR DI SINI
// =======================================================


// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'info') {
  // Buat elemen notifikasi
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
    type === 'success' ? 'bg-green-500 text-white' : 
    type === 'error' ? 'bg-red-500 text-white' : 
    'bg-blue-500 text-white'
  }`;
  notification.innerHTML = `
    <div class="flex items-center">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>${message}</span>
    </div>
  `;
  
  // Tambahkan ke body
  document.body.appendChild(notification);
  
  // Animasi masuk
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 10);
  
  // Hapus setelah 3 detik
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Event listeners dan inisialisasi
document.addEventListener("DOMContentLoaded", async function () {
  if (debug) {
    console.log('Page loaded, checking authentication...');
    console.log('Current page:', window.location.pathname);
  }

  // Verify authentication first
  const token = getAuthToken();
  if (!token) {
    console.warn('No authentication token found');
    window.location.href = 'login.html';
    return;
  }

  // =======================================================
  // PERBAIKAN EVENT LISTENER SEARCH DIMULAI DI SINI
  // =======================================================
  // Set up search listener
  const searchInput = document.getElementById("search");
  if (searchInput) {
    if (debug) console.log('Setting up search input handler');
    
    // HAPUS listener 'keyup' yang lama
    // searchInput.addEventListener("keyup", applyFilters);
    
    // GANTI DENGAN listener 'change'
    searchInput.addEventListener("change", function () {
      // Event 'change' akan aktif saat user tekan Enter atau klik di luar
      currentSearch = searchInput.value.trim(); // Simpan query pencarian
      loadAccounts(1); // Muat ulang data dari halaman 1
    });

  } else {
    console.error('Search input element not found');
  }
  // =======================================================
  // PERBAIKAN EVENT LISTENER SEARCH BERAKHIR DI SINI
  // =======================================================


  // Set up select all checkbox
  const selectAllCheckbox = document.getElementById("selectAll");
  if (selectAllCheckbox) {
    if (debug) console.log('Setting up select all checkbox handler');
    selectAllCheckbox.addEventListener("change", function () {
      const checkboxes = document.querySelectorAll(".row-select");
      checkboxes.forEach((checkbox) => {
        checkbox.checked = this.checked;
      });
    });
  } else {
    console.error('Select all checkbox not found');
  }

  // Set up fade-in animation
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

  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((el) => observer.observe(el));

  // Set up modal close on backdrop click
  const modal = document.getElementById('accountModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeModal();
      }
    });
  }

  // Load accounts on page load
  loadAccounts();

    // Poll for external changes every 10 seconds and auto-refresh when data changes
    // This helps keep the table updated if another admin changes data concurrently.
    let lastSnapshot = null;
    async function pollForChanges() {
      try {
        const token = getAuthToken();
        if (!token) return;
        
        // PERUBAHAN: Polling juga harus menggunakan query pencarian saat ini
        const pollUrl = `http://localhost:5000/api/accounts?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(currentSearch)}`;
        
        const res = await fetch(pollUrl, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (!res.ok) return; // ignore errors here
        const json = await res.json();
        const snapshot = JSON.stringify({ total: json.pagination && json.pagination.totalRecords, data: json.data && json.data.map(d=>d.id) });
        if (lastSnapshot && lastSnapshot !== snapshot) {
          // Data changed, refresh current page
          showNotification('Terdapat perubahan data. Menyegarkan...', 'info');
          await loadAccounts(currentPage);
        }
        lastSnapshot = snapshot;
      } catch (err) {
        // Poll failures are non-fatal; ignore silently
        if (debug) console.warn('Polling error:', err.message);
      }
    }
    // Start polling when page is visible
    let pollInterval = null;
    function startPolling() {
      if (pollInterval) return;
      pollForChanges();
      pollInterval = setInterval(pollForChanges, 10000);
    }
    function stopPolling() {
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') startPolling(); else stopPolling();
    });
    startPolling();
});