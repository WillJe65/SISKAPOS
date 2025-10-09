// =================================================================
// DATA DUMMY (Contoh data yang seharusnya diambil dari database)
// =================================================================
const dummyData = {
  BDI001: {
    nama: "Budi Santoso",
    id: "BDI001",
    umur: "24 bulan",
    jenisKelamin: "Laki-laki",
    namaOrangTua: "Herman Santoso",
    alamat: "Jl. Melati No. 12, Jakarta",
    nomorHP: "081234567890",
    riwayat: [
      { tanggal: "2024-05-10", bb: 12.2, tb: 85.1, status: "Normal" },
      { tanggal: "2024-06-11", bb: 12.5, tb: 86.0, status: "Normal" },
      { tanggal: "2024-07-10", bb: 12.8, tb: 87.2, status: "Normal" },
    ],
  },
  STI002: {
    nama: "Siti Nurhaliza",
    id: "STI002",
    umur: "18 bulan",
    jenisKelamin: "Perempuan",
    namaOrangTua: "Aisyah",
    alamat: "Jl. Mawar No. 3, Jakarta",
    nomorHP: "089876543210",
    riwayat: [
      {
        tanggal: "2024-05-15",
        bb: 8.0,
        tb: 74.0,
        status: "Risiko Stunting",
      },
      { tanggal: "2024-06-16", bb: 8.2, tb: 75.1, status: "Stunting" },
      { tanggal: "2024-07-15", bb: 8.3, tb: 75.5, status: "Stunting" },
    ],
  },
  AHM003: {
    nama: "Ahmad Rizki",
    id: "AHM003",
    umur: "30 bulan",
    jenisKelamin: "Laki-laki",
    namaOrangTua: "Muhammad Rizki",
    alamat: "Jl. Anggrek No. 21, Jakarta",
    nomorHP: "08111222333",
    riwayat: [
      { tanggal: "2024-05-12", bb: 13.0, tb: 90.5, status: "Normal" },
      { tanggal: "2024-06-14", bb: 13.4, tb: 91.5, status: "Normal" },
      { tanggal: "2024-07-12", bb: 13.7, tb: 92.3, status: "Normal" },
    ],
  },
};

// =================================================================
// FUNGSI UTAMA
// =================================================================

// Fungsi navigasi
function goBack() {
  window.location.href = "admin_dashboard.html";
}

function logout() {
  if (confirm("Apakah Anda yakin ingin logout?")) {
    window.location.href = "dashboard.html";
  }
}

// --- IMPLEMENTASI BARU UNTUK MODAL ---
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.querySelector(".transform").classList.remove("scale-95", "opacity-0");
  }, 10); // Sedikit delay untuk transisi
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.querySelector(".transform").classList.add("scale-95", "opacity-0");
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300); // Sesuaikan dengan durasi transisi
}

// Fungsi untuk menampilkan detail
function viewDetail(id) {
  const data = dummyData[id];
  if (!data) return;

  const contentArea = document.getElementById("detailModalContent");
  contentArea.innerHTML = `
      <p><strong>ID:</strong> ${data.id}</p>
      <p><strong>Nama Lengkap:</strong> ${data.nama}</p>
      <p><strong>Umur:</strong> ${data.umur}</p>
      <p><strong>Jenis Kelamin:</strong> ${data.jenisKelamin}</p>
      <p><strong>Nama Orang Tua:</strong> ${data.namaOrangTua}</p>
      <p><strong>Alamat:</strong> ${data.alamat}</p>
      <p><strong>Nomor HP:</strong> ${data.nomorHP}</p>
    `;
  openModal("detailModal");
}

// Fungsi untuk menampilkan riwayat
function viewHistory(id) {
  const data = dummyData[id];
  if (!data) return;

  const contentArea = document.getElementById("historyModalContent");
  let tableHTML = `
      <table class="w-full text-sm text-left text-green-700">
        <thead class="bg-green-100 text-xs text-green-800 uppercase">
          <tr>
            <th scope="col" class="px-6 py-3">Tanggal Periksa</th>
            <th scope="col" class="px-6 py-3">Berat Badan (kg)</th>
            <th scope="col" class="px-6 py-3">Tinggi Badan (cm)</th>
            <th scope="col" class="px-6 py-3">Status Gizi</th>
          </tr>
        </thead>
        <tbody>
    `;

  data.riwayat.forEach((item) => {
    tableHTML += `
        <tr class="bg-white border-b border-green-100 hover:bg-green-50">
          <td class="px-6 py-4 font-medium">${item.tanggal}</td>
          <td class="px-6 py-4">${item.bb}</td>
          <td class="px-6 py-4">${item.tb}</td>
          <td class="px-6 py-4">
            <span class="px-2 py-1 font-semibold leading-tight rounded-full 
              ${
                item.status === "Normal"
                  ? "bg-green-100 text-green-800"
                  : "bg-orange-100 text-orange-800"
              }">
              ${item.status}
            </span>
          </td>
        </tr>
      `;
  });

  tableHTML += `</tbody></table>`;
  contentArea.innerHTML = tableHTML;
  document.getElementById(
    "historyModalTitle"
  ).innerText = `Riwayat Pengukuran - ${data.nama}`;
  openModal("historyModal");
}

// --- FUNGSI FILTER DAN PENCARIAN (Sudah ada dari sebelumnya) ---

let currentGenderFilter = "all";

function applyFilters() {
  const searchFilter = document.getElementById("search").value.toLowerCase();
  const tableRows = document.querySelectorAll("#dataTableBody tr");

  tableRows.forEach((row) => {
    const nameCell = row.cells[1];
    const genderCell = row.cells[3];

    const nameMatch = (nameCell.textContent || nameCell.innerText)
      .toLowerCase()
      .includes(searchFilter);
    const genderMatch =
      currentGenderFilter === "all" ||
      (genderCell.textContent || genderCell.innerText)
        .toLowerCase()
        .includes(currentGenderFilter);

    if (nameMatch && genderMatch) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

function filterData(gender) {
  currentGenderFilter = gender;
  applyFilters();
}

// Event listener dan observer
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("search").addEventListener("keyup", applyFilters);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".fade-in").forEach((el) => {
    observer.observe(el);
  });
});
