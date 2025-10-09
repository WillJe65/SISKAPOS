// Import necessary packages
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const port = 3000; // You can use any port

// --- Middleware ---
// Enable CORS to allow requests from your frontend
app.use(cors()); 
// Enable Express to parse JSON in request bodies
app.use(express.json());

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- API Endpoint ---
// Define a POST endpoint to handle recommendation requests
app.post('/api/generate-recommendation', async (req, res) => {
  try {
    // Get the child's data from the request body
    const { namaAnak, umur, jenisKelamin, beratBadan, tinggiBadan, bmi, statusGizi } = req.body;

    // --- Prompt Engineering ---
    // Create a detailed prompt for the Gemini AI
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

    // Generate content using the prompt
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const recommendationText = response.text();

    // Send the generated text back to the frontend
    res.json({ recommendation: recommendationText });

  } catch (error) {
    console.error("Error generating recommendation:", error);
    res.status(500).json({ error: "Gagal menghasilkan rekomendasi." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});