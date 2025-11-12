const mysql = require('mysql2')

const db = mysql.createConnection({
  host:   process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect(err => {
  if (err) console.error('Database connection failed:', err);
  else console.log('Connected to MySQL');
});

module.exports = db;