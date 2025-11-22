const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// --- 1. KONFIGURASI CORS YANG BENAR ---
// Agar session/token tidak dianggap "tidak valid" oleh browser
const allowedOrigins = [
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://168.231.119.61',        // IP VPS Anda (HTTP)
  'http://168.231.119.61:5000',   // IP VPS dengan Port
  'https://siskapos.my.id',       // Domain Anda (jika nanti pakai domain)
  'https://www.siskapos.my.id'
];

app.use(cors({
  origin: function (origin, callback) {
    // Izinkan request tanpa origin (seperti dari mobile app atau curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      // Jika origin tidak ada di daftar, tetap izinkan (opsional, untuk development)
      // atau blokir dengan: return callback(new Error('Not allowed by CORS'), false);
      return callback(null, true); // Sementara diizinkan agar tidak ribet saat dev
    }
    return callback(null, true);
  },
  credentials: true, // Wajib true agar token/cookie bisa lewat
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// --- 2. ROUTING ASET STATIS ---
app.use(express.static(path.join(__dirname, 'public'))); // Asumsi file JS/CSS umum ada di folder public
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/image', express.static(path.join(__dirname, 'image')));
// Sajikan folder frontend root juga untuk file JS yang ada di root (seperti login.js)
app.use(express.static(__dirname)); 


// --- 3. ROUTING HALAMAN HTML (Clean URL) ---
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'dashboard.html')); });
app.get('/login', (req, res) => { res.sendFile(path.join(__dirname, 'login.html')); });
app.get('/admin-dashboard', (req, res) => { res.sendFile(path.join(__dirname, 'admin_dashboard.html')); });
app.get('/admin-edit-akun', (req, res) => { res.sendFile(path.join(__dirname, 'admin_edit_akun.html')); });
app.get('/admin-input-data', (req, res) => { res.sendFile(path.join(__dirname, 'admin_input_data.html')); });
app.get('/admin-tabel', (req, res) => { res.sendFile(path.join(__dirname, 'admin_tabel.html')); });
app.get('/masyarakat-dashboard', (req, res) => { res.sendFile(path.join(__dirname, 'masyarakat_dashboard.html')); });
app.get('/masyarakat-input-data', (req, res) => { res.sendFile(path.join(__dirname, 'masyarakat_input_data.html')); });
app.get('/masyarakat-riwayat', (req, res) => { res.sendFile(path.join(__dirname, 'masyarakat_riwayat.html')); });
app.get('/dashboard', (req, res) => { res.sendFile(path.join(__dirname, 'dashboard.html')); });


// --- 4. ROUTING API ---
// Pastikan file-file ini ada dan menggunakan db connection yang benar
const authRoutes = require('./BACKEND/routes/auth.js');
const accountsRoutes = require('./BACKEND/routes/accounts_v2.js');
const antropometriRoutes = require('./BACKEND/routes/antropometri.js');

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/antropometri', antropometriRoutes);


// --- 5. INTEGRASI GEMINI AI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "API_KEY_CADANGAN_JIKA_ENV_GAGAL");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.post('/api/generate-recommendation', async (req, res) => {
  try {
    const { namaAnak, umur, jenisKelamin, beratBadan, tinggiBadan, bmi, statusGizi } = req.body;

    // Validasi sederhana agar tidak error jika data kosong
    if (!namaAnak || !umur) {
        return res.status(400).json({ error: "Data anak tidak lengkap." });
    }

    const prompt = `
      Anda adalah ahli gizi Posyandu. Berikan 2-3 rekomendasi singkat (maksimal 3 kalimat per poin) untuk orang tua.
      Bahasa: Indonesia. Jangan pakai Markdown (bold/italic).
      
      Data Anak:
      Nama: ${namaAnak}, Umur: ${umur} bulan, JK: ${jenisKelamin}
      BB: ${beratBadan}kg, TB: ${tinggiBadan}cm, BMI: ${bmi}, Status: ${statusGizi}
      
      Berikan rekomendasi spesifik sesuai status gizi tersebut.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const recommendationText = response.text();

    res.json({ recommendation: recommendationText });

  } catch (error) {
    console.error("Error Gemini AI:", error);
    res.status(500).json({ 
        error: "Maaf, AI sedang sibuk. " + error.message,
        recommendation: "Gagal memuat saran otomatis. Pastikan gizi seimbang dan konsultasi ke bidan."
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});