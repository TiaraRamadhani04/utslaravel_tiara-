<?php
require_once __DIR__ . '/../config/database.php';

class Customer {
    private $conn;
    private $user_id;
    private $user_role;

    public function __construct($conn, $user_id, $user_role) {
        $this->conn = $conn;
        $this->user_id = $user_id;
        $this->user_role = $user_role;
    }

    public function getAll($search = '') {
        $query = "SELECT c.* , u.nama_lengkap as created_by_name FROM customers c LEFT JOIN users u ON c.created_by = u.id WHERE 1=1";
        $params = [];
        $types = '';

        if ($this->user_role === 'input') {
            $query .= " AND c.created_by = ?";
            $params[] = $this->user_id;
            $types .= 'i';
        }

        if (!empty($search)) {
            $query .= " AND (c.kode LIKE ? OR c.nama LIKE ? OR c.email LIKE ? OR c.telepon LIKE ?)";
            $s = '%'.$search.'%';
            $params[] = $s; $params[] = $s; $params[] = $s; $params[] = $s;
            $types .= 'ssss';
        }

        $query .= " ORDER BY c.created_at DESC";

        $stmt = $this->conn->prepare($query);
        if (!empty($params)) $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();

        $list = [];
        while ($row = $result->fetch_assoc()) {
            $list[] = $row;
        }

        return $list;
    }

    public function getById($id) {
        $query = "SELECT * FROM customers WHERE id = ?";

        if ($this->user_role === 'input') {
            $query .= " AND created_by = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('ii', $id, $this->user_id);
        } else {
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('i', $id);
        }

        $stmt->execute();
        $res = $stmt->get_result();
        if ($res->num_rows > 0) return $res->fetch_assoc();
        return null;
    }

    public function create($kode, $nama, $alamat, $telepon, $email) {
        if (empty($kode) || empty($nama)) {
            return ['success' => false, 'message' => 'Kode dan nama harus diisi'];
        }

        // check kode unique
        $q = "SELECT id FROM customers WHERE kode = ?";
        $s = $this->conn->prepare($q);
        $s->bind_param('s', $kode);
        $s->execute();
        if ($s->get_result()->num_rows > 0) {
            return ['success' => false, 'message' => 'Kode customer sudah ada'];
        }

        $query = "INSERT INTO customers (kode, nama, alamat, telepon, email, created_by) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('sssssi', $kode, $nama, $alamat, $telepon, $email, $this->user_id);

        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'Customer berhasil ditambahkan', 'id' => $this->conn->insert_id];
        } else {
            return ['success' => false, 'message' => 'Terjadi kesalahan: ' . $this->conn->error];
        }
    }

    public function update($id, $nama, $alamat, $telepon, $email) {
        $cust = $this->getById($id);
        if (!$cust) return ['success' => false, 'message' => 'Customer tidak ditemukan atau akses ditolak'];

        if ($this->user_role === 'input' && $cust['created_by'] != $this->user_id) {
            return ['success' => false, 'message' => 'Anda hanya bisa mengubah data milik sendiri'];
        }

        $query = "UPDATE customers SET nama = ?, alamat = ?, telepon = ?, email = ?, updated_by = ? WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('sssiii', $nama, $alamat, $telepon, $email, $this->user_id, $id);

        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'Customer berhasil diupdate'];
        } else {
            return ['success' => false, 'message' => 'Terjadi kesalahan: ' . $this->conn->error];
        }
    }

    public function delete($id) {
        $cust = $this->getById($id);
        if (!$cust) return ['success' => false, 'message' => 'Customer tidak ditemukan atau akses ditolak'];

        if ($this->user_role === 'input') {
            return ['success' => false, 'message' => 'Input user tidak dapat menghapus customer'];
        }

        $query = "DELETE FROM customers WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('i', $id);

        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'Customer berhasil dihapus'];
        } else {
            return ['success' => false, 'message' => 'Terjadi kesalahan: ' . $this->conn->error];
        }
    }
}
?>
