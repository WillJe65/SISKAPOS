const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');
const router = express.Router();
const util = require('util');

// Convert db.query and transaction methods to Promise-based
const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db);
const commit = util.promisify(db.commit).bind(db);
const rollback = util.promisify(db.rollback).bind(db);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  console.log('Request received:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    query: req.query
  });

  // Ensure response will be JSON
  res.setHeader('Content-Type', 'application/json');

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('No token provided in request');
    return res.status(401).json({ 
      success: false,
      message: 'Token tidak ditemukan. Silakan login kembali.' 
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('Invalid Authorization header format');
    return res.status(401).json({ 
      success: false,
      message: 'Format token tidak valid. Silakan login kembali.' 
    });
  }

  try {
    const decoded = jwt.verify(token, 'rahasia_posyandu');
    req.user = decoded;
    console.log('Token verified for user:', decoded.username);
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token sudah kadaluarsa. Silakan login kembali.'
      });
    }
    return res.status(401).json({ 
      success: false,
      message: 'Token tidak valid. Silakan login kembali.' 
    });
  }
};

// Get all accounts with pagination and search
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Default limit 100
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const gender = req.query.gender || ''; // Filter gender
    
    console.log('Fetching accounts - Page:', page, 'Limit:', limit, 'Search:', search, 'Gender:', gender);

    // --- MODIFIKASI DIMULAI ---
    // Query untuk mengambil status gizi terbaru
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
            -- Baris ini penting untuk mengurutkan
            ROW_NUMBER() OVER(PARTITION BY account_id ORDER BY tanggal_periksa DESC, id DESC) as rn
          FROM 
            riwayat_antropometri
        ) r_latest 
      -- Gabungkan hanya pada entri terbaru (rn = 1)
      ON a.id = r_latest.account_id AND r_latest.rn = 1
      WHERE 1=1
    `;
    // --- MODIFIKASI SELESAI ---
    
    // Add search condition if search parameter exists
    const queryParams = [];
    if (search) {
      baseQuery += ` AND (
        a.nama_lengkap LIKE ? OR 
        a.username LIKE ? OR 
        a.nama_orang_tua LIKE ?
      )`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // --- MODIFIKASI BARU UNTUK GENDER ---
    if (gender && gender !== 'all') {
      baseQuery += ` AND a.jenis_kelamin = ?`;
      queryParams.push(gender); // Asumsi 'Laki-laki' or 'Perempuan'
    }
    // --- MODIFIKASI SELESAI ---


    // Count total records
    const countQuery = baseQuery
      .replace('SELECT a.*, u.role, r_latest.status_gizi', 'SELECT COUNT(DISTINCT a.id) as total')
      .split('ON a.id = r_latest.account_id AND r_latest.rn = 1')[0] + ' WHERE 1=1'; // Simplified count
      
    // Re-add search/filter to count query
    let countParams = [];
    let countQueryFiltered = `
      SELECT COUNT(*) as total
      FROM accounts a
      WHERE 1=1
    `;
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
      countParams.push(gender);
    }

    const [countResult] = await query(countQueryFiltered, countParams);


    // Get paginated data
    const dataQuery = baseQuery + ' ORDER BY a.nama_lengkap ASC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    const results = await query(dataQuery, queryParams);

    console.log(`Found ${countResult.total} total records, returning ${results.length} results`);

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

// --- RUTE BARU UNTUK RIWAYAT ---
// Get history for a single account
router.get('/:id/history', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching history for account ID:', id);

    const history = await query(
      `SELECT * FROM riwayat_antropometri 
       WHERE account_id = ? 
       ORDER BY tanggal_periksa DESC, id DESC`,
      [id]
    );

    if (!history) {
      // query akan return array kosong jika tidak ada, bukan null
      return res.json([]); // Kembalikan array kosong
    }

    res.json(history);
  } catch (error) {
    console.error('Error fetching account history:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});
// --- AKHIR RUTE BARU ---


// Get single account
router.get('/:id', verifyToken, async (req, res) => {
  try {
    console.log('Fetching account details for ID:', req.params.id);
    const [account] = await query(
      `SELECT a.*, u.role 
       FROM accounts a 
       LEFT JOIN users u ON a.username = u.username 
       WHERE a.id = ?`,
      [req.params.id]
    );

    if (!account) {
      console.log('Account not found for ID:', req.params.id);
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

  console.log('Creating new account for username:', username);
  console.log('POST /api/accounts payload:', req.body);

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

    if (!umur_bulan || isNaN(Number(umur_bulan)) || Number(umur_bulan) < 0) {
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

    // Validasi nomor HP jika diisi
    if (nomor_hp && (typeof nomor_hp !== 'string' || nomor_hp.length > 15)) {
      return res.status(400).json({ 
        success: false,
        message: 'Nomor HP maksimal 15 karakter' 
      });
    }

    // Start transaction
    await beginTransaction();
    transactionStarted = true;

    // Normalize jenis_kelamin to match DB enum values
    let jenisKelaminNormalized = null;
    if (jenis_kelamin) {
      const jk = String(jenis_kelamin).toLowerCase().trim();
      if (jk.includes('laki') || jk === 'l' || jk === 'laki') {
        jenisKelaminNormalized = 'Laki-laki';
      } else if (jk.includes('perempuan') || jk === 'p' || jk === 'perempuan') {
        jenisKelaminNormalized = 'Perempuan';
      } else {
        jenisKelaminNormalized = jenis_kelamin; // fallback to provided
      }
    }

    // PERBAIKAN: Check if username already exists - tanpa destructuring
    const existingUserResult = await query(
      'SELECT username FROM users WHERE username = ?',
      [username.trim()]
    );

    // PERBAIKAN: Cek hasil query dengan benar
    if (existingUserResult && existingUserResult.length > 0) {
      console.log('Username already exists:', username);
      await rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Username sudah digunakan' 
      });
    }

    // Trim and clean data
    const cleanUsername = username.trim();
    const cleanNamaLengkap = nama_lengkap.trim();
    const cleanNamaOrangTua = nama_orang_tua ? nama_orang_tua.trim() : null;
    const cleanAlamat = alamat ? alamat.trim() : null;
    const cleanNomorHp = nomor_hp ? nomor_hp.trim() : null;

    // PERBAIKAN: Insert into accounts - tanpa destructuring
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

    // Update password if provided (trigger will have created the user)
    if (password) {
      await query(
        'UPDATE users SET password = ? WHERE username = ?',
        [password, cleanUsername]
      );
    }

    await commit();
    transactionStarted = false;

    console.log('Account created successfully for:', cleanUsername);
    res.status(201).json({ 
      success: true,
      message: 'Akun berhasil dibuat',
      id: accountResult.insertId
    });

  } catch (error) {
    console.error('Error creating account:', error);
    
    // Rollback hanya jika transaction sudah dimulai
    if (transactionStarted) {
      try {
        await rollback();
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }

    // Handle specific database errors
    let errorMessage = 'Gagal membuat akun';
    let statusCode = 500;

    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Username sudah digunakan';
      statusCode = 400;
    } else if (error.code === 'ER_NO_REFERENCED_ROW' || error.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = 'Data referensi tidak valid';
      statusCode = 400;
    }

    const errorResponse = {
      success: false,
      message: errorMessage,
      error: error.message
    };

    // Tambahkan detail SQL error hanya di development
    if (process.env.NODE_ENV !== 'production' && error.sqlMessage) {
      errorResponse.details = { sqlMessage: error.sqlMessage };
    }

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

  console.log('Updating account ID:', req.params.id);
  console.log('PUT /api/accounts/' + req.params.id + ' payload:', req.body);

  try {
    await beginTransaction();

    // Validate ID
    if (!req.params.id || isNaN(Number(req.params.id))) {
      await rollback();
      return res.status(400).json({ 
        success: false,
        message: 'ID akun tidak valid'
      });
    }

    // Basic validation
    if (!nama_lengkap || isNaN(Number(umur_bulan)) || !jenis_kelamin) {
      await rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Nama, umur, dan jenis kelamin wajib diisi'
      });
    }

    // Log the validated data
    console.log('Validated update data:', {
      id: req.params.id,
      nama_lengkap,
      umur_bulan,
      jenis_kelamin,
      nama_orang_tua,
      alamat,
      nomor_hp
    });    // Normalize jenis_kelamin to match DB enum values
    let jenisKelaminNormalized = null;
    if (jenis_kelamin) {
      const jk = String(jenis_kelamin).toLowerCase();
      if (jk.includes('laki')) jenisKelaminNormalized = 'Laki-laki';
      else if (jk.includes('perempuan')) jenisKelaminNormalized = 'Perempuan';
      else jenisKelaminNormalized = jenis_kelamin; // fallback
    }

    // First check if account exists
    const [existingAccount] = await query(
      'SELECT id FROM accounts WHERE id = ?',
      [req.params.id]
    );

    if (!existingAccount) {
      await rollback();
      return res.status(4404).json({
        success: false,
        message: 'Akun tidak ditemukan'
      });
    }

    // Update account info
    console.log('Executing update with params:', {
      nama_lengkap,
      umur_bulan,
      jenis_kelamin: jenisKelaminNormalized,
      nama_orang_tua,
      alamat,
      nomor_hp,
      id: req.params.id
    });
    
    // Inisialisasi result di luar try-catch
    let result; 
    try {
      // Gunakan [result] untuk mendapatkan objek hasil
      [result] = await query(
        'UPDATE accounts SET nama_lengkap = ?, umur_bulan = ?, jenis_kelamin = ?, nama_orang_tua = ?, alamat = ?, nomor_hp = ? WHERE id = ?',
        [nama_lengkap, umur_bulan, jenisKelaminNormalized, nama_orang_tua, alamat, nomor_hp, req.params.id]
      );
      
      console.log('Update query result:', result);
      
      if (result.affectedRows === 0) {
        // Ini bisa terjadi jika datanya sama persis, tidak perlu error
        console.log('No rows affected, data might be identical.');
      }
    } catch (error) {
      console.error('Error executing update query:', error);
      await rollback();
      throw error; // Lemparkan error agar ditangkap oleh catch luar
    }

    // Password update (jika ada)
    if (password && password.length > 0) {
      console.log('Updating password for account ID:', req.params.id);
      await query(
        `UPDATE users u 
         JOIN accounts a ON u.username = a.username 
         SET u.password = ? 
         WHERE a.id = ?`,
        [password, req.params.id]
      );
    }

    await commit();
    console.log('Account updated successfully, ID:', req.params.id);
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

    const errorResponse = {
      success: false,
      message: 'Gagal memperbarui akun',
      error: error.message,
      details: {}
    };

    if (error.sqlMessage) {
      errorResponse.details.sqlMessage = error.sqlMessage;
    }
    
    // Log the complete error state
    console.error('Sending error response:', errorResponse);
    
    res.status(500).json(errorResponse);
  }
});


// Delete account - SIMPLE VERSION
router.delete('/:id', verifyToken, async (req, res) => {
  console.log('Deleting account ID:', req.params.id);
  
  try {
    const accountId = parseInt(req.params.id);
    if (!accountId || isNaN(accountId)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID akun tidak valid' 
      });
    }

    // Gunakan approach yang lebih robust
    const result = await query(
      'DELETE FROM accounts WHERE id = ?',
      [accountId]
    );

    // Universal affectedRows check
    const affectedRows = 
      result?.affectedRows ?? 
      result?.[0]?.affectedRows ?? 
      result?.rows?.affectedRows ?? 
      0;

    console.log('Delete operation - affectedRows:', affectedRows);

    if (affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Akun tidak ditemukan' 
      });
    }

    res.json({ 
      success: true,
      message: 'Akun berhasil dihapus',
      deletedId: accountId
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    
    let errorMessage = 'Gagal menghapus akun';
    // --- MODIFIKASI: Penanganan error constraint ---
    // riwayat_antropometri memiliki ON DELETE CASCADE,
    // jadi error ini seharusnya tidak terjadi jika schema.sql dijalankan
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
      errorMessage = 'Tidak dapat menghapus akun karena masih terdapat data riwayat terkait. Hapus riwayat terlebih dahulu.';
    }

    res.status(500).json({ 
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
});

module.exports = router;