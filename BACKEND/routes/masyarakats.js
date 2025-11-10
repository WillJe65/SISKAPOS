const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');
const util = require('util');

const router = express.Router();

// Convert db.query and transaction methods to Promise-based
const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db);
const commit = util.promisify(db.commit).bind(db);
const rollback = util.promisify(db.rollback).bind(db);

// Middleware to verify JWT token
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

// Get all masyarakats with pagination and search
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    let baseQuery = `
      SELECT * FROM masyarakats
      WHERE 1=1
    `;

    const queryParams = [];
    if (search) {
      baseQuery += ` AND (
        nama_anak LIKE ? OR
        nama_orang_tua LIKE ? OR
        alamat LIKE ?
      )`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && status !== 'all') {
      baseQuery += ` AND status = ?`;
      queryParams.push(status);
    }

    // Count total records
    let countQuery = `
      SELECT COUNT(*) as total
      FROM masyarakats
      WHERE 1=1
    `;
    let countParams = [];
    if (search) {
      countQuery += ` AND (
        nama_anak LIKE ? OR
        nama_orang_tua LIKE ? OR
        alamat LIKE ?
      )`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status && status !== 'all') {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }

    const [countResult] = await query(countQuery, countParams);

    // Get paginated data
    const dataQuery = baseQuery + ' ORDER BY nama_anak ASC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    const results = await query(dataQuery, queryParams);

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
    console.error('Error fetching masyarakats:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Get single masyarakat
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [masyarakat] = await query('SELECT * FROM masyarakats WHERE id = ?', [req.params.id]);

    if (!masyarakat) {
      return res.status(404).json({ message: 'Masyarakat tidak ditemukan' });
    }

    res.json(masyarakat);
  } catch (error) {
    console.error('Error fetching masyarakat:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Create new masyarakat
router.post('/', verifyToken, async (req, res) => {
  const {
    nik,
    nama_anak,
    umur_bulan,
    jenis_kelamin,
    nama_orang_tua,
    alamat,
    no_hp,
    status
  } = req.body;

  try {
    // Basic validation
    if (!nik || !nama_anak || !umur_bulan || !jenis_kelamin) {
      return res.status(400).json({
        success: false,
        message: 'NIK, nama anak, umur bulan, dan jenis kelamin wajib diisi'
      });
    }

    // Check if NIK already exists
    const [existingNik] = await query('SELECT id FROM masyarakats WHERE nik = ?', [nik]);
    if (existingNik) {
      return res.status(400).json({
        success: false,
        message: 'NIK sudah terdaftar'
      });
    }

    const result = await query(
      `INSERT INTO masyarakats
        (nik, nama_anak, umur_bulan, jenis_kelamin, nama_orang_tua, alamat, no_hp, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nik, nama_anak, umur_bulan, jenis_kelamin, nama_orang_tua || null, alamat || null, no_hp || null, status || 'Aktif']
    );

    res.status(201).json({
      success: true,
      message: 'Masyarakat berhasil dibuat',
      id: result.insertId
    });

  } catch (error) {
    console.error('Error creating masyarakat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat masyarakat',
      error: error.message
    });
  }
});

// Update masyarakat
router.put('/:id', verifyToken, async (req, res) => {
  const {
    nik,
    nama_anak,
    umur_bulan,
    jenis_kelamin,
    nama_orang_tua,
    alamat,
    no_hp,
    status
  } = req.body;

  try {
    if (!req.params.id || isNaN(Number(req.params.id))) {
      return res.status(400).json({
        success: false,
        message: 'ID masyarakat tidak valid'
      });
    }

    const [existingMasyarakat] = await query('SELECT id FROM masyarakats WHERE id = ?', [req.params.id]);

    if (!existingMasyarakat) {
      return res.status(404).json({
        success: false,
        message: 'Masyarakat tidak ditemukan'
      });
    }

    // Check if NIK already exists for another record
    if (nik) {
      const [nikCheck] = await query('SELECT id FROM masyarakats WHERE nik = ? AND id != ?', [nik, req.params.id]);
      if (nikCheck) {
        return res.status(400).json({
          success: false,
          message: 'NIK sudah digunakan oleh masyarakat lain'
        });
      }
    }

    await query(
      'UPDATE masyarakats SET nik = ?, nama_anak = ?, umur_bulan = ?, jenis_kelamin = ?, nama_orang_tua = ?, alamat = ?, no_hp = ?, status = ? WHERE id = ?',
      [nik, nama_anak, umur_bulan, jenis_kelamin, nama_orang_tua || null, alamat || null, no_hp || null, status || 'Aktif', req.params.id]
    );

    res.json({
      success: true,
      message: 'Masyarakat berhasil diperbarui',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error updating masyarakat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui masyarakat',
      error: error.message
    });
  }
});

// Delete masyarakat
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const masyarakatId = parseInt(req.params.id);
    if (!masyarakatId || isNaN(masyarakatId)) {
      return res.status(400).json({
        success: false,
        message: 'ID masyarakat tidak valid'
      });
    }

    const [result] = await query('DELETE FROM masyarakats WHERE id = ?', [masyarakatId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Masyarakat tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Masyarakat berhasil dihapus',
      deletedId: masyarakatId
    });

  } catch (error) {
    console.error('Error deleting masyarakat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus masyarakat'
    });
  }
});

module.exports = router;
