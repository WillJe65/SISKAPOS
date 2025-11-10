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

// Get all jadwals with pagination and search
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let baseQuery = `
      SELECT * FROM jadwals
      WHERE 1=1
    `;

    const queryParams = [];
    if (search) {
      baseQuery += ` AND (
        lokasi LIKE ? OR
        alamat_lengkap LIKE ? OR
        layanan LIKE ?
      )`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Count total records
    let countQuery = `
      SELECT COUNT(*) as total
      FROM jadwals
      WHERE 1=1
    `;
    let countParams = [];
    if (search) {
      countQuery += ` AND (
        lokasi LIKE ? OR
        alamat_lengkap LIKE ? OR
        layanan LIKE ?
      )`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countResult] = await query(countQuery, countParams);

    // Get paginated data
    const dataQuery = baseQuery + ' ORDER BY tanggal DESC, waktu_mulai ASC LIMIT ? OFFSET ?';
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
    console.error('Error fetching jadwals:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Get single jadwal
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [jadwal] = await query('SELECT * FROM jadwals WHERE id = ?', [req.params.id]);

    if (!jadwal) {
      return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
    }

    res.json(jadwal);
  } catch (error) {
    console.error('Error fetching jadwal:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Create new jadwal
router.post('/', verifyToken, async (req, res) => {
  const {
    tanggal,
    lokasi,
    waktu_mulai,
    waktu_selesai,
    alamat_lengkap,
    layanan,
    keterangan_tambahan
  } = req.body;

  try {
    // Basic validation
    if (!tanggal || !lokasi || !waktu_mulai || !waktu_selesai) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal, lokasi, waktu mulai dan waktu selesai wajib diisi'
      });
    }

    const result = await query(
      `INSERT INTO jadwals
        (tanggal, lokasi, waktu_mulai, waktu_selesai, alamat_lengkap, layanan, keterangan_tambahan)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tanggal, lokasi, waktu_mulai, waktu_selesai, alamat_lengkap || null, layanan || null, keterangan_tambahan || null]
    );

    res.status(201).json({
      success: true,
      message: 'Jadwal berhasil dibuat',
      id: result.insertId
    });

  } catch (error) {
    console.error('Error creating jadwal:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat jadwal',
      error: error.message
    });
  }
});

// Update jadwal
router.put('/:id', verifyToken, async (req, res) => {
  const {
    tanggal,
    lokasi,
    waktu_mulai,
    waktu_selesai,
    alamat_lengkap,
    layanan,
    keterangan_tambahan
  } = req.body;

  try {
    if (!req.params.id || isNaN(Number(req.params.id))) {
      return res.status(400).json({
        success: false,
        message: 'ID jadwal tidak valid'
      });
    }

    const [existingJadwal] = await query('SELECT id FROM jadwals WHERE id = ?', [req.params.id]);

    if (!existingJadwal) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan'
      });
    }

    await query(
      'UPDATE jadwals SET tanggal = ?, lokasi = ?, waktu_mulai = ?, waktu_selesai = ?, alamat_lengkap = ?, layanan = ?, keterangan_tambahan = ? WHERE id = ?',
      [tanggal, lokasi, waktu_mulai, waktu_selesai, alamat_lengkap || null, layanan || null, keterangan_tambahan || null, req.params.id]
    );

    res.json({
      success: true,
      message: 'Jadwal berhasil diperbarui',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error updating jadwal:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui jadwal',
      error: error.message
    });
  }
});

// Update status jadwal (confirm)
router.patch('/:id/status', verifyToken, async (req, res) => {
  const { status } = req.body;

  try {
    const jadwalId = parseInt(req.params.id);
    if (!jadwalId || isNaN(jadwalId)) {
      return res.status(400).json({
        success: false,
        message: 'ID jadwal tidak valid'
      });
    }

    if (!['Menunggu Konfirmasi', 'Terkonfirmasi'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid'
      });
    }

    const [existingJadwal] = await query('SELECT id FROM jadwals WHERE id = ?', [jadwalId]);

    if (!existingJadwal) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan'
      });
    }

    await query('UPDATE jadwals SET status = ? WHERE id = ?', [status, jadwalId]);

    res.json({
      success: true,
      message: 'Status jadwal berhasil diperbarui',
      id: jadwalId,
      status: status
    });
  } catch (error) {
    console.error('Error updating jadwal status:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status jadwal',
      error: error.message
    });
  }
});

// Bulk update status jadwal
router.patch('/bulk/status', verifyToken, async (req, res) => {
  const { ids, status } = req.body;

  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Daftar ID jadwal tidak valid'
      });
    }

    if (!['Menunggu Konfirmasi', 'Terkonfirmasi'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid'
      });
    }

    const placeholders = ids.map(() => '?').join(',');
    const [result] = await query(`UPDATE jadwals SET status = ? WHERE id IN (${placeholders})`, [status, ...ids]);

    res.json({
      success: true,
      message: `${result.affectedRows} jadwal berhasil diperbarui`,
      updatedCount: result.affectedRows,
      status: status
    });
  } catch (error) {
    console.error('Error bulk updating jadwal status:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status jadwal secara massal',
      error: error.message
    });
  }
});

// Delete jadwal
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const jadwalId = parseInt(req.params.id);
    if (!jadwalId || isNaN(jadwalId)) {
      return res.status(400).json({
        success: false,
        message: 'ID jadwal tidak valid'
      });
    }

    const [result] = await query('DELETE FROM jadwals WHERE id = ?', [jadwalId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Jadwal berhasil dihapus',
      deletedId: jadwalId
    });

  } catch (error) {
    console.error('Error deleting jadwal:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus jadwal'
    });
  }
});

module.exports = router;
