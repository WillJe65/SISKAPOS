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

  try {
    // Basic validation
    if (!username || typeof username !== 'string' || username.length < 4) {
      return res.status(400).json({ message: 'Username wajib diisi dan minimal 4 karakter' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password wajib diisi dan minimal 6 karakter' });
    }
    if (!nama_lengkap || !umur_bulan || !jenis_kelamin) {
      return res.status(400).json({ message: 'Nama, umur, dan jenis kelamin wajib diisi' });
    }

  await beginTransaction();

    // Normalize jenis_kelamin to match DB enum values
    let jenisKelaminNormalized = null;
    if (jenis_kelamin) {
      const jk = String(jenis_kelamin).toLowerCase();
      if (jk.includes('laki')) jenisKelaminNormalized = 'Laki-laki';
      else if (jk.includes('perempuan')) jenisKelaminNormalized = 'Perempuan';
      else jenisKelaminNormalized = jenis_kelamin; // fallback to provided
    }

    // Check if username already exists
    const [existingUser] = await query(
      'SELECT username FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      console.log('Username already exists:', username);
  await rollback();
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    // Insert into accounts
    const [accountResult] = await query(
      `INSERT INTO accounts 
        (username, nama_lengkap, umur_bulan, jenis_kelamin, nama_orang_tua, alamat, nomor_hp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, nama_lengkap, umur_bulan, jenisKelaminNormalized, nama_orang_tua, alamat, nomor_hp]
    );

    // Update password if provided (trigger will have created the user)
    if (password) {
      await query(
        'UPDATE users SET password = ? WHERE username = ?',
        [password, username]
      );
    }

  await commit();
    console.log('Account created successfully for:', username);
    res.status(201).json({ 
      message: 'Akun berhasil dibuat',
      id: accountResult.insertId
    });
  } catch (error) {
    await rollback();
    console.error('Error creating account:', error);
    const details = {};
    if (error && error.sqlMessage) details.sqlMessage = error.sqlMessage;
    res.status(500).json({ 
      message: 'Gagal membuat akun', 
      error: error.message,
      details
    });
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

    // Basic validation
    if (!nama_lengkap || isNaN(Number(umur_bulan)) || !jenis_kelamin) {
      await rollback();
      return res.status(400).json({ message: 'Nama, umur, dan jenis kelamin wajib diisi' });
    }

    // Normalize jenis_kelamin to match DB enum values
    let jenisKelaminNormalized = null;
    if (jenis_kelamin) {
      const jk = String(jenis_kelamin).toLowerCase();
      if (jk.includes('laki')) jenisKelaminNormalized = 'Laki-laki';
      else if (jk.includes('perempuan')) jenisKelaminNormalized = 'Perempuan';
      else jenisKelaminNormalized = jenis_kelamin; // fallback
    }

    // Update account info
    const [result] = await query(
      `UPDATE accounts 
       SET nama_lengkap = ?, 
           umur_bulan = ?, 
           jenis_kelamin = ?,
           nama_orang_tua = ?,
           alamat = ?,
           nomor_hp = ?
       WHERE id = ?`,
      [nama_lengkap, umur_bulan, jenisKelaminNormalized, nama_orang_tua, alamat, nomor_hp, req.params.id]
    );

    if (result.affectedRows === 0) {
      console.log('Account not found for update, ID:', req.params.id);
  await rollback();
      return res.status(404).json({ message: 'Account not found' });
    }

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
    res.json({ message: 'Account updated successfully' });
  } catch (error) {
    await rollback();
    console.error('Error updating account:', error);
    const details = {};
    if (error && error.sqlMessage) details.sqlMessage = error.sqlMessage;
    res.status(500).json({ message: 'Gagal memperbarui akun', error: error.message, details });
  }
});

// Delete account
router.delete('/:id', verifyToken, async (req, res) => {
  console.log('Deleting account ID:', req.params.id);
  
  try {
    const [result] = await query(
      'DELETE FROM accounts WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      console.log('Account not found for deletion, ID:', req.params.id);
      return res.status(404).json({ message: 'Account not found' });
    }

    console.log('Account deleted successfully, ID:', req.params.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

module.exports = router;