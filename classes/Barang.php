<?php
require_once __DIR__ . '/../config/database.php';

class Barang {
    private $conn;
    private $user_id;
    private $user_role;
    
    public function __construct($conn, $user_id, $user_role) {
        $this->conn = $conn;
        $this->user_id = $user_id;
        $this->user_role = $user_role;
    }
    
    /**
     * Get All Barang
     */
    public function getAll($search = '', $kategori = '') {
        $query = "SELECT b.*, u.nama_lengkap as created_by_name 
                  FROM barang b 
                  LEFT JOIN users u ON b.created_by = u.id 
                  WHERE 1=1";
        
        $params = [];
        $types = '';
        
        // Filter untuk Input user (hanya data mereka sendiri)
        if ($this->user_role === 'input') {
            $query .= " AND b.created_by = ?";
            $params[] = $this->user_id;
            $types .= 'i';
        }
        
        // Search
        if (!empty($search)) {
            $query .= " AND (b.kode LIKE ? OR b.nama LIKE ?)";
            $search_param = '%' . $search . '%';
            $params[] = $search_param;
            $params[] = $search_param;
            $types .= 'ss';
        }
        
        // Filter kategori
        if (!empty($kategori)) {
            $query .= " AND b.kategori = ?";
            $params[] = $kategori;
            $types .= 's';
        }
        
        $query .= " ORDER BY b.created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $barang_list = [];
        while ($row = $result->fetch_assoc()) {
            $barang_list[] = $row;
        }
        
        return $barang_list;
    }
    
    /**
     * Get Barang By ID
     */
    public function getById($id) {
        $query = "SELECT b.*, u.nama_lengkap as created_by_name 
                  FROM barang b 
                  LEFT JOIN users u ON b.created_by = u.id 
                  WHERE b.id = ?";
        
        // Untuk Input user, hanya bisa akses data mereka sendiri
        if ($this->user_role === 'input') {
            $query .= " AND b.created_by = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('ii', $id, $this->user_id);
        } else {
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('i', $id);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            return $result->fetch_assoc();
        }
        
        return null;
    }
    
    /**
     * Create Barang
     */
    public function create($kode, $nama, $satuan, $harga, $stok, $kategori, $deskripsi) {
        // Validasi
        if (empty($kode) || empty($nama) || empty($satuan) || empty($harga)) {
            return ['success' => false, 'message' => 'Kode, nama, satuan, dan harga harus diisi'];
        }
        
        // Check if kode already exists
        $query = "SELECT id FROM barang WHERE kode = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('s', $kode);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            return ['success' => false, 'message' => 'Kode barang sudah ada'];
        }
        
        // Insert barang
        $query = "INSERT INTO barang (kode, nama, satuan, harga, stok, kategori, deskripsi, created_by) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('sssdissi', $kode, $nama, $satuan, $harga, $stok, $kategori, $deskripsi, $this->user_id);
        
        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'Barang berhasil ditambahkan', 'id' => $this->conn->insert_id];
        } else {
            return ['success' => false, 'message' => 'Terjadi kesalahan: ' . $this->conn->error];
        }
    }
    
    /**
     * Update Barang
     */
    public function update($id, $nama, $satuan, $harga, $stok, $kategori, $deskripsi) {
        // Get barang untuk verify ownership
        $barang = $this->getById($id);
        
        if (!$barang) {
            return ['success' => false, 'message' => 'Barang tidak ditemukan atau akses ditolak'];
        }
        
        // Admin bisa update semua, Input hanya data mereka sendiri
        if ($this->user_role === 'input' && $barang['created_by'] != $this->user_id) {
            return ['success' => false, 'message' => 'Anda hanya bisa update data milik sendiri'];
        }
        
        $query = "UPDATE barang 
                  SET nama = ?, satuan = ?, harga = ?, stok = ?, kategori = ?, deskripsi = ?, updated_by = ?
                  WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('ssdissi', $nama, $satuan, $harga, $stok, $kategori, $deskripsi, $this->user_id, $id);
        
        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'Barang berhasil diupdate'];
        } else {
            return ['success' => false, 'message' => 'Terjadi kesalahan: ' . $this->conn->error];
        }
    }
    
    /**
     * Delete Barang
     */
    public function delete($id) {
        // Get barang untuk verify ownership
        $barang = $this->getById($id);
        
        if (!$barang) {
            return ['success' => false, 'message' => 'Barang tidak ditemukan atau akses ditolak'];
        }
        
        // Admin bisa delete semua, Input tidak bisa delete
        if ($this->user_role === 'input') {
            return ['success' => false, 'message' => 'Input user tidak bisa menghapus barang'];
        }
        
        $query = "DELETE FROM barang WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('i', $id);
        
        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'Barang berhasil dihapus'];
        } else {
            return ['success' => false, 'message' => 'Terjadi kesalahan: ' . $this->conn->error];
        }
    }
    
    /**
     * Get Kategori Unique
     */
    public function getCategories() {
        $query = "SELECT DISTINCT kategori FROM barang WHERE kategori IS NOT NULL AND kategori != '' ORDER BY kategori";
        $result = $this->conn->query($query);
        
        $categories = [];
        while ($row = $result->fetch_assoc()) {
            $categories[] = $row['kategori'];
        }
        
        return $categories;
    }
}
?>
