const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');
// Impor 'path' dan 'cookieParser'
const path = require('path');
const cookieParser = require('cookie-parser');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors({
     origin: '*', // Ganti dengan domain Anda nanti
     credentials: true 
}));
app.use(express.json());
// Gunakan cookieParser
app.use(cookieParser());

// --- 1. ROUTING HALAMAN (STATIC / ASET) ---
// Rute aman untuk folder 'assets' dan 'image' (lebih baik dari express.static(__dirname))
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/image', express.static(path.join(__dirname, 'image')));


// --- 2. ROUTING HALAMAN (HTML) ---
// Ini adalah "routing" dari versi sebelumnya, ditambahkan ke kode baru Anda
// Semua halaman ini sekarang publik dan tidak dilindungi
app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/login', (req, res) => {
   res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/admin-dashboard', (req, res) => {
   res.sendFile(path.join(__dirname, 'admin_dashboard.html'));
});
app.get('/admin-edit-akun', (req, res) => {
   res.sendFile(path.join(__dirname, 'admin_edit_akun.html'));
});
app.get('/admin-input-data', (req, res) => {
   res.sendFile(path.join(__dirname, 'admin_input_data.html'));
});
app.get('/admin-tabel', (req, res) => {
   res.sendFile(path.join(__dirname, 'admin_tabel.html'));
});
app.get('/masyarakat-dashboard', (req, res) => {
   res.sendFile(path.join(__dirname, 'masyarakat_dashboard.html'));
});
app.get('/masyarakat-input-data', (req, res) => {
   res.sendFile(path.join(__dirname, 'masyarakat_input_data.html'));
});
app.get('/masyarakat-riwayat', (req, res) => {
   res.sendFile(path.join(__dirname, 'masyarakat_riwayat.html'));
});
app.get('/dashboard', (req, res) => {
   res.sendFile(path.join(__dirname, 'dashboard.html'));
});


// --- 3. ROUTING API (BACKEND) ---
// Ini dari kode "lama" Anda
const authRoutes = require('./BACKEND/routes/auth.js');
const accountsRoutes = require('./BACKEND/routes/accounts_v2.js');
const antropometriRoutes = require('./BACKEND/routes/antropometri.js');

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/antropometri', antropometriRoutes);

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- 4. ROUTING API (GEMINI AI) ---
// Ini dari kode "lama" Anda
app.post('/api/generate-recommendation', async (req, res) => {
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

app.listen(port, () => {
   console.log(`Server is running at http://localhost:${port}`);
});