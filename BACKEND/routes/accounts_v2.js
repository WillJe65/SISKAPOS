const express = require('express');
// PERBAIKAN 1: Sesuaikan path dengan lokasi db.js yang benar (di folder config)
const db = require('../db'); 
const jwt = require('jsonwebtoken');
const router = express.Router();
const util = require('util');
const dotenv = require('dotenv');

// Load env variables
dotenv.config();

// PERBAIKAN 2: Gunakan Secret Key yang SAMA PERSIS dengan auth.js
const SECRET_KEY = process.env.JWT_SECRET || process.env.SECRET_KEY || 'kunci_rahasia_default_siskapos';

// Convert db.query and transaction methods to Promise-based
const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db);
const commit = util.promisify(db.commit).bind(db);
const rollback = util.promisify(db.rollback).bind(db);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  // console.log('Request to Protected Route:', req.path); // Debugging

  // Ensure response will be JSON
  res.setHeader('Content-Type', 'application/json');

  const authHeader = req.headers.authorization;
  
  // Validasi format Header "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No valid token provided');
    return res.status(401).json({ 
      success: false,
      message: 'Token tidak ditemukan atau format salah. Silakan login kembali.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // PERBAIKAN 3: Verify menggunakan variable SECRET_KEY dari .env
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    // console.log('Token verified for user:', decoded.username);
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Sesi Anda telah berakhir (Token Expired). Silakan login ulang.'
      });
    }
    return res.status(401).json({ 
      success: false,
      message: 'Token tidak valid. Akses ditolak.' 
    });
  }
};

