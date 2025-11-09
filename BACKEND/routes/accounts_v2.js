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
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
    console.log('Fetching accounts - Page:', page, 'Limit:', limit, 'Search:', search);

    // Base query with JOIN to get user role
    let baseQuery = `
      SELECT a.*, u.role 
      FROM accounts a 
      LEFT JOIN users u ON a.username = u.username
      WHERE 1=1
    `;
    
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

    // Count total records
    const countQuery = baseQuery.replace('a.*, u.role', 'COUNT(*) as total');
    const [countResult] = await query(countQuery, queryParams);

    // Get paginated data
    const dataQuery = baseQuery + ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
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
      return res.status(404).json({
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
    
    try {
      const [result] = await query(
        'UPDATE accounts SET nama_lengkap = ?, umur_bulan = ?, jenis_kelamin = ?, nama_orang_tua = ?, alamat = ?, nomor_hp = ? WHERE id = ?',
        [nama_lengkap, umur_bulan, jenisKelaminNormalized, nama_orang_tua, alamat, nomor_hp, req.params.id]
      );
      
      console.log('Update query result:', result);
      
      if (result.affectedRows === 0) {
        await rollback();
        return res.status(404).json({
          success: false,
          message: 'Akun tidak ditemukan atau tidak ada perubahan'
        });
      }
    } catch (error) {
      console.error('Error executing update query:', error);
      await rollback();
      throw error;
    }

    console.log('Update successful:', { affectedRows: result.affectedRows }); // Perbaikan: result.affectedRows

    // If password provided, update it
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

// =======================================================
// PERBAIKAN LOGIKA HAPUS DIMULAI DI SINI
// =======================================================
// Delete account - PERBAIKAN (Menghapus dari tabel 'users')
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

    // 1. Dapatkan username dari ID akun yang akan dihapus
    const [account] = await query(
      'SELECT username FROM accounts WHERE id = ?',
      [accountId]
    );

    // Jika akun tidak ditemukan
    if (!account || !account.username) {
      console.log('Account not found for ID:', accountId);
      return res.status(404).json({ 
        success: false, 
        message: 'Akun tidak ditemukan' 
      });
    }

    console.log(`Found username: ${account.username} for ID: ${accountId}. Deleting user...`);

    // 2. Hapus user dari tabel 'users'.
    // Sesuai schema.sql Anda, ON DELETE CASCADE akan otomatis
    // menghapus baris di tabel 'accounts' yang terkait.
    const [result] = await query(
      'DELETE FROM users WHERE username = ?',
      [account.username]
    );

    if (result.affectedRows === 0) {
      // Ini seharusnya tidak terjadi jika langkah 1 berhasil,
      // tapi ini adalah pengaman jika data user-nya tidak ada
      console.warn(`User ${account.username} not found in users table, but account ${accountId} was.`);
      // Tetap kirim sukses karena akunnya (mungkin) sudah tidak ada
    }

    console.log(`Successfully deleted user: ${account.username} (and cascaded to account ID: ${accountId})`);

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
// =======================================================
// PERBAIKAN LOGIKA HAPUS BERAKHIR DI SINI
// =======================================================

module.exports = router;