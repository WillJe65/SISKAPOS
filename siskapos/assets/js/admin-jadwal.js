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
  document.getElementById("scheduleModalTitle").textContent =
    "Tambah Jadwal Baru";
  document.getElementById("scheduleForm").reset();
  document.getElementById("scheduleModal").classList.remove("hidden");
}

function closeScheduleModal() {
  document.getElementById("scheduleModal").classList.add("hidden");
}

// CRUD functions
function editSchedule(id) {
  document.getElementById("scheduleModalTitle").textContent = "Edit Jadwal";
  // Isi form dengan data yang ada
  document.getElementById("scheduleModal").classList.remove("hidden");
}

function deleteSchedule(id) {
  if (confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
    alert("Jadwal berhasil dihapus!");
  }
}

function confirmSchedule(id) {
  if (confirm("Apakah Anda yakin ingin mengkonfirmasi jadwal ini?")) {
    alert("Jadwal berhasil dikonfirmasi!");
  }
}

function duplicateSchedule(id) {
  if (confirm("Duplikasi jadwal ini untuk periode selanjutnya?")) {
    alert("Jadwal berhasil diduplikasi!");
  }
}

function bulkConfirm() {
  const selected = document.querySelectorAll(".row-select:checked");
  if (selected.length === 0) {
    alert("Pilih jadwal yang ingin dikonfirmasi terlebih dahulu!");
    return;
  }
  if (confirm(`Konfirmasi ${selected.length} jadwal terpilih?`)) {
    alert("Jadwal terpilih berhasil dikonfirmasi!");
  }
}

function exportSchedule() {
  alert("Exporting jadwal...");
}

// Select all functionality
document
  .getElementById("selectAllSchedule")
  .addEventListener("change", function () {
    const checkboxes = document.querySelectorAll(".row-select");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = this.checked;
    });
  });

// Form submission
document
  .getElementById("scheduleForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    alert("Jadwal berhasil disimpan!");
    closeScheduleModal();
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

// Observe all fade-in elements
document.addEventListener("DOMContentLoaded", function () {
  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((el) => {
    observer.observe(el);
  });
});
