<?php
// Konfigurasi Database MySQL
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'tiara-database');

// JWT Secret Key
define('JWT_SECRET', 'your_secret_key_change_this_2024_produksi');

// API Base URL
define('API_URL', 'http://localhost/latihan1/api/');

// Connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set charset to UTF-8
$conn->set_charset("utf8");
?>
