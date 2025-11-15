const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
// Impor 'jsonwebtoken' dan 'cookie-parser'
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 5000;

// --- Middleware ---
app.use(cors({
    origin: '*', // Ganti dengan domain Anda nanti
    credentials: true 
}));
app.use(express.json());

// Gunakan cookie parser (WAJIB, untuk membaca cookie)
app.use(cookieParser());

// --- 1. ROUTING HALAMAN (STATIC / ASET) ---
// Rute aman untuk folder 'assets' dan 'image'
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/image', express.static(path.join(__dirname, 'image')));


// --- Middleware Otentikasi Fungsional (LOGIKA BARU) ---
// Penjaga 1: Untuk HALAMAN (misal: /admin-dashboard)
const checkAuthPage = (req, res, next) => {
    const token = req.cookies.token; // 1. Ambil token dari cookie

    if (!token) {
        return res.redirect('/login'); // 2. Tidak ada token, paksa ke login
    }

    try {
        // 3. Verifikasi token
        // Ambil SECRET_KEY dari .env
        const decoded = jwt.verify(token, process.env.SECRET_KEY || 'ganti-ini-di-file-env-anda');
        req.user = decoded; // 4. Simpan data user di request
        next(); // 5. Lolos, lanjutkan ke halaman
    } catch (err) {
        // 6. Token tidak valid (kadaluwarsa, dll)
        res.clearCookie('token'); // Hapus cookie yang salah
        return res.redirect('/login'); // Paksa ke login
    }
};

// Penjaga 2: Untuk API (misal: /api/accounts)
const checkAuthApi = (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ message: 'Akses ditolak. Silakan login kembali.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY || 'ganti-ini-di-file-env-anda');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Sesi tidak valid. Silakan login kembali.' });
    }
};

// --- PENJAGA BARU ---
// Penjaga 3: Untuk HALAMAN PUBLIK (misal: /login)
// Ini mencegah user yang SUDAH LOGIN melihat halaman login lagi
const redirectIfLoggedIn = (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        // Tidak ada token, bagus, biarkan dia melihat halaman login
        return next();
    }

    try {
        // Ada token, cek apakah valid
        const decoded = jwt.verify(token, process.env.SECRET_KEY || 'ganti-ini-di-file-env-anda');
        
        // Token valid! User ini sudah login.
        // Arahkan dia ke dashboard-nya, jangan biarkan dia login lagi.
        if (decoded.role === 'ADMIN') {
            return res.redirect('/admin-dashboard');
        } else if (decoded.role === 'MASYARAKAT') {
            return res.redirect('/masyarakat-dashboard');
        } else {
            // Fallback
            return res.redirect('/');
        }
    } catch (err) {
        // Token ada tapi tidak valid (misal: kadaluwarsa)
        // Biarkan dia melihat halaman login
        res.clearCookie('token');
        return next();
    }
};


// --- 2. ROUTING "GATE" (HALAMAN UTAMA) ---
// --- PERUBAHAN LOGIKA ---

// Rute root '/' sekarang dilindungi oleh 'checkAuthPage'.
// 'checkAuthPage' akan otomatis redirect ke '/login' JIKA BELUM LOGIN.
app.get('/', checkAuthPage, (req, res) => {
  // Jika lolos 'checkAuthPage', berarti user sudah login.
  // Kita bisa kirim mereka ke dashboard yang sesuai berdasarkan role dari token.
  const userRole = req.user.role; // req.user diatur oleh checkAuthPage

  if (userRole === 'ADMIN') {
    res.sendFile(path.join(__dirname, 'admin_dashboard.html'));
  } else if (userRole === 'MASYARAKAT') {
    res.sendFile(path.join(__dirname, 'masyarakat_dashboard.html'));
  } else {
    // Jika role tidak dikenal, fallback ke login
    res.clearCookie('token');
    res.redirect('/login');
  }
});

// Rute '/login' sekarang dilindungi oleh 'redirectIfLoggedIn'.
app.get('/login', redirectIfLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// --- RUTE HALAMAN YANG DILINDUNGGI (PROTECTED) ---
// Gunakan 'checkAuthPage'
app.get('/admin-dashboard', checkAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin_dashboard.html'));
});
app.get('/admin-edit-akun', checkAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin_edit_akun.html'));
});
app.get('/admin-input-data', checkAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin_input_data.html'));
});
app.get('/admin-tabel', checkAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin_tabel.html'));
});
app.get('/masyarakat-dashboard', checkAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'masyarakat_dashboard.html'));
});
app.get('/masyarakat-input-data', checkAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'masyarakat_input_data.html'));
});
app.get('/masyarakat-riwayat', checkAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'masyarakat_riwayat.html'));
});
app.get('/dashboard', checkAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// --- 3. ROUTING API (BACKEND) ---
const authRoutes = require('./BACKEND/routes/auth.js');
const accountsRoutes = require('./BACKEND/routes/accounts_v2.js');
const antropometriRoutes = require('./BACKEND/routes/antropometri.js');

// Rute 'auth' (login/logout) TIDAK perlu penjaga
app.use('/api/auth', authRoutes);

// Rute 'accounts' dan 'antropometri' PERLU penjaga 'checkAuthApi'
app.use('/api/accounts', checkAuthApi, accountsRoutes);
app.use('/api/antropometri', checkAuthApi, antropometriRoutes);

// --- 4. ROUTING API (GEMINI AI) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Rute ini juga PERLU penjaga 'checkAuthApi'
app.post('/api/generate-recommendation', checkAuthApi, async (req, res) => {
  try {
    const { namaAnak, umur, jenisKelamin, beratBadan, tinggiBadan, bmi, statusGizi } = req.body;
    const prompt = `
      Anda adalah seorang ahli gizi anak yang ramah dan membantu dari Posyandu Melati 1.
      Berikan 2-3 rekomendasi singkat, jelas, dan dapat ditindaklanjuti untuk orang tua berdasarkan data anak berikut.
      Gunakan bahasa Indonesia yang mudah dimengerti. Jangan gunakan format markdown.
      Data Anak:
      - Nama: ${namaAnak}
      - Umur: ${umur} bulan
      - Jenis Kelamin: ${jenisKelamin}
      - Berat Badan: ${beratBadan} kg
      - Tinggi Badan: ${tinggiBadan} cm
      - BMI: ${bmi.toFixed(1)}
      - Status Gizi (berdasarkan BMI sederhana): ${statusGizi}
      Contoh output: "Fokus pada prinsip-prinsip umum (misalnya: "pentingnya variasi makanan" atau "perlunya stimulasi motorik kasar")."
      Berikan rekomendasi sekarang:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const recommendationText = response.text();
    res.json({ recommendation: recommendationText });
  } catch (error) {
    console.error("Error generating recommendation:", error);
    res.status(500).json({ error: "Gagal menghasilkan rekomendasi." });
  }
});

// --- Menjalankan Server ---
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});