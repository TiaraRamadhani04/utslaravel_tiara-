<?php
/**
 * Database Setup Script
 * Jalankan file ini sekali untuk membuat tabel di database riska-database yang sudah ada
 */

// Database config
$servername = "localhost";
$username = "root";
$password = "";
$database = "tiara-database";

// Connect to MySQL without database selection
$conn = new mysqli($servername, $username, $password);

if ($conn->connect_error) {
    die("❌ Koneksi gagal: " . $conn->connect_error);
}

echo "✅ Terhubung ke MySQL\n\n";

// Check if database exists
$result = $conn->query("SHOW DATABASES LIKE '$database'");
if ($result->num_rows == 0) {
    die("❌ Database '$database' tidak ditemukan. Pastikan database sudah dibuat di phpMyAdmin.\n");
}

// Select database
$conn->select_db($database);
echo "✅ Menggunakan database '$database'\n\n";

// Create users table
$sql = "CREATE TABLE IF NOT EXISTS users (
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
)";

if ($conn->query($sql) === TRUE) {
    echo "✅ Tabel 'users' siap\n";
} else {
    die("❌ Error membuat tabel users: " . $conn->error);
}

// Create barang table
$sql = "CREATE TABLE IF NOT EXISTS barang (
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
)";

if ($conn->query($sql) === TRUE) {
    echo "✅ Tabel 'barang' siap\n\n";
} else {
    die("❌ Error membuat tabel barang: " . $conn->error);
}

// Hash password admin
$admin_password = password_hash('admin123', PASSWORD_BCRYPT);

// Insert default admin user
$email = "admin@app.com";
$username = "admin";
$role = "admin";
$nama_lengkap = "Administrator";
$status = "aktif";

// Check if admin already exists
$check_sql = "SELECT id FROM users WHERE email = ?";
$stmt = $conn->prepare($check_sql);
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo "⚠️  Admin user (admin@app.com) sudah ada\n";
} else {
    // Insert admin
    $insert_sql = "INSERT INTO users (email, username, password, role, nama_lengkap, status) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($insert_sql);
    $stmt->bind_param('ssssss', $email, $username, $admin_password, $role, $nama_lengkap, $status);
    
    if ($stmt->execute()) {
        echo "✅ Admin user berhasil dibuat\n";
        echo "   Email: admin@app.com\n";
        echo "   Password: admin123\n";
    } else {
        echo "❌ Error membuat admin user: " . $conn->error . "\n";
    }
}

$conn->close();

echo "\n" . str_repeat("=", 50) . "\n";
echo "✅ SETUP SELESAI!\n";
echo "=". str_repeat("=", 50) . "\n";
echo "\nDatabase: tiara-database\n";
echo "Akses aplikasi:\n";
echo "🌐 http://localhost/latihan10/\n";
echo "\nLogin dengan:\n";
echo "📧 Email: admin@app.com\n";
echo "🔑 Password: admin123\n";
?>
