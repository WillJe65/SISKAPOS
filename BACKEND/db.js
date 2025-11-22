const mysql = require('mysql2');
const dotenv = require('dotenv');

// PENTING: Load variabel lingkungan (env) sebelum digunakan
dotenv.config();

// Tips Debugging: Cek apakah variabel terbaca (hapus console.log ini nanti jika sudah fix)
// console.log("Debug DB Config:", {
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   db: process.env.DB_NAME
// });

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  // Gunakan operator OR (||) untuk mengakomodasi variasi nama variabel di .env
  user: process.env.DB_USER || process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'siskapos_db',
  port: process.env.DB_PORT || 3306
});

db.connect(err => {
  if (err) {
    console.error('❌ FATAL: Database connection failed!');
    console.error('Code:', err.code);
    console.error('Message:', err.message);
    console.error('Hint: Pastikan file .env sudah benar dan user database sudah dibuat.');
  } else {
    console.log('✅ Connected to MySQL Database');
  }
});

module.exports = db;