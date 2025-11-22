const express = require('express');
// Sesuaikan path ini dengan lokasi db.js Anda (biasanya di folder config)
const db = require('../config/db'); 
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config(); 

const router = express.Router();
// Ambil kunci rahasia dari .env, atau gunakan default JIKA darurat (jangan pakai default di production)
const SECRET_KEY = process.env.JWT_SECRET || process.env.SECRET_KEY || 'kunci_rahasia_default_siskapos';

router.post('/login', (req, res) => {
    // SECURITY FIX 1: Hapus log yang menampilkan password!
    // console.log('login attempt:', req.body); -> INI BERBAHAYA

    const { username, password } = req.body;

    // Validasi Input
    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan Password wajib diisi.' });
    }

    // 1. Ambil role, pastikan string, huruf besar
    const role = req.body.role ? String(req.body.role).toUpperCase() : undefined;
    
    // console.log('Role login:', role); // Log role boleh, password JANGAN.

    // 2. Validasi Role
    if (role !== 'ADMIN' && role !== 'MASYARAKAT') {
      return res.status(403).json({ 
        message: `Role tidak valid. Harap pilih 'ADMIN' atau 'MASYARAKAT'.` 
      });
    }

    // 3. Query Database
    // CATATAN KEAMANAN: Saat ini password dicek langsung (Plain Text).
    // Untuk keamanan maksimal di masa depan, ubahlah menjadi Hashing (bcrypt).
    const query = `
      SELECT 
        u.id as user_id, 
        u.username, 
        u.role, 
        a.id as account_id 
      FROM 
        users u
      LEFT JOIN 
        accounts a ON u.username = a.username
      WHERE 
        u.username = ? AND u.password = ? AND u.role = ?
    `;
  
    db.query(query, [username, password, role], (err, results) => {
        if (err) {
            console.error('❌ Database Error saat Login:', err);
            return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
        }
        
        if (results.length === 0) {
            // Gunakan pesan umum agar hacker tidak bisa menebak user/password mana yang salah
            return res.status(401).json({ message: 'Username, Password, atau Role salah.' });
        }

        const user = results[0];
        
        // Tentukan ID yang akan disimpan di frontend
        const storedId = user.role === 'MASYARAKAT' ? user.account_id : user.user_id;
        
        // 4. Generate Token (JWT)
        const token = jwt.sign(
            { 
                id: user.user_id, 
                username: user.username, 
                role: user.role,
                accountId: user.account_id 
            },
            SECRET_KEY,
            { expiresIn: '2h' } // Token valid selama 2 jam
        );

        console.log(`✅ User ${username} (${role}) berhasil login.`);

        res.json({ 
            message: 'Login berhasil', 
            user: {
                id: storedId, 
                username: user.username, 
                role: user.role
            }, 
            token 
        });
    });
});

module.exports = router;