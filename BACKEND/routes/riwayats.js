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

// Get all riwayats with pagination and search
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT * FROM riwayats
      WHERE 1=1
    `;

    const queryParams = [];

    // Count total records
    let countQuery = `SELECT COUNT(*) as total FROM riwayats`;
    const [countResult] = await query(countQuery);

    // Get paginated data
    const dataQuery = baseQuery + ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
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
    console.error('Error fetching riwayats:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Get single riwayat
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [riwayat] = await query('SELECT * FROM riwayats WHERE id = ?', [req.params.id]);

    if (!riwayat) {
      return res.status(404).json({ message: 'Riwayat tidak ditemukan' });
    }

    res.json(riwayat);
  } catch (error) {
    console.error('Error fetching riwayat:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Create new riwayat
router.post('/', verifyToken, async (req, res) => {
  const {
    berat_badan,
    tinggi_badan,
    lingkar_kepala,
    lingkar_lengan,
    lingkar_badan
  } = req.body;

  try {
    // Basic validation
    if (!berat_badan || !tinggi_badan) {
      return res.status(400).json({
        success: false,
        message: 'Berat badan dan tinggi badan wajib diisi'
      });
    }

    const result = await query(
      `INSERT INTO riwayats
        (berat_badan, tinggi_badan, lingkar_kepala, lingkar_lengan, lingkar_badan)
       VALUES (?, ?, ?, ?, ?)`,
      [berat_badan, tinggi_badan, lingkar_kepala || null, lingkar_lengan || null, lingkar_badan || null]
    );

    res.status(201).json({
      success: true,
      message: 'Riwayat berhasil dibuat',
      id: result.insertId
    });

  } catch (error) {
    console.error('Error creating riwayat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat riwayat',
      error: error.message
    });
  }
});

// Update riwayat
router.put('/:id', verifyToken, async (req, res) => {
  const {
    berat_badan,
    tinggi_badan,
    lingkar_kepala,
    lingkar_lengan,
    lingkar_badan
  } = req.body;

  try {
    if (!req.params.id || isNaN(Number(req.params.id))) {
      return res.status(400).json({
        success: false,
        message: 'ID riwayat tidak valid'
      });
    }

    const [existingRiwayat] = await query('SELECT id FROM riwayats WHERE id = ?', [req.params.id]);

    if (!existingRiwayat) {
      return res.status(404).json({
        success: false,
        message: 'Riwayat tidak ditemukan'
      });
    }

    await query(
      'UPDATE riwayats SET berat_badan = ?, tinggi_badan = ?, lingkar_kepala = ?, lingkar_lengan = ?, lingkar_badan = ? WHERE id = ?',
      [berat_badan, tinggi_badan, lingkar_kepala || null, lingkar_lengan || null, lingkar_badan || null, req.params.id]
    );

    res.json({
      success: true,
      message: 'Riwayat berhasil diperbarui',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error updating riwayat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui riwayat',
      error: error.message
    });
  }
});

// Delete riwayat
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const riwayatId = parseInt(req.params.id);
    if (!riwayatId || isNaN(riwayatId)) {
      return res.status(400).json({
        success: false,
        message: 'ID riwayat tidak valid'
      });
    }

    const [result] = await query('DELETE FROM riwayats WHERE id = ?', [riwayatId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Riwayat tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Riwayat berhasil dihapus',
      deletedId: riwayatId
    });

  } catch (error) {
    console.error('Error deleting riwayat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus riwayat'
    });
  }
});

module.exports = router;
