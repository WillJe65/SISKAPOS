-- =======================================================
-- INISIALISASI FIRST IF U DONT HAVE A DATABASE
-- =======================================================
CREATE DATABASE IF NOT EXISTS siskapos_db;
USE siskapos_db;

-- =======================================================
-- DROP TABLES (untuk reset data lama, opsional)
-- =======================================================
-- Urutan drop penting karena Foreign Key
DROP TABLE IF EXISTS riwayat_antropometri;
DROP TABLE IF EXISTS jadwals;
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
-- CREATE TABLE: RIWAYAT ANTROPOMETRI
-- =======================================================
CREATE TABLE IF NOT EXISTS riwayat_antropometri (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  tanggal_periksa DATE NOT NULL DEFAULT (CURRENT_DATE),
  umur_bulan_saat_periksa INT NOT NULL,
  berat_badan_kg DECIMAL(5, 2) NOT NULL,
  tinggi_badan_cm DECIMAL(5, 2) NOT NULL,
  lingkar_kepala_cm DECIMAL(5, 2),
  bmi DECIMAL(4, 1),
  status_gizi VARCHAR(50),
  rekomendasi_ai TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (account_id) REFERENCES accounts(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =======================================================
-- CREATE TABLE: JADWALS
-- =======================================================
CREATE TABLE IF NOT EXISTS jadwals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tanggal DATE NOT NULL,
  lokasi VARCHAR(255) NOT NULL,
  waktu_mulai TIME NOT NULL,
  waktu_selesai TIME NOT NULL,
  alamat_lengkap TEXT,
  layanan TEXT,
  keterangan_tambahan TEXT,
  status ENUM('Menunggu Konfirmasi', 'Terkonfirmasi') DEFAULT 'Menunggu Konfirmasi',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
-- DEFAULT ADMIN ACCOUNT & SAMPLE USERS
-- =======================================================
-- Memasukkan data users sesuai dump MariaDB (ID 1, 13, 17, 18)
INSERT INTO users (id, username, password, role, created_at) VALUES
(1, 'admin', 'admin123', 'ADMIN', '2025-11-04 12:26:39'),
(13, 'masyarakat', 'masyarakat123', 'MASYARAKAT', '2025-11-11 10:18:34'),
(17, 'Dzaky', 'dzaky123', 'MASYARAKAT', '2025-11-12 04:26:09'),
(18, 'perempuan', 'perempuan123', 'MASYARAKAT', '2025-11-12 04:33:24');

-- =======================================================
-- SAMPLE DATA (untuk testing)
-- =======================================================
-- Memasukkan data accounts sesuai dump MariaDB (ID 14, 20, 21)
INSERT INTO accounts (id, username, nama_lengkap, umur_bulan, jenis_kelamin, nama_orang_tua, alamat, nomor_hp, created_at) VALUES
(14, 'masyarakat', 'Masyarakat Siskapos', 18, 'Laki-laki', 'Admin Siskapos', 'dimana mana', '082131321131', '2025-11-11 10:18:34'),
(20, 'Dzaky', 'Dzaky Sigmadhani', 20, 'Laki-laki', 'Itera', 'dimana mana', '082131313131', '2025-11-12 04:26:09'),
(21, 'perempuan', 'Perempuan Nibba', 18, 'Perempuan', 'Orangtua Nibba', 'disitu', '08123123132131', '2025-11-12 04:33:24');

-- Memasukkan data riwayat_antropometri sesuai dump MariaDB (ID 1, 3, 4, 5)
INSERT INTO riwayat_antropometri (id, account_id, tanggal_periksa, umur_bulan_saat_periksa, berat_badan_kg, tinggi_badan_cm, lingkar_kepala_cm, bmi, status_gizi, rekomendasi_ai, created_at) VALUES
(1, 14, '2025-11-11', 15, 12.00, 85.00, 48.00, 16.6, 'Gizi Kurang', 'Gagal memuat rekomendasi dari AI. Mohon berikan saran gizi seimbang.', '2025-11-11 23:02:15'),
(3, 14, '2025-11-12', 18, 20.00, 90.00, 50.00, 24.7, 'Gizi Lebih', 'Gagal memuat rekomendasi dari AI. Mohon berikan saran gizi seimbang.', '2025-11-12 02:08:03'),
(4, 20, '2025-11-12', 20, 20.00, 80.00, 50.00, 31.2, 'Obesitas', 'Gagal memuat rekomendasi dari AI. Mohon berikan saran gizi seimbang.', '2025-11-12 04:31:48'),
(5, 21, '2025-11-12', 18, 13.00, 90.00, 48.00, 16.0, 'Gizi Kurang', 'Gagal memuat rekomendasi dari AI. Mohon berikan saran gizi seimbang.', '2025-11-12 04:33:40');

-- Memasukkan data jadwals sesuai dump MariaDB (ID 15, 16, 17)
INSERT INTO jadwals (id, tanggal, lokasi, waktu_mulai, waktu_selesai, alamat_lengkap, layanan, keterangan_tambahan, status, created_at, updated_at) VALUES
(15, '2025-11-13', 'Posyandu RW 01', '03:09:00', '04:09:00', 'faefaefaefaef', 'Pemeriksaan Kesehatan Balita', '', 'Terkonfirmasi', '2025-11-12 03:09:40', '2025-11-12 03:09:42'),
(16, '2025-11-26', 'Posyandu RW 02', '03:09:00', '05:09:00', 'faefaefaefaef', 'Imunisasi, Timbang & Ukur', '', 'Terkonfirmasi', '2025-11-12 03:09:57', '2025-11-12 03:10:11'),
(17, '2025-11-30', 'Posyandu RW 03', '04:10:00', '08:10:00', 'faefaefaefaef', 'Timbang & Ukur, Konsultasi Gizi', '', 'Terkonfirmasi', '2025-11-12 03:10:08', '2025-11-12 03:10:13');

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