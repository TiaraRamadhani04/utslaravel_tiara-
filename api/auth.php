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

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

$auth = new Auth($conn);
$response = [];

try {
    if ($action === 'login' && $method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            $response = ['success' => false, 'message' => 'Email dan password harus diisi'];
        } else {
            $result = $auth->login($data['email'], $data['password']);
            if ($result['success']) {
                http_response_code(200);
            } else {
                http_response_code(401);
            }
            $response = $result;
        }
    } 
    else if ($action === 'register' && $method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['email']) || !isset($data['username']) || !isset($data['password'])) {
            http_response_code(400);
            $response = ['success' => false, 'message' => 'Email, username, dan password harus diisi'];
        } else {
            $nama_lengkap = isset($data['nama_lengkap']) ? $data['nama_lengkap'] : '';
            $result = $auth->register($data['email'], $data['username'], $data['password'], $nama_lengkap);
            
            if ($result['success']) {
                http_response_code(201);
            } else {
                http_response_code(400);
            }
            $response = $result;
        }
    }
    else if ($action === 'verify') {
        $token = Auth::getTokenFromHeader();
        $result = Auth::verifyToken($token);
        
        if ($result['valid']) {
            http_response_code(200);
            $response = ['success' => true, 'data' => $result['data']];
        } else {
            http_response_code(401);
            $response = ['success' => false, 'message' => $result['message']];
        }
    }
    else {
        http_response_code(404);
        $response = ['success' => false, 'message' => 'Endpoint tidak ditemukan'];
    }
} catch (Exception $e) {
    http_response_code(500);
    $response = ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
}

echo json_encode($response);
?>
