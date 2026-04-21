-- ISP Customer Management System Database
-- Database untuk mengelola pelanggan layanan WiFi

-- Buat Database
CREATE DATABASE IF NOT EXISTS isp_management;
USE isp_management;

-- ===== TABEL PELANGGAN =====
CREATE TABLE IF NOT EXISTS pelanggan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_pelanggan VARCHAR(100) NOT NULL,
  no_telepon VARCHAR(15) NOT NULL UNIQUE,
  email VARCHAR(100),
  alamat TEXT NOT NULL,
  status ENUM('aktif', 'nonaktif', 'suspend') DEFAULT 'aktif',
  paket_layanan VARCHAR(50),
  harga_bulanan DECIMAL(10, 2),
  tanggal_langganan DATE NOT NULL,
  tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tanggal_diperbarui TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== TABEL LOKASI =====
CREATE TABLE IF NOT EXISTS lokasi (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pelanggan_id INT NOT NULL UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  keterangan_lokasi VARCHAR(255),
  tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== TABEL PERANGKAT =====
CREATE TABLE IF NOT EXISTS perangkat (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pelanggan_id INT NOT NULL,
  nama_perangkat VARCHAR(100) NOT NULL,
  tipe_perangkat ENUM('router', 'modem', 'mikrotik', 'other') DEFAULT 'router',
  ip_address VARCHAR(50),
  mac_address VARCHAR(50),
  serial_number VARCHAR(100),
  status_perangkat ENUM('aktif', 'mati', 'error') DEFAULT 'aktif',
  tanggal_instalasi DATE,
  tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tanggal_diperbarui TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== TABEL TAGIHAN =====
CREATE TABLE IF NOT EXISTS tagihan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pelanggan_id INT NOT NULL,
  bulan_tagihan DATE NOT NULL,
  jumlah_tagihan DECIMAL(10, 2) NOT NULL,
  status_pembayaran ENUM('lunas', 'belum_lunas', 'cicilan') DEFAULT 'belum_lunas',
  tanggal_pembayaran DATE,
  metode_pembayaran VARCHAR(50),
  catatan TEXT,
  tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tanggal_diperbarui TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== TABEL ADMIN =====
CREATE TABLE IF NOT EXISTS admin (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nama_lengkap VARCHAR(100),
  status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
  role ENUM('super_admin', 'admin', 'operator') DEFAULT 'operator',
  tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tanggal_login_terakhir TIMESTAMP NULL,
  tanggal_diperbarui TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== INDEXES =====
CREATE INDEX idx_pelanggan_status ON pelanggan(status);
CREATE INDEX idx_pelanggan_no_telepon ON pelanggan(no_telepon);
CREATE INDEX idx_perangkat_pelanggan ON perangkat(pelanggan_id);
CREATE INDEX idx_tagihan_pelanggan ON tagihan(pelanggan_id);
CREATE INDEX idx_tagihan_status ON tagihan(status_pembayaran);
CREATE INDEX idx_tagihan_bulan ON tagihan(bulan_tagihan);

-- ===== SAMPLE DATA =====
INSERT INTO pelanggan (nama_pelanggan, no_telepon, email, alamat, status, paket_layanan, harga_bulanan, tanggal_langganan) VALUES
('nino', '088975412004', 'nino@gmail.com', 'Jl. Raya Utama No. 1', 'aktif', '50 Mbps', 500000, '2024-01-15'),
('Anto Hermawan', '082116069271', 'anto@gmail.com', 'Jl. Merdeka No. 5', 'aktif', '100 Mbps', 900000, '2024-02-01'),
('danish', '089531735928', 'danish@gmail.com', 'Jl. Sudirman No. 10', 'aktif', '100 Mbps', 1000000, '2024-01-20'),
('Riya', '082116069270', 'riya@gmail.com', 'Jl. Ahmad Yani No. 7', 'aktif', '100 Mbps', 900000, '2024-03-01'),
('Raka', '086458689548', 'raka@gmail.com', 'Gang Melati III, RT.1/RW.11', 'aktif', '30 Mbps', 300000, '2024-01-10'),
('Budi Santoso', '081234567890', 'budi@gmail.com', 'Jl. Gatot Subroto No. 12', 'aktif', '50 Mbps', 500000, '2024-02-15');

INSERT INTO lokasi (pelanggan_id, latitude, longitude, keterangan_lokasi) VALUES
(1, -6.400000, 106.816666, 'Rumah Nino'),
(2, -6.410000, 106.820000, 'Rumah Anto'),
(3, -6.390000, 106.810000, 'Rumah Danish'),
(4, -6.405000, 106.815000, 'Rumah Riya'),
(5, -6.415000, 106.825000, 'Rumah Raka'),
(6, -6.395000, 106.805000, 'Rumah Budi');

INSERT INTO perangkat (pelanggan_id, nama_perangkat, tipe_perangkat, ip_address, mac_address, status_perangkat, tanggal_instalasi) VALUES
(1, 'TP-Link Archer C6', 'router', '192.168.1.1', '00:11:22:33:44:55', 'aktif', '2024-01-15'),
(2, 'Mikrotik RB750Gr3', 'mikrotik', '192.168.1.1', '00:11:22:33:44:66', 'aktif', '2024-02-01'),
(3, 'Ubiquiti UniFi', 'router', '192.168.1.1', '00:11:22:33:44:77', 'aktif', '2024-01-20'),
(4, 'ASUS RT-AX88U', 'router', '192.168.1.1', '00:11:22:33:44:88', 'aktif', '2024-03-01'),
(5, 'TP-Link TL-WR840N', 'router', '192.168.1.1', '00:11:22:33:44:99', 'aktif', '2024-01-10'),
(6, 'Cisco Linksys EA7500', 'router', '192.168.1.1', '00:11:22:33:44:AA', 'aktif', '2024-02-15');

INSERT INTO tagihan (pelanggan_id, bulan_tagihan, jumlah_tagihan, status_pembayaran, tanggal_pembayaran, metode_pembayaran) VALUES
(1, '2026-04-01', 500000, 'belum_lunas', NULL, NULL),
(2, '2026-04-01', 900000, 'lunas', '2026-04-05', 'transfer'),
(3, '2026-04-01', 1000000, 'belum_lunas', NULL, NULL),
(4, '2026-04-01', 900000, 'lunas', '2026-04-03', 'cash'),
(5, '2026-04-01', 300000, 'belum_lunas', NULL, NULL),
(6, '2026-04-01', 500000, 'cicilan', '2026-04-10', 'transfer');

INSERT INTO admin (username, email, password, nama_lengkap, status, role) VALUES
('admin', 'admin@isp.local', 'admin123', 'Administrator', 'aktif', 'super_admin'),
('operator', 'operator@isp.local', 'operator123', 'Operator', 'aktif', 'operator');
