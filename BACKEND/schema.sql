-- =======================================================
-- INISIALISASI FIRST IF U DONT HAVE A DATABASE
-- =======================================================
CREATE DATABASE IF NOT EXISTS siskapos_db;
USE siskapos_db;

-- =======================================================
-- DROP TABLES (untuk reset data lama, opsional)
-- =======================================================
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;

-- =======================================================
-- CREATE TABLE: USERS
-- =======================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('ADMIN','MASYARAKAT') NOT NULL DEFAULT 'MASYARAKAT',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================
-- CREATE TABLE: ACCOUNTS
-- =======================================================
CREATE TABLE accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    nama_lengkap VARCHAR(255) NOT NULL,
    umur_bulan INT NOT NULL,
    jenis_kelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
    nama_orang_tua VARCHAR(255),
    alamat TEXT,
    nomor_hp VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =======================================================
-- TRIGGER: AUTO INSERT INTO USERS WHEN NEW ACCOUNT ADDED
-- =======================================================
DELIMITER $$

CREATE TRIGGER after_account_insert
BEFORE INSERT ON accounts
FOR EACH ROW
BEGIN
    -- Jika username belum ada di users, buat otomatis user baru
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = NEW.username) THEN
        INSERT INTO users (username, password, role)
        VALUES (NEW.username, 'password123', 'MASYARAKAT');
    END IF;
END$$

DELIMITER ;

-- =======================================================
-- DEFAULT ADMIN ACCOUNT
-- =======================================================
INSERT INTO users (username, password, role)
VALUES ('admin', 'admin123', 'ADMIN');

-- =======================================================
-- SAMPLE DATA (untuk testing)
-- =======================================================
INSERT INTO accounts (username, nama_lengkap, umur_bulan, jenis_kelamin, nama_orang_tua, alamat, nomor_hp)
VALUES
('user1', 'Ahmad Rizki', 24, 'Laki-laki', 'Budi Santoso', 'Jl. Melati No. 1', '08123456789'),
('user2', 'Siti Aisyah', 18, 'Perempuan', 'Ani Wulandari', 'Jl. Mawar No. 2', '08234567890'),
('user3', 'Muhammad Fajar', 36, 'Laki-laki', 'Dedi Kurniawan', 'Jl. Dahlia No. 3', '08345678901');

-- =======================================================
-- RESULT EXPLANATION
-- =======================================================
-- 1️⃣ Saat INSERT ke accounts (lihat di atas),
--     trigger otomatis akan menambahkan users baru
--     dengan password default 'password123' & role='MASYARAKAT'.
-- 2️⃣ Admin hanya ada di tabel users (tanpa accounts).
-- 3️⃣ Relasi antara users.username dan accounts.username adalah 1-to-1.
-- 4️⃣ Jika user dihapus dari users → datanya di accounts ikut terhapus.
-- 5️⃣ Jika account dihapus dari accounts → user di users tetap ada.