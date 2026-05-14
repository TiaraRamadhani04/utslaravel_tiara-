<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/JWTHandler.php';

class Auth {
    private $conn;
    
    public function __construct($conn) {
        $this->conn = $conn;
    }
    
    /**
     * Register User Baru
     */
    public function register($email, $username, $password, $nama_lengkap, $role = 'input') {
        // Validasi input
        if (empty($email) || empty($username) || empty($password)) {
            return ['success' => false, 'message' => 'Email, username, dan password harus diisi'];
        }
        
        // Check if email already exists
        $query = "SELECT id FROM users WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('s', $email);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            return ['success' => false, 'message' => 'Email sudah terdaftar'];
        }
        
        // Check if username already exists
        $query = "SELECT id FROM users WHERE username = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('s', $username);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            return ['success' => false, 'message' => 'Username sudah terdaftar'];
        }
        
        // Hash password
        $hashed_password = password_hash($password, PASSWORD_BCRYPT);
        
        // Insert user
        $query = "INSERT INTO users (email, username, password, nama_lengkap, role) VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('sssss', $email, $username, $hashed_password, $nama_lengkap, $role);
        
        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'Registrasi berhasil'];
        } else {
            return ['success' => false, 'message' => 'Terjadi kesalahan: ' . $this->conn->error];
        }
    }
    
    /**
     * Login User
     */
    public function login($email, $password) {
        // Validasi input
        if (empty($email) || empty($password)) {
            return ['success' => false, 'message' => 'Email dan password harus diisi'];
        }
        
        // Get user
        $query = "SELECT id, email, username, password, role, nama_lengkap, status FROM users WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows == 0) {
            return ['success' => false, 'message' => 'Email atau password salah'];
        }
        
        $user = $result->fetch_assoc();
        
        // Check status
        if ($user['status'] !== 'aktif') {
            return ['success' => false, 'message' => 'Akun Anda tidak aktif'];
        }
        
        // Verify password
        if (!password_verify($password, $user['password'])) {
            return ['success' => false, 'message' => 'Email atau password salah'];
        }
        
        // Generate JWT Token
        $token_data = [
            'id' => $user['id'],
            'email' => $user['email'],
            'username' => $user['username'],
            'role' => $user['role'],
            'nama_lengkap' => $user['nama_lengkap']
        ];
        
        $token = JWTHandler::encode($token_data);
        
        return [
            'success' => true,
            'message' => 'Login berhasil',
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'username' => $user['username'],
                'nama_lengkap' => $user['nama_lengkap'],
                'role' => $user['role']
            ]
        ];
    }
    
    /**
     * Verify Token
     */
    public static function verifyToken($token) {
        if (empty($token)) {
            return ['valid' => false, 'message' => 'Token tidak ditemukan'];
        }
        
        $decoded = JWTHandler::decode($token);
        
        if (!$decoded) {
            return ['valid' => false, 'message' => 'Token tidak valid atau sudah expired'];
        }
        
        return ['valid' => true, 'data' => $decoded];
    }
    
    /**
     * Get token dari header
     */
    public static function getTokenFromHeader() {
        $headers = getallheaders();
        
        if (isset($headers['Authorization'])) {
            $auth_header = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
                return $matches[1];
            }
        }
        
        return null;
    }

    /**
     * Get semua user (hanya untuk admin)
     */
    public function getAllUsers($limit = null, $offset = 0) {
        $query = "SELECT id, email, username, nama_lengkap, role, status, created_at, updated_at FROM users ORDER BY created_at DESC";
        
        if ($limit) {
            $query .= " LIMIT ? OFFSET ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('ii', $limit, $offset);
        } else {
            $stmt = $this->conn->prepare($query);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        
        return $users;
    }

    /**
     * Get user by ID (hanya untuk admin)
     */
    public function getUserById($user_id) {
        $query = "SELECT id, email, username, nama_lengkap, role, status, created_at, updated_at FROM users WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows == 0) {
            return null;
        }
        
        return $result->fetch_assoc();
    }

    /**
     * Tambah user baru (hanya untuk admin)
     */
    public function createUser($email, $username, $password, $nama_lengkap, $role = 'input', $status = 'aktif') {
        // Validasi input
        if (empty($email) || empty($username) || empty($password)) {
            return ['success' => false, 'message' => 'Email, username, dan password harus diisi'];
        }

        if (!in_array($role, ['admin', 'input'])) {
            return ['success' => false, 'message' => 'Role tidak valid'];
        }

        if (!in_array($status, ['aktif', 'nonaktif'])) {
            return ['success' => false, 'message' => 'Status tidak valid'];
        }
        
        // Check if email already exists
        $query = "SELECT id FROM users WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('s', $email);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            return ['success' => false, 'message' => 'Email sudah terdaftar'];
        }
        
        // Check if username already exists
        $query = "SELECT id FROM users WHERE username = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('s', $username);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            return ['success' => false, 'message' => 'Username sudah terdaftar'];
        }
        
        // Hash password
        $hashed_password = password_hash($password, PASSWORD_BCRYPT);
        
        // Insert user
        $query = "INSERT INTO users (email, username, password, nama_lengkap, role, status) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('ssssss', $email, $username, $hashed_password, $nama_lengkap, $role, $status);
        
        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'User berhasil ditambahkan', 'user_id' => $stmt->insert_id];
        } else {
            return ['success' => false, 'message' => 'Terjadi kesalahan: ' . $this->conn->error];
        }
    }

    /**
     * Update user (hanya untuk admin)
     */
    public function updateUser($user_id, $email = null, $username = null, $password = null, $nama_lengkap = null, $role = null, $status = null) {
        // Get user yang akan diupdate
        $query = "SELECT id, email, username FROM users WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows == 0) {
            return ['success' => false, 'message' => 'User tidak ditemukan'];
        }
        
        $user = $result->fetch_assoc();
        
        // Validasi email jika berubah
        if ($email && $email !== $user['email']) {
            $query = "SELECT id FROM users WHERE email = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('s', $email);
            $stmt->execute();
            if ($stmt->get_result()->num_rows > 0) {
                return ['success' => false, 'message' => 'Email sudah digunakan user lain'];
            }
        }
        
        // Validasi username jika berubah
        if ($username && $username !== $user['username']) {
            $query = "SELECT id FROM users WHERE username = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('s', $username);
            $stmt->execute();
            if ($stmt->get_result()->num_rows > 0) {
                return ['success' => false, 'message' => 'Username sudah digunakan user lain'];
            }
        }

        // Validasi role
        if ($role && !in_array($role, ['admin', 'input'])) {
            return ['success' => false, 'message' => 'Role tidak valid'];
        }

        // Validasi status
        if ($status && !in_array($status, ['aktif', 'nonaktif'])) {
            return ['success' => false, 'message' => 'Status tidak valid'];
        }

        // Update query builder
        $updates = [];
        $types = '';
        $params = [];

        if ($email) {
            $updates[] = "email = ?";
            $types .= 's';
            $params[] = $email;
        }
        if ($username) {
            $updates[] = "username = ?";
            $types .= 's';
            $params[] = $username;
        }
        if ($password) {
            $hashed_password = password_hash($password, PASSWORD_BCRYPT);
            $updates[] = "password = ?";
            $types .= 's';
            $params[] = $hashed_password;
        }
        if ($nama_lengkap) {
            $updates[] = "nama_lengkap = ?";
            $types .= 's';
            $params[] = $nama_lengkap;
        }
        if ($role) {
            $updates[] = "role = ?";
            $types .= 's';
            $params[] = $role;
        }
        if ($status) {
            $updates[] = "status = ?";
            $types .= 's';
            $params[] = $status;
        }

        if (empty($updates)) {
            return ['success' => false, 'message' => 'Tidak ada data yang diupdate'];
        }

        $updates[] = "updated_at = CURRENT_TIMESTAMP";
        $query = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
        
        $types .= 'i';
        $params[] = $user_id;

        $stmt = $this->conn->prepare($query);
        $stmt->bind_param($types, ...$params);
        
        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'User berhasil diupdate'];
        } else {
            return ['success' => false, 'message' => 'Terjadi kesalahan: ' . $this->conn->error];
        }
    }

    /**
     * Hapus user (hanya untuk admin)
     */
    public function deleteUser($user_id) {
        // Cek apakah user ada
        $query = "SELECT id FROM users WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        
        if ($stmt->get_result()->num_rows == 0) {
            return ['success' => false, 'message' => 'User tidak ditemukan'];
        }

        // Jangan bisa delete user admin (untuk safety)
        $query = "SELECT role FROM users WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if ($user['role'] === 'admin') {
            return ['success' => false, 'message' => 'Tidak bisa menghapus user dengan role admin'];
        }
        
        // Delete barang yang dibuat oleh user ini
        $query = "DELETE FROM barang WHERE created_by = ? OR updated_by = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('ii', $user_id, $user_id);
        $stmt->execute();
        
        // Delete user
        $query = "DELETE FROM users WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('i', $user_id);
        
        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'User berhasil dihapus'];
        } else {
            return ['success' => false, 'message' => 'Terjadi kesalahan: ' . $this->conn->error];
        }
    }

    /**
     * Count total users
     */
    public function countUsers() {
        $query = "SELECT COUNT(*) as total FROM users";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        return $row['total'];
    }
}
?>