// Get all accounts with pagination, search, and filter
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Default 100
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const gender = req.query.gender || ''; // Filter gender
    
    // console.log('Fetching accounts params:', { page, limit, search, gender });

    let baseQuery = `
      SELECT 
        a.*, 
        u.role,
        r_latest.status_gizi
      FROM 
        accounts a 
      LEFT JOIN 
        users u ON a.username = u.username
      LEFT JOIN 
        -- Subquery untuk mengambil HANYA 1 entri riwayat terbaru per akun
        (
          SELECT 
            account_id, 
            status_gizi,
            ROW_NUMBER() OVER(PARTITION BY account_id ORDER BY tanggal_periksa DESC, id DESC) as rn
          FROM 
            riwayat_antropometri
        ) r_latest 
      ON a.id = r_latest.account_id AND r_latest.rn = 1
      WHERE 1=1
    `;
    
    const queryParams = [];
    if (search) {
      baseQuery += ` AND (
        a.nama_lengkap LIKE ? OR 
        a.username LIKE ? OR 
        a.nama_orang_tua LIKE ?
      )`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (gender && gender !== 'all') {
      baseQuery += ` AND a.jenis_kelamin = ?`;
      const normalizedGender = gender.toLowerCase() === 'laki-laki' ? 'Laki-laki' : 'Perempuan';
      queryParams.push(normalizedGender);
    }

    // Count total records
    let countQueryFiltered = `
      SELECT COUNT(*) as total
      FROM accounts a
      WHERE 1=1
    `;
    let countParams = [];
    if (search) {
      countQueryFiltered += ` AND (
        a.nama_lengkap LIKE ? OR 
        a.username LIKE ? OR 
        a.nama_orang_tua LIKE ?
      )`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
     if (gender && gender !== 'all') {
      countQueryFiltered += ` AND a.jenis_kelamin = ?`;
      const normalizedGender = gender.toLowerCase() === 'laki-laki' ? 'Laki-laki' : 'Perempuan';
      countParams.push(normalizedGender);
    }

    const [countResult] = await query(countQueryFiltered, countParams);

    // Get paginated data
    const dataQuery = baseQuery + ' ORDER BY a.nama_lengkap ASC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    const results = await query(dataQuery, queryParams);

    // console.log(`Returning ${results.length} accounts`);

    res.json({
      data: results,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(countResult.total / limit),
        totalRecords: countResult.total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Get history for a single account
router.get('/:id/history', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    // console.log('Fetching history for account ID:', id);

    const history = await query(
      `SELECT * FROM riwayat_antropometri 
       WHERE account_id = ? 
       ORDER BY tanggal_periksa DESC, id DESC`,
      [id]
    );

    res.json(history); // Akan mengembalikan array kosong jika tidak ada riwayat
  } catch (error) {
    console.error('Error fetching account history:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});


// Get single account
router.get('/:id', verifyToken, async (req, res) => {
  try {
    // console.log('Fetching account details for ID:', req.params.id);
    const [account] = await query(
      `SELECT a.*, u.role 
       FROM accounts a 
       LEFT JOIN users u ON a.username = u.username 
       WHERE a.id = ?`,
      [req.params.id]
    );

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    console.error('Error fetching account details:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Create new account
router.post('/', verifyToken, async (req, res) => {
  const {
    username,
    password,
    nama_lengkap,
    umur_bulan,
    jenis_kelamin,
    nama_orang_tua,
    alamat,
    nomor_hp,
  } = req.body;

  // console.log('Creating new account for username:', username);

  let transactionStarted = false;

  try {
    // Basic validation
    if (!username || typeof username !== 'string' || username.trim().length < 4) {
      return res.status(400).json({ 
        success: false,
        message: 'Username wajib diisi dan minimal 4 karakter' 
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password wajib diisi dan minimal 6 karakter' 
      });
    }

    if (!nama_lengkap || typeof nama_lengkap !== 'string' || nama_lengkap.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Nama lengkap wajib diisi' 
      });
    }

    if (umur_bulan === undefined || umur_bulan === null || isNaN(Number(umur_bulan)) || Number(umur_bulan) < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Umur bulan wajib diisi dan harus angka valid' 
      });
    }

    if (!jenis_kelamin) {
      return res.status(400).json({ 
        success: false,
        message: 'Jenis kelamin wajib diisi' 
      });
    }

    if (nomor_hp && (typeof nomor_hp !== 'string' || nomor_hp.length > 15)) {
      return res.status(400).json({ 
        success: false,
        message: 'Nomor HP maksimal 15 karakter' 
      });
    }

    await beginTransaction();
    transactionStarted = true;

    let jenisKelaminNormalized = null;
    if (jenis_kelamin) {
      const jk = String(jenis_kelamin).toLowerCase().trim();
      if (jk.includes('laki') || jk === 'l' || jk === 'laki') {
        jenisKelaminNormalized = 'Laki-laki';
      } else if (jk.includes('perempuan') || jk === 'p' || jk === 'perempuan') {
        jenisKelaminNormalized = 'Perempuan';
      } else {
        jenisKelaminNormalized = jenis_kelamin;
      }
    }

    const existingUserResult = await query(
      'SELECT username FROM users WHERE username = ?',
      [username.trim()]
    );

    if (existingUserResult && existingUserResult.length > 0) {
      await rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Username sudah digunakan' 
      });
    }

    const cleanUsername = username.trim();
    const cleanNamaLengkap = nama_lengkap.trim();
    const cleanNamaOrangTua = nama_orang_tua ? nama_orang_tua.trim() : null;
    const cleanAlamat = alamat ? alamat.trim() : null;
    const cleanNomorHp = nomor_hp ? nomor_hp.trim() : null;

    const accountResult = await query(
      `INSERT INTO accounts 
        (username, nama_lengkap, umur_bulan, jenis_kelamin, nama_orang_tua, alamat, nomor_hp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanUsername, 
        cleanNamaLengkap, 
        Number(umur_bulan), 
        jenisKelaminNormalized, 
        cleanNamaOrangTua, 
        cleanAlamat, 
        cleanNomorHp
      ]
    );

    // JIKA password ada, kita update user yang (seharusnya) dibuat oleh Trigger database.
    // Jika tidak ada trigger, bagian ini mungkin perlu INSERT INTO users dulu.
    // Asumsi: Sesuai kode Anda sebelumnya, Anda melakukan UPDATE.
    // Namun, jika user belum ada di tabel users, UPDATE tidak akan melakukan apa-apa.
    // PERBAIKAN LOGIKA (Safety Check): Cek apakah user ada, jika tidak INSERT.
    
    const checkUser = await query('SELECT id FROM users WHERE username = ?', [cleanUsername]);
    
    if (checkUser.length === 0) {
        // Insert Manual ke tabel Users jika belum ada (karena UPDATE doang ga bakal jalan)
        await query(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [cleanUsername, password, 'MASYARAKAT']
        );
    } else {
        await query(
            'UPDATE users SET password = ? WHERE username = ?',
            [password, cleanUsername]
        );
    }

    await commit();
    transactionStarted = false;

    // console.log('Account created successfully for:', cleanUsername);
    res.status(201).json({ 
      success: true,
      message: 'Akun berhasil dibuat',
      id: accountResult.insertId
    });

  } catch (error) {
    console.error('Error creating account:', error);
    
    if (transactionStarted) {
      try {
        await rollback();
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }

    let errorMessage = 'Gagal membuat akun';
    let statusCode = 500;

    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Username sudah digunakan';
      statusCode = 400;
    }

    const errorResponse = {
      success: false,
      message: errorMessage,
      error: error.message
    };

    res.status(statusCode).json(errorResponse);
  }
});

// Update account
router.put('/:id', verifyToken, async (req, res) => {
  const {
    nama_lengkap,
    umur_bulan,
    jenis_kelamin,
    nama_orang_tua,
    alamat,
    nomor_hp,
    password
  } = req.body;

  // console.log('Updating account ID:', req.params.id);

  try {
    await beginTransaction();

    if (!req.params.id || isNaN(Number(req.params.id))) {
      await rollback();
      return res.status(400).json({ 
        success: false,
        message: 'ID akun tidak valid'
      });
    }

    if (!nama_lengkap || isNaN(Number(umur_bulan)) || !jenis_kelamin) {
      await rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Nama, umur, dan jenis kelamin wajib diisi'
      });
    }
    
    let jenisKelaminNormalized = null;
    if (jenis_kelamin) {
      const jk = String(jenis_kelamin).toLowerCase();
      if (jk.includes('laki')) jenisKelaminNormalized = 'Laki-laki';
      else if (jk.includes('perempuan')) jenisKelaminNormalized = 'Perempuan';
      else jenisKelaminNormalized = jenis_kelamin;
    }

    const [existingAccount] = await query(
      'SELECT id FROM accounts WHERE id = ?',
      [req.params.id]
    );

    if (!existingAccount) {
      await rollback();
      return res.status(404).json({
        success: false,
        message: 'Akun tidak ditemukan'
      });
    }
    
    const result = await query(
      'UPDATE accounts SET nama_lengkap = ?, umur_bulan = ?, jenis_kelamin = ?, nama_orang_tua = ?, alamat = ?, nomor_hp = ? WHERE id = ?',
      [nama_lengkap, umur_bulan, jenisKelaminNormalized, nama_orang_tua, alamat, nomor_hp, req.params.id]
    );

    if (password) {
      await query(
        `UPDATE users u 
         JOIN accounts a ON u.username = a.username 
         SET u.password = ? 
         WHERE a.id = ?`,
        [password, req.params.id]
      );
    }

    await commit();
    // console.log('Account updated successfully, ID:', req.params.id);
    res.json({ 
      success: true,
      message: 'Akun berhasil diperbarui',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error updating account:', error);
    try {
      await rollback();
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }

    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui akun',
      error: error.message
    });
  }
});

// Delete account
router.delete('/:id', verifyToken, async (req, res) => {
  // console.log('Deleting account ID:', req.params.id);
  
  try {
    const accountId = parseInt(req.params.id);
    if (!accountId || isNaN(accountId)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID akun tidak valid' 
      });
    }

    // 1. Dapatkan username dari ID akun yang akan dihapus
    const [account] = await query(
      'SELECT username FROM accounts WHERE id = ?',
      [accountId]
    );

    // Jika akun tidak ditemukan
    if (!account || !account.username) {
      return res.status(404).json({ 
        success: false, 
        message: 'Akun tidak ditemukan' 
      });
    }

    // 2. Hapus user dari tabel 'users'.
    // ON DELETE CASCADE di database akan otomatis menghapus baris di 'accounts'.
    const result = await query(
      'DELETE FROM users WHERE username = ?',
      [account.username]
    );

    res.json({ 
      success: true,
      message: 'Akun berhasil dihapus (termasuk data user terkait)',
      deletedId: accountId
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    
    let errorMessage = 'Gagal menghapus akun';
    // Cek jika ada data lain yang terkait (misal: data imunisasi, dll)
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
      errorMessage = 'Tidak dapat menghapus akun karena masih terdapat data terkait (misal: data penimbangan)';
    }

    res.status(500).json({ 
      success: false,
      message: errorMessage
    });
  }
});


module.exports = router;
