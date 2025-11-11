const express = require('express')
import serverless from "serverless-http"
const {GoogleGenerativeAI} = require('@google/generative-ai')
const dotenv = require('dotenv')
const cors = require('cors')

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 5000;

// --- Middleware ---
app.use(cors()); 
app.use(express.json());
app.use(express.static(__dirname));

const authRoutes = require('./BACKEND/routes/auth.js');
const accountsRoutes = require('./BACKEND/routes/accounts_v2.js');
const antropometriRoutes = require('./BACKEND/routes/antropometri.js');
const jadwalRoutes = require('./BACKEND/routes/jadwal.js');

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/antropometri', antropometriRoutes);
app.use('/api/jadwal', jadwalRoutes);

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- API Endpoint ---
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

export default serverless(app)
