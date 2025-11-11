const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');
const router = express.Router();
const util = require('util');

const query = util.promisify(db.query).bind(db);

// Middleware Verifikasi Token
const verifyToken = (req, res, next) => {
  console.log('Request received for schedule:', {
    method: req.method,
    path: req.path,
  });
  res.setHeader('Content-Type', 'application/json');

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('No token provided');
    return res.status(401).json({
      success: false,
      message: 'Token tidak ditemukan.',
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('Invalid token format');
    return res.status(401).json({
      success: false,
      message: 'Format token tidak valid.',
    });
  }

  try {
    const decoded = jwt.verify(token, 'rahasia_posyandu');
    req.user = decoded;
    console.log('Token verified for user:', decoded.username);
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau kadaluarsa.',
    });
  }
};

// GET: Ambil semua jadwal (dengan penggabungan tanggal + waktu)
router.get('/', verifyToken, async (req, res) => {
  try {
    const results = await query('SELECT * FROM jadwals ORDER BY tanggal DESC, waktu_mulai DESC');
    
    // Gabungkan tanggal (DATE) dan waktu_mulai (TIME) menjadi DATETIME
    const combinedResults = results.map(jadwal => {
      let datePart;
      try {
        datePart = new Date(jadwal.tanggal).toISOString().split('T')[0];
      } catch (e) {
        console.error("Format tanggal invalid:", jadwal.tanggal);
        return null; 
      }
      
      const timePart = jadwal.waktu_mulai;

      if (!timePart) {
          console.error("Waktu mulai invalid:", jadwal.waktu_mulai);
          return null;
      }

      const combinedDate = new Date(`${datePart}T${timePart}`);
      
      return {
        ...jadwal,
        tanggal: combinedDate.toISOString()
      };
    }).filter(Boolean); // Hapus entri null (jika ada error tanggal/waktu)

    res.json({ success: true, data: combinedResults });

  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET: Ambil satu jadwal by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await query('SELECT * FROM jadwals WHERE id = ?', [id]);

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: 'Jadwal tidak ditemukan' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching single schedule:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST: Buat jadwal baru
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      tanggal,
      waktu_mulai,
      waktu_selesai,
      lokasi,
      alamat_lengkap,
      layanan,
      keterangan_tambahan,
    } = req.body;

    // Validasi dasar
    if (!tanggal || !waktu_mulai || !waktu_selesai || !lokasi) {
      return res.status(400).json({
        success: false,
        message: 'Data wajib (tanggal, waktu, lokasi) harus diisi',
      });
    }

    const newSchedule = {
      tanggal,
      waktu_mulai,
      waktu_selesai,
      lokasi,
      alamat_lengkap,
      layanan,
      keterangan_tambahan,
      status: 'Menunggu Konfirmasi',
    };

    const result = await query('INSERT INTO jadwals SET ?', newSchedule);

    res.status(201).json({
      success: true,
      message: 'Jadwal baru berhasil dibuat',
      id: result.insertId,
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat jadwal' });
  }
});

// PUT: Update jadwal
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tanggal,
      waktu_mulai,
      waktu_selesai,
      lokasi,
      alamat_lengkap,
      layanan,
      keterangan_tambahan,
    } = req.body;

    if (!tanggal || !waktu_mulai || !waktu_selesai || !lokasi) {
      return res.status(400).json({
        success: false,
        message: 'Data wajib (tanggal, waktu, lokasi) harus diisi',
      });
    }

    // Cek dulu apakah datanya ada
    const [existing] = await query('SELECT id FROM jadwals WHERE id = ?', [
      id,
    ]);

    if (!existing) {
      return res
        .status(44)
        .json({ success: false, message: 'Jadwal tidak ditemukan' });
    }

    // Jika ada, baru lakukan UPDATE
    const updatedData = {
      tanggal,
      waktu_mulai,
      waktu_selesai,
      lokasi,
      alamat_lengkap,
      layanan,
      keterangan_tambahan,
    };
    await query('UPDATE jadwals SET ? WHERE id = ?', [updatedData, id]);

    res.json({ success: true, message: 'Jadwal berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui jadwal' });
  }
});

// DELETE: Hapus jadwal
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM jadwals WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Jadwal tidak ditemukan' });
    }

    res.json({ success: true, message: 'Jadwal berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus jadwal' });
  }
});

// PUT: Konfirmasi jadwal
router.put('/:id/confirm', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      "UPDATE jadwals SET status = 'Terkonfirmasi' WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Jadwal tidak ditemukan' });
    }

    res.json({ success: true, message: 'Jadwal berhasil dikonfirmasi' });
  } catch (error) {
    console.error('Error confirming schedule:', error);
    res.status(500).json({ success: false, message: 'Gagal mengkonfirmasi jadwal' });
  }
});

// POST: Konfirmasi bulk (terpilih)
router.post('/bulk-confirm', verifyToken, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Tidak ada ID jadwal yang dipilih' });
    }

    const result = await query(
      "UPDATE jadwals SET status = 'Terkonfirmasi' WHERE id IN (?)",
      [ids]
    );

    res.json({
      success: true,
      message: `${result.affectedRows} jadwal berhasil dikonfirmasi`,
    });
  } catch (error) {
    console.error('Error bulk confirming schedules:', error);
    res.status(500).json({ success: false, message: 'Gagal mengkonfirmasi jadwal' });
  }
});

module.exports = router;