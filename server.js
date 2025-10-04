// server.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');

// Load API Key from .env file
dotenv.config();

const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware setup
app.use(cors());
app.use(express.json());

// Define the API endpoint
app.post('/generate-result', async (req, res) => {
  try {
    const { nama, umur, jenisKelamin, beratBadan, tinggiBadan, lingkarKepala } = req.body;

    // Create a detailed prompt for the AI
    const prompt = `
      Anda adalah seorang asisten ahli gizi di Posyandu.
      Analisis data antropometri anak berikut dan berikan ringkasan status gizinya dalam bahasa yang mudah dipahami orang tua.

      Data Anak:
      - Nama: ${nama}
      - Umur: ${umur} bulan
      - Jenis Kelamin: ${jenisKelamin}
      - Berat Badan: ${beratBadan} kg
      - Tinggi Badan: ${tinggiBadan} cm
      - Lingkar Kepala: ${lingkarKepala} cm

      Format output Anda harus sebagai berikut:
      1.  **Ringkasan Umum:** Satu paragraf kesimpulan.
      2.  **Indikator Utama:** Poin-poin untuk status berat badan, tinggi badan, dan lingkar kepala.
      3.  **Saran Positif:** Satu kalimat saran yang memotivasi.
      4.   Berikan referensi dari sumber terpercaya seperti WHO atau Kementerian Kesehatan Indonesia beserta linknya.
      5.   Susun jawaban dengan rapih dan mudah dibaca.
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Send the AI's analysis back to the frontend
    res.json({ result: text });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get a response from the AI.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});