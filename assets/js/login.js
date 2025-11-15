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

// === Login handler ===
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  if (!username || !password || !role) {
    alert("Isi semua kolom terlebih dahulu!");
    return;
  }

  const submitBtn = document.getElementById("submitBtn");
  const buttonText = document.getElementById("buttonText");
  const loadingSpinner = document.getElementById("loadingSpinner");

  submitBtn.disabled = true;
  buttonText.textContent = "Memproses...";
  loadingSpinner.classList.remove("hidden");

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
    });

    const data = await res.json();
    
    console.log('Response status:', res.status);
    console.log('Response data:', data);

    if (!res.ok) {
      alert(data.message || "Login gagal!");
    } else {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userId", data.user.id);
      
      alert("Login berhasil!");
      
      if (data.user.role === "ADMIN") {
        window.location.href = "/admin-dashboard";
      } else if (data.user.role === "MASYARAKAT") {
        window.location.href = "/masyarakat-dashboard";
      } else {
        window.location.href = "/";
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Terjadi kesalahan koneksi ke server. Pastikan backend berjalan di port 5000.");
  } finally {
    submitBtn.disabled = false;
    buttonText.textContent = "Masuk";
    loadingSpinner.classList.add("hidden");
  }
});

// Back button functionality
function handleBackClick() {
  window.location.href = "/dashboard";
}

//smooth scroll
document.documentElement.style.scrollBehavior = "smooth";