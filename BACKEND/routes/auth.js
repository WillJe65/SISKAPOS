const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SECRET_KEY = 'rahasia_posyandu';

router.post('/login', (req, res) => {
    console.log('login attempt:', req.body)
    const { username, password } = req.body; 

    // 1. Ambil role, pastikan itu string, dan ubah ke huruf besar
    const role = req.body.role ? String(req.body.role).toUpperCase() : undefined;
    
    console.log('Role received and converted to uppercase:', role);

    // 2. Lakukan pengecekan role
    if (role !== 'ADMIN' && role !== 'MASYARAKAT') {
      return res.status(403).json({ 
        message: `Role tidak valid. Menerima: '${req.body.role}', Mengharapkan: 'ADMIN' atau 'MASYARAKAT'.` 
      });
    }

    // 3. Query untuk mengambil user_id dan account_id
    //    LEFT JOIN digunakan agar admin (yang tidak punya data di tabel accounts) tetap bisa login
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
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Kesalahan server' });
        }
        
        else if (results.length === 0) {
        return res.status(401).json({ message: 'Username, password, atau role salah.' });
        }

        const user = results[0];
        
        // Tentukan ID yang akan disimpan di localStorage frontend:
        // MASYARAKAT menggunakan account_id (untuk relasi ke riwayat)
        // ADMIN menggunakan user_id (karena account_id mereka null)
        const storedId = user.role === 'MASYARAKAT' ? user.account_id : user.user_id;
        
        // Generate token
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

        res.json({ 
          message: 'Login berhasil', 
          user: {
              // Kirim ID yang benar ke frontend
              id: storedId, 
              username: user.username,
              role: user.role
          }, 
          token 
        });
    });
});

module.exports = router;