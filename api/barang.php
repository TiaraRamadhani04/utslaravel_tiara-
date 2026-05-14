<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../classes/Auth.php';
require_once __DIR__ . '/../classes/Barang.php';

$method = $_SERVER['REQUEST_METHOD'];
$response = [];

// Verify token
$token = Auth::getTokenFromHeader();
$verify = Auth::verifyToken($token);

if (!$verify['valid']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized: ' . $verify['message']]);
    exit();
}

$user = $verify['data'];
$barang = new Barang($conn, $user['id'], $user['role']);

try {
    // GET all barang atau search
    if ($method === 'GET') {
        // GET by ID
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $item = $barang->getById($id);
            
            if ($item) {
                http_response_code(200);
                $response = ['success' => true, 'data' => $item];
            } else {
                http_response_code(404);
                $response = ['success' => false, 'message' => 'Barang tidak ditemukan'];
            }
        }
        // GET all dengan search dan filter
        else {
            $search = isset($_GET['search']) ? $_GET['search'] : '';
            $kategori = isset($_GET['kategori']) ? $_GET['kategori'] : '';
            
            $barang_list = $barang->getAll($search, $kategori);
            
            http_response_code(200);
            $response = [
                'success' => true,
                'data' => $barang_list,
                'user' => $user
            ];
        }
    }
    // POST create barang
    else if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            $response = ['success' => false, 'message' => 'Request body tidak valid'];
        } else {
            $result = $barang->create(
                $data['kode'] ?? '',
                $data['nama'] ?? '',
                $data['satuan'] ?? '',
                $data['harga'] ?? 0,
                $data['stok'] ?? 0,
                $data['kategori'] ?? '',
                $data['deskripsi'] ?? ''
            );
            
            if ($result['success']) {
                http_response_code(201);
            } else {
                http_response_code(400);
            }
            $response = $result;
        }
    }
    // PUT update barang
    else if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = intval($data['id'] ?? 0);
        
        if ($id == 0) {
            http_response_code(400);
            $response = ['success' => false, 'message' => 'ID barang harus diisi'];
        } else {
            $result = $barang->update(
                $id,
                $data['nama'] ?? '',
                $data['satuan'] ?? '',
                $data['harga'] ?? 0,
                $data['stok'] ?? 0,
                $data['kategori'] ?? '',
                $data['deskripsi'] ?? ''
            );
            
            if ($result['success']) {
                http_response_code(200);
            } else {
                http_response_code(400);
            }
            $response = $result;
        }
    }
    // DELETE barang
    else if ($method === 'DELETE') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = intval($data['id'] ?? 0);
        
        if ($id == 0) {
            http_response_code(400);
            $response = ['success' => false, 'message' => 'ID barang harus diisi'];
        } else {
            $result = $barang->delete($id);
            
            if ($result['success']) {
                http_response_code(200);
            } else {
                http_response_code(400);
            }
            $response = $result;
        }
    }
    else {
        http_response_code(405);
        $response = ['success' => false, 'message' => 'Method tidak diizinkan'];
    }
} catch (Exception $e) {
    http_response_code(500);
    $response = ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
}

echo json_encode($response);
?>
