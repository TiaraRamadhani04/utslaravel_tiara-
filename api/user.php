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
$path = isset($_GET['path']) ? trim($_GET['path'], '/') : '';
$parts = explode('/', $path);
$action = isset($parts[0]) ? $parts[0] : '';
$user_id = isset($parts[1]) ? (int)$parts[1] : null;

$auth = new Auth($conn);
$response = [];

try {
    // Verify token
    $token = Auth::getTokenFromHeader();
    $result = Auth::verifyToken($token);
    
    if (!$result['valid']) {
        http_response_code(401);
        $response = ['success' => false, 'message' => $result['message']];
        echo json_encode($response);
        exit();
    }

    $current_user = $result['data'];

    // Check if user is admin
    if ($current_user['role'] !== 'admin') {
        http_response_code(403);
        $response = ['success' => false, 'message' => 'Anda tidak memiliki akses ke fitur ini'];
        echo json_encode($response);
        exit();
    }

    // GET /api/user.php?path=users
    if ($action === 'users' && $method === 'GET') {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

        $users = $auth->getAllUsers($limit, $offset);
        $total = $auth->countUsers();

        http_response_code(200);
        $response = [
            'success' => true,
            'data' => $users,
            'total' => $total
        ];
    }
    // GET /api/user.php?path=users/123
    else if ($action === 'users' && $user_id && $method === 'GET') {
        $user = $auth->getUserById($user_id);
        
        if (!$user) {
            http_response_code(404);
            $response = ['success' => false, 'message' => 'User tidak ditemukan'];
        } else {
            http_response_code(200);
            $response = ['success' => true, 'data' => $user];
        }
    }
    // POST /api/user.php?path=users (create user)
    else if ($action === 'users' && $method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['email']) || !isset($data['username']) || !isset($data['password'])) {
            http_response_code(400);
            $response = ['success' => false, 'message' => 'Email, username, dan password harus diisi'];
        } else {
            $nama_lengkap = isset($data['nama_lengkap']) ? $data['nama_lengkap'] : '';
            $role = isset($data['role']) ? $data['role'] : 'input';
            $status = isset($data['status']) ? $data['status'] : 'aktif';

            $result = $auth->createUser(
                $data['email'],
                $data['username'],
                $data['password'],
                $nama_lengkap,
                $role,
                $status
            );

            if ($result['success']) {
                http_response_code(201);
            } else {
                http_response_code(400);
            }
            $response = $result;
        }
    }
    // PUT /api/user.php?path=users/123 (update user)
    else if ($action === 'users' && $user_id && $method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            $response = ['success' => false, 'message' => 'Data tidak valid'];
        } else {
            $email = isset($data['email']) ? $data['email'] : null;
            $username = isset($data['username']) ? $data['username'] : null;
            $password = isset($data['password']) ? $data['password'] : null;
            $nama_lengkap = isset($data['nama_lengkap']) ? $data['nama_lengkap'] : null;
            $role = isset($data['role']) ? $data['role'] : null;
            $status = isset($data['status']) ? $data['status'] : null;

            $result = $auth->updateUser(
                $user_id,
                $email,
                $username,
                $password,
                $nama_lengkap,
                $role,
                $status
            );

            if ($result['success']) {
                http_response_code(200);
            } else {
                http_response_code(400);
            }
            $response = $result;
        }
    }
    // DELETE /api/user.php?path=users/123 (delete user)
    else if ($action === 'users' && $user_id && $method === 'DELETE') {
        $result = $auth->deleteUser($user_id);

        if ($result['success']) {
            http_response_code(200);
        } else {
            http_response_code(400);
        }
        $response = $result;
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
