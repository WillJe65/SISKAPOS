// Password toggle functionality
document
  .getElementById("passwordToggle")
  .addEventListener("click", function () {
    const passwordInput = document.getElementById("password");
    const eyeIcon = document.getElementById("eyeIcon");
    const eyeOffIcon = document.getElementById("eyeOffIcon");

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      eyeIcon.classList.add("hidden");
      eyeOffIcon.classList.remove("hidden");
    } else {
      passwordInput.type = "password";
      eyeIcon.classList.remove("hidden");
      eyeOffIcon.classList.add("hidden");
    }
  });

// Form submission handling
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  if (!role) {
    alert("Silakan pilih peran terlebih dahulu!");
    return;
  }

  // Show loading state
  const submitBtn = document.getElementById("submitBtn");
  const buttonText = document.getElementById("buttonText");
  const loadingSpinner = document.getElementById("loadingSpinner");

  submitBtn.disabled = true;
  buttonText.textContent = "Memproses...";
  loadingSpinner.classList.remove("hidden");

  // Simulate login process
  setTimeout(() => {
    // Reset button state
    submitBtn.disabled = false;
    buttonText.textContent = "Masuk";
    loadingSpinner.classList.add("hidden");

    // Redirect based on role
    if (role === "admin") {
      alert("Selamat datang, Admin! Mengarahkan ke Dashboard Admin...");
      // window.location.href = 'admin_dashboard.html';
    } else if (role === "masyarakat") {
      alert("Selamat datang! Mengarahkan ke Dashboard Masyarakat...");
      // window.location.href = 'masyarakat_dashboard.html';
    }
  }, 1500);
});

// Back button functionality
function handleBackClick() {
  window.location.href = "dashboard.html";
}

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = "smooth";

// Enhanced form validation
const inputs = document.querySelectorAll("input[required], select[required]");
inputs.forEach((input) => {
  input.addEventListener("invalid", function (e) {
    e.preventDefault();
    this.classList.add("border-red-500", "ring-red-500");
  });

  input.addEventListener("input", function () {
    this.classList.remove("border-red-500", "ring-red-500");
  });
});

// Auto focus on username field when page loads
window.addEventListener("load", function () {
  document.getElementById("username").focus();
});

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  let role = document.getElementById("role").value;

  if (role === "admin") {
    window.location.href = "admin_dashboard.html";
  } else if (role === "masyarakat") {
    window.location.href = "masyarakat_dashboard.html";
  } else {
    alert("Silakan pilih peran terlebih dahulu!");
  }
});
