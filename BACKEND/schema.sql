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
DROP TABLE IF EXISTS riwayat_antropometri;
DROP TABLE IF EXISTS jadwals;
DROP TABLE IF EXISTS riwayats;
DROP TABLE IF EXISTS masyarakats;

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
-- CREATE TABLE: RIWAYATS
-- =======================================================
CREATE TABLE IF NOT EXISTS riwayats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  berat_badan INT NOT NULL,
  tinggi_badan INT NOT NULL,
  lingkar_kepala INT,
  lingkar_lengan INT,
  lingkar_badan INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =======================================================
-- CREATE TABLE: MASYARAKATS
-- =======================================================
CREATE TABLE IF NOT EXISTS masyarakats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nik BIGINT UNIQUE NOT NULL,
  nama_anak VARCHAR(255) NOT NULL,
  umur_bulan INT NOT NULL,
  jenis_kelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
  nama_orang_tua VARCHAR(255),
  alamat TEXT,
  no_hp VARCHAR(20),
  status VARCHAR(50) DEFAULT 'Aktif',
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
-- SAMPLE DATA FOR NEW TABLES
-- =======================================================
INSERT INTO jadwals (tanggal, lokasi, waktu_mulai, waktu_selesai, alamat_lengkap, layanan, keterangan_tambahan, status)
VALUES
('2025-10-10', 'Posyandu RW 01', '09:00:00', '12:00:00', 'Jl. Melati No. 1', 'Pemeriksaan Balita, Imunisasi, Timbang', 'Bawa KMS anak', 'Terkonfirmasi'),
('2025-10-20', 'Posyandu RW 02', '09:00:00', '12:00:00', 'Balai RW 02', 'Imunisasi, Vaksin DPT, Polio', 'Persiapkan kartu imunisasi', 'Menunggu Konfirmasi');

INSERT INTO riwayats (berat_badan, tinggi_badan, lingkar_kepala, lingkar_lengan, lingkar_badan)
VALUES
(12500, 850, 485, 140, 500),
(11800, 820, 475, 135, 490),
(13200, 880, 495, 145, 510);

INSERT INTO masyarakats (nik, nama_anak, umur_bulan, jenis_kelamin, nama_orang_tua, alamat, no_hp, status)
VALUES
(1234567890123456, 'Ahmad Rizki', 24, 'Laki-laki', 'Budi Santoso', 'Jl. Melati No. 1', '08123456789', 'Aktif'),
(1234567890123457, 'Siti Aisyah', 18, 'Perempuan', 'Ani Wulandari', 'Jl. Mawar No. 2', '08234567890', 'Aktif'),
(1234567890123458, 'Muhammad Fajar', 36, 'Laki-laki', 'Dedi Kurniawan', 'Jl. Dahlia No. 3', '08345678901', 'Aktif');

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
-- 6️⃣ New tables: jadwals, riwayats, masyarakats added with sample data.
