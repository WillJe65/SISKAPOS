const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SECRET_KEY = 'rahasia_posyandu';

router.post('/login', (req, res) => {
    console.log('login attempt:',req.body)
  const { username, password, role } = req.body;

  if (role !== 'ADMIN' && role !== 'MASYRAKAT') {
    return res.status(403).json({ message: 'Role tidak valid.' });
  }

  // Query to check username, password, and role
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