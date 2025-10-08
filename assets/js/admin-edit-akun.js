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
