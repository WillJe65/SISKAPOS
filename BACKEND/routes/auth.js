const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SECRET_KEY = 'rahasia_posyandu';

router.post('/login', (req, res) => {
    console.log('login attempt:', req.body)
    const { username, password } = req.body; // Ambil role secara terpisah

    // --- PERBAIKAN DIMULAI DI SINI ---
    // 1. Ambil role, pastikan itu string, dan ubah ke huruf besar
    const role = req.body.role ? String(req.body.role).toUpperCase() : undefined;
    
    console.log('Role received and converted to uppercase:', role);

    // 2. Lakukan pengecekan dengan nilai yang sudah di-konversi
    if (role !== 'ADMIN' && role !== 'MASYARAKAT') {
      // Kirim pesan error yang lebih jelas
      return res.status(403).json({ 
        message: `Role tidak valid. Menerima: '${req.body.role}', Mengharapkan: 'ADMIN' atau 'MASYARAKAT'.` 
      });
    }
    // --- PERBAIKAN SELESAI ---

    // Query to check username, password, and role
    // Query ini sudah benar karena 'role' kini dijamin huruf besar
    const query = 'SELECT id, username, role FROM users WHERE username = ? AND password = ? AND role = ?';
  
    db.query(query, [username, password, role], (err, results) => {
        if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Kesalahan server' });
        }
        
        else if (results.length === 0) {
        return res.status(401).json({ message: 'Username, password, atau role salah.' });
        }

        const user = results[0];
        
        // Generate token
        const token = jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            role: user.role 
        },
        SECRET_KEY,
        { expiresIn: '2h' }
        );

        res.json({ 
        message: 'Login berhasil', 
        user: {
            id: user.id,
            username: user.username,
            role: user.role
        }, 
        token 
        });
    });
});

module.exports = router;