
const express = require('express');
const db = require('../db'); // use BACKEND/db.js
const router = express.Router();

// Accounts routes
router.get('/accounts', (req, res) => {
  const sql = `SELECT a.id, a.external_id, a.name, a.age_months, a.gender, a.parent_name, a.address, a.phone, a.user_id, u.username
               FROM accounts a
               LEFT JOIN users u ON a.user_id = u.id
               ORDER BY a.id DESC`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.get('/accounts/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'SELECT * FROM accounts WHERE id = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ error: 'Not found' });
    res.json(results[0]);
  });
});

router.post('/accounts', (req, res) => {
  const { user_id, name, age_months, gender, parent_name, address, phone, external_id, masyarakat } = req.body;
  const sql = `INSERT INTO accounts (user_id, name, age_months, gender, parent_name, address, phone, external_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [user_id, name, age_months || 0, gender || 'laki-laki', parent_name || null, address || null, phone || null, external_id || null], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const accountId = result.insertId;

    if (masyarakat && typeof masyarakat === 'object') {
      const m = masyarakat;
      const insertM = `INSERT INTO masyarakat_details (account_id, nik, birth_date, mother_name, father_name, keluarga_status, address, phone, additional)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                       ON DUPLICATE KEY UPDATE
                         nik = VALUES(nik),
                         birth_date = VALUES(birth_date),
                         mother_name = VALUES(mother_name),
                         father_name = VALUES(father_name),
                         keluarga_status = VALUES(keluarga_status),
                         address = VALUES(address),
                         phone = VALUES(phone),
                         additional = VALUES(additional),
                         updated_at = CURRENT_TIMESTAMP`;
      const params = [
        accountId,
        m.nik || null,
        m.birth_date || null,
        m.mother_name || null,
        m.father_name || null,
        m.keluarga_status || null,
        m.address || null,
        m.phone || null,
        m.additional ? JSON.stringify(m.additional) : null
      ];
      db.query(insertM, params, (err2) => {
        if (err2) {
          // rollback simple
          db.query('DELETE FROM accounts WHERE id = ?', [accountId], () => {
            return res.status(500).json({ error: 'Gagal menyimpan detail masyarakat: ' + err2.message });
          });
        } else {
          return res.status(201).json({ id: accountId });
        }
      });
    } else {
      return res.status(201).json({ id: accountId });
    }
  });
});

router.put('/accounts/:id', (req, res) => {
  const id = req.params.id;
  const { user_id, name, age_months, gender, parent_name, address, phone, external_id, masyarakat } = req.body;
  const sql = `UPDATE accounts SET user_id=?, name=?, age_months=?, gender=?, parent_name=?, address=?, phone=?, external_id=? WHERE id=?`;
  db.query(sql, [user_id, name, age_months || 0, gender || 'laki-laki', parent_name || null, address || null, phone || null, external_id || null, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    // handle masyarakat upsert if provided
    if (masyarakat && typeof masyarakat === 'object') {
      const m = masyarakat;
      const upsertM = `INSERT INTO masyarakat_details (account_id, nik, birth_date, mother_name, father_name, keluarga_status, address, phone, additional)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                       ON DUPLICATE KEY UPDATE
                         nik = VALUES(nik),
                         birth_date = VALUES(birth_date),
                         mother_name = VALUES(mother_name),
                         father_name = VALUES(father_name),
                         keluarga_status = VALUES(keluarga_status),
                         address = VALUES(address),
                         phone = VALUES(phone),
                         additional = VALUES(additional),
                         updated_at = CURRENT_TIMESTAMP`;
      const params = [
        id,
        m.nik || null,
        m.birth_date || null,
        m.mother_name || null,
        m.father_name || null,
        m.keluarga_status || null,
        m.address || null,
        m.phone || null,
        m.additional ? JSON.stringify(m.additional) : null
      ];
      db.query(upsertM, params, (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        return res.json({ affectedRows: result.affectedRows });
      });
    } else {
      res.json({ affectedRows: result.affectedRows });
    }
  });
});

router.delete('/accounts/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM accounts WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ affectedRows: result.affectedRows });
  });
});

// Users (for dropdown)
router.get('/users', (req, res) => {
  db.query('SELECT id, username FROM users ORDER BY username', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Masyarakat_details (one-to-one)
router.get('/masyarakat/:account_id', (req, res) => {
  const accountId = req.params.account_id;
  db.query('SELECT * FROM masyarakat_details WHERE account_id = ?', [accountId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ error: 'Not found' });
    res.json(results[0]);
  });
});

router.post('/masyarakat', (req, res) => {
  const d = req.body;
  if (!d.account_id) return res.status(400).json({ error: 'account_id required' });
  const sql = `INSERT INTO masyarakat_details (account_id, nik, birth_date, mother_name, father_name, keluarga_status, address, phone, additional)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
                 nik = VALUES(nik),
                 birth_date = VALUES(birth_date),
                 mother_name = VALUES(mother_name),
                 father_name = VALUES(father_name),
                 keluarga_status = VALUES(keluarga_status),
                 address = VALUES(address),
                 phone = VALUES(phone),
                 additional = VALUES(additional),
                 updated_at = CURRENT_TIMESTAMP`;
  const params = [
    d.account_id,
    d.nik || null,
    d.birth_date || null,
    d.mother_name || null,
    d.father_name || null,
    d.keluarga_status || null,
    d.address || null,
    d.phone || null,
    d.additional ? JSON.stringify(d.additional) : null
  ];
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, affectedRows: result.affectedRows, account_id: d.account_id });
  });
});

router.put('/masyarakat/:account_id', (req, res) => {
  const accountId = req.params.account_id;
  const d = req.body;
  const sql = `UPDATE masyarakat_details SET nik=?, birth_date=?, mother_name=?, father_name=?, keluarga_status=?, address=?, phone=?, additional=?, updated_at=CURRENT_TIMESTAMP WHERE account_id=?`;
  const params = [
    d.nik || null,
    d.birth_date || null,
    d.mother_name || null,
    d.father_name || null,
    d.keluarga_status || null,
    d.address || null,
    d.phone || null,
    d.additional ? JSON.stringify(d.additional) : null,
    accountId
  ];
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ affectedRows: result.affectedRows });
  });
});

router.delete('/masyarakat/:account_id', (req, res) => {
  const accountId = req.params.account_id;
  db.query('DELETE FROM masyarakat_details WHERE account_id = ?', [accountId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ affectedRows: result.affectedRows });
  });
});

module.exports = router;