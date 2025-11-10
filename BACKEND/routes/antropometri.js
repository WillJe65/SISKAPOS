const express = require('express');
const db = require('../db.js'); // Impor koneksi database
const jwt = require('jsonwebtoken');
const util = require('util');
const router = express.Router();

// Middleware verifikasi token (SAMA DENGAN DI accounts_v2.js)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan.' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Format token tidak valid.' });
  }
  try {
    const decoded = jwt.verify(token, 'rahasia_posyandu');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau kadaluarsa.' });
  }
};

// Convert db.query and transaction methods to Promise-based
const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db);
const commit = util.promisify(db.commit).bind(db);
const rollback = util.promisify(db.rollback).bind(db);


// POST /api/antropometri
// Menyimpan data pengukuran baru
router.post('/', verifyToken, async (req, res) => {
  const {
    account_id,
    umur,
    beratBadan,
    tinggiBadan,
    lingkarKepala,
    bmi,
    statusGizi,
    rekomendasiAI
  } = req.body;

  if (!account_id || !umur || !beratBadan || !tinggiBadan) {
    return res.status(400).json({ message: 'Data input tidak lengkap.' });
  }
  
  let transactionStarted = false;

  try {
    // Start transaction
    await beginTransaction();
    transactionStarted = true;

    // 1. Insert ke tabel riwayat
    const riwayatQuery = `
      INSERT INTO riwayat_antropometri 
        (account_id, umur_bulan_saat_periksa, berat_badan_kg, tinggi_badan_cm, lingkar_kepala_cm, bmi, status_gizi, rekomendasi_ai, tanggal_periksa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
    `;
    await query(riwayatQuery, [
      account_id,
      umur,
      beratBadan,
      tinggiBadan,
      lingkarKepala || null,
      bmi,
      statusGizi,
      rekomendasiAI
    ]);

    // 2. Update umur terbaru di tabel accounts
    const accountQuery = 'UPDATE accounts SET umur_bulan = ? WHERE id = ?';
    await query(accountQuery, [umur, account_id]);

    // 3. Commit transaksi
    await commit();
    
    res.status(201).json({ message: 'Data pengukuran berhasil disimpan!' });

  } catch (error) {
    // Jika terjadi error, rollback
    if (transactionStarted) {
      await rollback();
    }
    console.error('Transaction error:', error);
    res.status(500).json({ message: 'Gagal menyimpan data.', error: error.message });
  }
});

module.exports = router;