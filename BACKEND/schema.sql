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
-- CREATE TABLE: RIWAYAT ANTROPOMETRI
-- =======================================================
-- Tabel ini menyimpan semua data riwayat pengukuran untuk setiap anak
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
  
  -- Membuat relasi ke tabel 'accounts'
  -- Jika akun anak dihapus, semua riwayatnya juga terhapus
  FOREIGN KEY (account_id) REFERENCES accounts(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =======================================================
-- SAMPLE DATA (untuk riwayat)
-- =======================================================
-- (Asumsikan 'Ahmad Rizki' memiliki ID=1 dan 'Siti Aisyah' ID=2)
INSERT INTO riwayat_antropometri (account_id, tanggal_periksa, umur_bulan_saat_periksa, berat_badan_kg, tinggi_badan_cm, status_gizi)
VALUES
(1, '2025-09-10', 22, 12.0, 85.0, 'Normal'),
(1, '2025-10-11', 23, 12.2, 86.0, 'Normal'),
(1, '2025-11-07', 24, 12.5, 87.0, 'Normal'),
(2, '2025-09-15', 16, 7.8, 74.0, 'Risiko Stunting'),
(2, '2025-10-15', 17, 8.0, 75.0, 'Stunting'),
(2, '2025-11-07', 18, 8.2, 75.5, 'Stunting');

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