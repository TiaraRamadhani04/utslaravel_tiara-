-- Gunakan Database yang sudah ada
USE `tiara-database`;

-- Tabel Users (Admin & Input User)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'input') NOT NULL DEFAULT 'input',
    nama_lengkap VARCHAR(100),
    status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Tabel Barang/Item (dengan field: kode, nama, satuan, harga, stok, kategori, deskripsi)
CREATE TABLE IF NOT EXISTS barang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    satuan VARCHAR(20) NOT NULL,
    harga DECIMAL(12, 2) NOT NULL,
    stok INT NOT NULL DEFAULT 0,
    kategori VARCHAR(50),
    deskripsi TEXT,
    created_by INT NOT NULL,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    INDEX idx_kode (kode),
    INDEX idx_kategori (kategori),
    INDEX idx_created_by (created_by)
);

-- Insert Admin Default (password: admin123 - hashed dengan password_hash)
INSERT INTO users (email, username, password, role, nama_lengkap, status) 
VALUES ('admin@app.com', 'admin', '$2y$10$OMldBQb3wgiPNj7ZU2ni/eggKcLDVzgwGHMzKn4Y0wpw2k85N5zeS', 'admin', 'Administrator', 'aktif')
ON DUPLICATE KEY UPDATE username=username;

-- Catatan: Password 'admin123' sudah di-hash menggunakan password_hash()
-- Untuk membuat hash baru, gunakan PHP: password_hash('admin123', PASSWORD_BCRYPT)
