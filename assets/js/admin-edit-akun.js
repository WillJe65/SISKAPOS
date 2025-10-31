// Fungsi navigasi
function goBack() {
  window.location.href = "admin_dashboard.html";
}

function logout() {
  if (confirm("Apakah Anda yakin ingin logout?")) {
    window.location.href = "dashboard.html";
  }
}

// Fungsi untuk modal (tambah/edit)
function openAddModal() {
  document.getElementById("modalTitle").textContent = "Tambah Akun Baru";
  document.getElementById("accountForm").reset();
  document.getElementById("accountModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("accountModal").classList.add("hidden");
}

function editAccount(id) {
  // Di sini Anda bisa menambahkan logika untuk mengisi data ke form sebelum menampilkannya
  document.getElementById("modalTitle").textContent = "Edit Akun";
  document.getElementById("accountModal").classList.remove("hidden");
}

function deleteAccount(id) {
  if (confirm("Apakah Anda yakin ingin menghapus akun ini?")) {
    alert("Akun berhasil dihapus!");
    // Tambahkan logika untuk menghapus baris dari tabel
  }
}

document.getElementById("accountForm").addEventListener("submit", function (e) {
  e.preventDefault();
  alert("Data akun berhasil disimpan!");
  closeModal();
});

document.getElementById("selectAll").addEventListener("change", function () {
  const checkboxes = document.querySelectorAll(".row-select");
  checkboxes.forEach((checkbox) => {
    checkbox.checked = this.checked;
  });
});

// --- KODE BARU UNTUK FILTER DAN PENCARIAN ---

let currentGenderFilter = "all"; // Menyimpan filter gender yang aktif

// Fungsi utama untuk menerapkan semua filter
function applyFilters() {
  const searchFilter = document.getElementById("search").value.toLowerCase();
  const tableBody = document.getElementById("accountTableBody");
  const tableRows = tableBody.getElementsByTagName("tr");

  for (const row of tableRows) {
    const nameCell = row.getElementsByTagName("td")[1];
    const genderCell = row.getElementsByTagName("td")[3];

    if (nameCell && genderCell) {
      const nameText = (
        nameCell.textContent || nameCell.innerText
      ).toLowerCase();
      const genderText = (genderCell.textContent || genderCell.innerText)
        .trim()
        .toLowerCase();

      // 1. Cek kecocokan dengan pencarian nama
      const nameMatch = nameText.includes(searchFilter);

      // 2. Cek kecocokan dengan filter gender
      const genderMatch =
        currentGenderFilter === "all" || genderText === currentGenderFilter;

      // Baris akan ditampilkan HANYA JIKA kedua kondisi terpenuhi
      if (nameMatch && genderMatch) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    }
  }
}

// Fungsi ini dipanggil oleh tombol filter gender
function filterData(gender) {
  currentGenderFilter = gender; // Perbarui filter gender yang aktif
  applyFilters(); // Terapkan semua filter
}

document.addEventListener("DOMContentLoaded", function () {
  // Menambahkan listener untuk input pencarian
  const searchInput = document.getElementById("search");
  searchInput.addEventListener("keyup", applyFilters);

  // Kode untuk animasi fade-in
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
  fadeElements.forEach((el) => {
    observer.observe(el);
  });
});


//API
function goBack() {
  window.location.href = "admin_dashboard.html";
}

function logout() {
  if (confirm("Apakah Anda yakin ingin logout?")) {
    window.location.href = "dashboard.html";
  }
}

// API base
const API_BASE = 'http://localhost:5000/api';
let currentGenderFilter = "all";
let accountsCache = [];
let editMode = { mode: 'add', id: null };

// Open / close modal
function openAddModal() {
  document.getElementById("modalTitle").textContent = "Tambah Akun Baru";
  document.getElementById("accountForm").reset();
  editMode = { mode: 'add', id: null };
  // set default user_id (if you want) or leave
  document.getElementById("accountModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("accountModal").classList.add("hidden");
}

function populateUsersDropdown() {
  // optional: populate a user selector if you add it to the form
  // fetch(`${API_BASE}/users`).then(r=>r.json()).then(users=>{ ... })
}

// Render table rows from accountsCache
function renderTable() {
  const tbody = document.getElementById("accountTableBody");
  tbody.innerHTML = '';
  accountsCache.forEach(acc => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-green-50 transition-colors';
    tr.dataset.name = acc.name.toLowerCase();
    tr.dataset.gender = (acc.gender || '').toLowerCase();

    const badge = acc.gender === 'perempuan'
      ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">Perempuan</span>`
      : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Laki-laki</span>`;

    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <input type="checkbox" class="rounded border-green-300 text-green-600 focus:ring-green-500 row-select" data-id="${acc.id}" />
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="w-10 h-10 ${acc.gender === 'perempuan' ? 'bg-gradient-to-br from-pink-500 to-pink-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'} rounded-full flex items-center justify-center mr-3">
            <span class="text-white font-medium">${(acc.name || ' ')[0].toUpperCase()}</span>
          </div>
          <div>
            <div class="text-sm font-medium text-green-900">${escapeHtml(acc.name)}</div>
            <div class="text-sm text-green-500">ID: ${acc.external_id || ('AC' + acc.id)}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">${acc.age_months || 0} bulan</td>
      <td class="px-6 py-4 whitespace-nowrap">${badge}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button onclick="editAccount(${acc.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Edit</button>
        <button onclick="deleteAccount(${acc.id})" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs transition-colors">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  applyFilters();
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// Fetch accounts from server
async function fetchAccounts() {
  try {
    const res = await fetch(`${API_BASE}/accounts`);
    accountsCache = await res.json();
    renderTable();
  } catch (err) {
    console.error('Failed to fetch accounts', err);
  }
}

function editAccount(id) {
  const acc = accountsCache.find(a => a.id == id);
  if (!acc) return alert('Data tidak ditemukan');
  document.getElementById("modalTitle").textContent = "Edit Akun";
  document.getElementById("namaLengkap").value = acc.name || '';
  document.getElementById("umurModal").value = acc.age_months || 0;
  document.getElementById("jenisKelaminModal").value = acc.gender || '';
  document.getElementById("namaOrangTua").value = acc.parent_name || '';
  document.getElementById("alamat").value = acc.address || '';
  document.getElementById("nomorHP").value = acc.phone || '';
  editMode = { mode: 'edit', id: id };
  document.getElementById("accountModal").classList.remove("hidden");
}

async function deleteAccount(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus akun ini?")) return;
  try {
    const res = await fetch(`${API_BASE}/accounts/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      // reload
      await fetchAccounts();
      alert('Akun berhasil dihapus');
    } else {
      alert('Gagal menghapus: ' + (data.error || res.statusText));
    }
  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan saat menghapus');
  }
}

// Form submit handler
document.getElementById("accountForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const payload = {
    // user_id harus ada, gunakan 1 jika belum ada sistem login
    user_id: 1,
    name: document.getElementById("namaLengkap").value.trim(),
    age_months: parseInt(document.getElementById("umurModal").value || 0, 10),
    gender: document.getElementById("jenisKelaminModal").value,
    parent_name: document.getElementById("namaOrangTua").value.trim(),
    address: document.getElementById("alamat").value.trim(),
    phone: document.getElementById("nomorHP").value.trim(),
    external_id: null
  };

  try {
    if (editMode.mode === 'add') {
      const res = await fetch(`${API_BASE}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        return alert('Gagal menyimpan: ' + (err.error || res.statusText));
      }
      alert('Data akun berhasil disimpan!');
    } else if (editMode.mode === 'edit') {
      const res = await fetch(`${API_BASE}/accounts/${editMode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        return alert('Gagal memperbarui: ' + (err.error || res.statusText));
      }
      alert('Data akun berhasil diperbarui!');
    }
    closeModal();
    await fetchAccounts();
  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan saat menyimpan data');
  }
});

document.getElementById("selectAll").addEventListener("change", function () {
  const checkboxes = document.querySelectorAll(".row-select");
  checkboxes.forEach((checkbox) => {
    checkbox.checked = this.checked;
  });
});

// Filters and search
function applyFilters() {
  const searchFilter = document.getElementById("search").value.toLowerCase();
  const tbody = document.getElementById("accountTableBody");
  const rows = tbody.querySelectorAll("tr");
  for (const row of rows) {
    const name = row.dataset.name || '';
    const gender = row.dataset.gender || '';
    const nameMatch = name.includes(searchFilter);
    const genderMatch = currentGenderFilter === 'all' || gender === currentGenderFilter;
    row.style.display = (nameMatch && genderMatch) ? '' : 'none';
  }
}

function filterData(gender) {
  currentGenderFilter = gender;
  applyFilters();
}

document.addEventListener("DOMContentLoaded", function () {
  // search listener
  const searchInput = document.getElementById("search");
  if (searchInput) searchInput.addEventListener("keyup", applyFilters);

  // fade-in observer (existing)
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

  // initial load
  fetchAccounts();
});