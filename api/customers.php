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
require_once __DIR__ . '/../classes/Customer.php';

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
$customer = new Customer($conn, $user['id'], $user['role']);

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $item = $customer->getById($id);
            if ($item) {
                http_response_code(200);
                $response = ['success' => true, 'data' => $item];
            } else {
                http_response_code(404);
                $response = ['success' => false, 'message' => 'Customer tidak ditemukan'];
            }
        } else {
            $search = isset($_GET['search']) ? $_GET['search'] : '';
            $list = $customer->getAll($search);
            http_response_code(200);
            $response = ['success' => true, 'data' => $list, 'user' => $user];
        }
    }
    else if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            $response = ['success' => false, 'message' => 'Request body tidak valid'];
        } else {
            $result = $customer->create(
                $data['kode'] ?? '',
                $data['nama'] ?? '',
                $data['alamat'] ?? '',
                $data['telepon'] ?? '',
                $data['email'] ?? ''
            );

            if ($result['success']) http_response_code(201); else http_response_code(400);
            $response = $result;
        }
    }
    else if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = intval($data['id'] ?? 0);
        if ($id == 0) {
            http_response_code(400);
            $response = ['success' => false, 'message' => 'ID customer harus diisi'];
        } else {
            $result = $customer->update(
                $id,
                $data['nama'] ?? '',
                $data['alamat'] ?? '',
                $data['telepon'] ?? '',
                $data['email'] ?? ''
            );

            if ($result['success']) http_response_code(200); else http_response_code(400);
            $response = $result;
        }
    }
    else if ($method === 'DELETE') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = intval($data['id'] ?? 0);
        if ($id == 0) {
            http_response_code(400);
            $response = ['success' => false, 'message' => 'ID customer harus diisi'];
        } else {
            $result = $customer->delete($id);
            if ($result['success']) http_response_code(200); else http_response_code(400);
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
