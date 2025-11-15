const express = require('express');
const db = require('../db'); // Pastikan path ini benar
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // <-- Tambahkan bcrypt

const router = express.Router();
// AMBIL SECRET_KEY DARI .env, jangan hardcode
const SECRET_KEY = process.env.SECRET_KEY || 'ganti-ini-di-file-env-anda';

// --- RUTE REGISTER (CONTOH) ---
// Anda perlu rute ini untuk membuat password yang di-hash
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        // Validasi input
        if (!username || !password || !role) {
            return res.status(400).json({ message: 'Username, password, dan role diperlukan.' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Simpan ke database (sesuaikan query Anda)
        // const query = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        // await db.query(query, [username, hashedPassword, role]);

        res.status(201).json({ message: 'User berhasil dibuat.' });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Kesalahan server saat register.' });
    }
});


// --- RUTE LOGIN (MEMBUAT TOKEN DI COOKIE) ---
router.post('/login', (req, res) => {
    console.log('login attempt:', req.body)
    const { username, password } = req.body; 
    const role = req.body.role ? String(req.body.role).toUpperCase() : undefined;
    
    if (role !== 'ADMIN' && role !== 'MASYARAKAT') {
      return res.status(403).json({ 
        message: `Role tidak valid. Menerima: '${req.body.role}', Mengharapkan: 'ADMIN' atau 'MASYARAKAT'.` 
      });
    }

    // --- LOGIKA LOGIN DENGAN BCRYPT ---
    // 1. Ambil user HANYA berdasarkan username & role
    const query = `
      SELECT 
        u.id as user_id, 
        u.username, 
        u.password as hashedPassword, // Ambil password yang di-hash
        u.role, 
        a.id as account_id 
      FROM 
        users u
      LEFT JOIN 
        accounts a ON u.username = a.username
      WHERE 
        u.username = ? AND u.role = ?
    `;
  
    db.query(query, [username, role], async (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Kesalahan server' });
        }
        
        if (results.length === 0) {
          return res.status(401).json({ message: 'Username atau role salah.' });
        }

        const user = results[0];

        // 2. Bandingkan password yang diberikan dengan hash di database
        const isMatch = await bcrypt.compare(password, user.hashedPassword);

        if (!isMatch) {
            return res.status(401).json({ message: 'Password salah.' });
        }
        
        const storedId = user.role === 'MASYARAKAT' ? user.account_id : user.user_id;
        
        // 3. Generate token
        const token = jwt.sign(
        { 
            id: user.user_id, 
            username: user.username, 
            role: user.role,
            accountId: user.account_id 
        },
        SECRET_KEY,
        { expiresIn: '2h' }
        );

        // 4. KIRIM TOKEN SEBAGAI COOKIE (Perubahan Kunci!)
        res.cookie('token', token, {
            httpOnly: true, // Cookie tidak bisa diakses JS frontend (aman)
            secure: process.env.NODE_ENV === 'production', // Set ke true saat di HTTPS
            maxAge: 1000 * 60 * 60 * 2 // 2 jam (samakan dgn expiresIn)
        });

        // 5. Kirim data user (tanpa token) ke frontend
        // Frontend akan tahu login berhasil dan menyimpan info user ini
        res.json({ 
          message: 'Login berhasil', 
          user: {
              id: storedId, 
              username: user.username,
              role: user.role
          }
          // Token tidak lagi dikirim di sini
        });
    });
});

// --- RUTE LOGOUT (MENGHAPUS COOKIE) ---
router.post('/logout', (req, res) => {
    // Hapus cookie 'token'
    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Logout berhasil' });
});

module.exports = router;