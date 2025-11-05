<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';
if (!isset($pdo)) {
  error_log('[login.php] $pdo no está definido por db.php');
  http_response_code(500);
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'message' => 'Error de configuración de base de datos.']);
  exit;
}
try {
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Throwable $e) {
  error_log('[login.php] Error al configurar PDO: ' . $e->getMessage());
}

session_start();
header('Content-Type: application/json');


function sha256_hex_upper(string $plain): string {
  return strtoupper(bin2hex(hash('sha256', $plain, true)));
}

$op     = $_GET['op'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

try {
  
  if ($method === 'GET' && $op === 'me') {
    $u = $_SESSION['user'] ?? null;
    echo json_encode([
      'authenticated'   => !empty($u['id_usuario']),
      'id_usuario'      => $u['id_usuario']   ?? null,
      'username'        => $u['username']     ?? null,
      'rol'             => $u['rol']          ?? null,
      'id_empleado'     => $u['id_empleado']  ?? null,
      'empleado_nombre' => $u['empleado_nombre'] ?? null,
      'login_utc'       => $u['login_utc']    ?? null,
    ]);
    exit;
  }


  if ($method === 'POST' && $op === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
      $p = session_get_cookie_params();
      setcookie(session_name(), '', time()-42000, $p['path'],$p['domain'],$p['secure'],$p['httponly']);
    }
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Sesión cerrada.']);
    exit;
  }

  
  if ($method === 'POST' && $op === '') {
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
      error_log('[login.php] Body no-JSON: ' . substr($raw ?? '', 0, 200));
      http_response_code(400);
      echo json_encode(['success' => false, 'message' => 'Solicitud inválida.']);
      exit;
    }

    $username = trim((string)($data['username'] ?? ''));
    $password = trim((string)($data['password'] ?? ''));

    if ($username === '' || $password === '') {
      echo json_encode(['success' => false, 'message' => 'Debe ingresar usuario y contraseña.']);
      exit;
    }


    $sql = "
      SELECT TOP 1
        u.id_usuario,
        u.username,
        u.password_hash,
        u.activo,
        u.id_rol,
        r.nombre AS rol,
        u.id_empleado,
        e.nombre_completo AS emp_nombre_completo
      FROM usuarios u
      LEFT JOIN roles r      ON r.id_rol = u.id_rol
      LEFT JOIN empleados e  ON e.id_empleado = u.id_empleado
      WHERE u.username = :username
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
      echo json_encode(['success' => false, 'message' => 'Usuario no encontrado.']);
      exit;
    }

    if ((int)($user['activo'] ?? 0) !== 1) {
      echo json_encode(['success' => false, 'message' => 'Usuario inactivo.']);
      exit;
    }


    $ok = false;
    $stored = (string)($user['password_hash'] ?? '');
    if ($stored !== '') {
      $info = password_get_info($stored);
      if (($info['algo'] ?? 0) !== 0) {
        $ok = password_verify($password, $stored); // bcrypt
      }
      if (!$ok && $stored === sha256_hex_upper($password)) {
        $ok = true; // sha256 hex
      }
    }

    if (!$ok) {
      echo json_encode(['success' => false, 'message' => 'Credenciales inválidas.']);
      exit;
    }

  
    session_regenerate_id(true);
    $_SESSION['user'] = [
      'id_usuario'      => (int)$user['id_usuario'],
      'username'        => $user['username'],
      'id_rol'          => isset($user['id_rol']) ? (int)$user['id_rol'] : null,
      'rol'             => $user['rol'] ?? null,
      'id_empleado'     => isset($user['id_empleado']) ? (int)$user['id_empleado'] : null,
     
      'empleado_nombre' => trim((string)($user['emp_nombre_completo'] ?? '')),
      'login_utc'       => gmdate('Y-m-d\TH:i:s\Z'),
    ];

    echo json_encode(['success' => true, 'rol' => $_SESSION['user']['rol'] ?? null]);
    exit;
  }

  http_response_code(405);
  echo json_encode(['success' => false, 'message' => 'Operación no soportada.']);
} catch (Throwable $e) {
  error_log('[login.php] EXCEPTION: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Error del servidor.']);
}
