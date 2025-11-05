<?php
require 'db.php';
session_start();
header("Content-Type: application/json");
function is_logged_in(): bool {
  return !empty($_SESSION['user']['id_usuario']);
}
function current_user(): ?array {
  return $_SESSION['user'] ?? null;
}
function require_login(): void {
  if (!is_logged_in()) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "No autenticado."]);
    exit;
  }
}
function require_admin(): void {
  require_login();
  $u = current_user();
  if (($u['rol'] ?? '') !== 'Administrador') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Acceso denegado. Solo Administrador."]);
    exit;
  }
}
require_admin();

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
  case 'GET':
    try {

      $sql = "SELECT 
                e.id_empleado,
                e.nombre_completo AS empleado,
                e.puesto,
                u.username AS usuario,
                r.nombre AS rol,
                CASE WHEN u.activo = 1 THEN 'Activo' ELSE 'Inactivo' END AS estado
              FROM empleados e
              LEFT JOIN usuarios u ON e.id_empleado = u.id_empleado
              LEFT JOIN roles r ON u.id_rol = r.id_rol
              ORDER BY e.nombre_completo ASC";
      $stmt = $pdo->query($sql);
      echo json_encode(["success" => true, "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Exception $e) {
      http_response_code(500);
      echo json_encode(["success" => false, "message" => "Error al obtener los empleados.", "details" => $e->getMessage()]);
    }
    break;

  case 'POST':
    $data = json_decode(file_get_contents("php://input"), true);


    if (isset($data['accion']) && $data['accion'] === 'PUT_ROLE') {
      try {
        $id_empleado = $data['id_empleado'] ?? null;
        $nuevo_rol   = $data['nuevo_rol'] ?? null;

        if (!$id_empleado || !$nuevo_rol) {
          echo json_encode(["success" => false, "message" => "Datos incompletos."]);
          exit;
        }

        if (!is_numeric($nuevo_rol)) {
          $stmtRol = $pdo->prepare("SELECT id_rol FROM roles WHERE nombre = :nombre");
          $stmtRol->execute([':nombre' => $nuevo_rol]);
          $rol = $stmtRol->fetch(PDO::FETCH_ASSOC);
          if (!$rol) {
            echo json_encode(["success" => false, "message" => "Rol no encontrado."]);
            exit;
          }
          $idRol = (int)$rol['id_rol'];
        } else {
          $idRol = (int)$nuevo_rol;
        }

        $stmt = $pdo->prepare("UPDATE usuarios SET id_rol = :id_rol WHERE id_empleado = :id_empleado");
        $stmt->execute([':id_rol' => $idRol, ':id_empleado' => $id_empleado]);

        echo json_encode(["success" => true, "message" => "Rol actualizado correctamente."]);
        exit;
      } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al actualizar el rol.", "details" => $e->getMessage()]);
        exit;
      }
    }
    $id_empleado = $data['id_empleado'] ?? null;
    $username    = $data['usuario'] ?? null;
    $password    = $data['contrasena'] ?? null;
    $rol         = $data['rol'] ?? null;

    if (!$id_empleado || !$username || !$password || !$rol) {
      echo json_encode(["success" => false, "message" => "Por favor complete todos los campos."]);
      exit;
    }

    try {
      if (!is_numeric($rol)) {
        $rolQuery = $pdo->prepare("SELECT id_rol FROM roles WHERE nombre = ?");
        $rolQuery->execute([$rol]);
        $rolId = $rolQuery->fetchColumn();
        if (!$rolId) {
          echo json_encode(["success" => false, "message" => "El rol '$rol' no existe."]);
          exit;
        }
      } else {
        $rolId = (int)$rol;
      }
      $check = $pdo->prepare("SELECT COUNT(*) FROM usuarios WHERE username = ?");
      $check->execute([$username]);
      if ($check->fetchColumn() > 0) {
        echo json_encode(["success" => false, "message" => "El nombre de usuario ya está en uso."]);
        exit;
      }

      $check2 = $pdo->prepare("SELECT COUNT(*) FROM usuarios WHERE id_empleado = ?");
      $check2->execute([$id_empleado]);
      if ($check2->fetchColumn() > 0) {
        echo json_encode(["success" => false, "message" => "El empleado ya tiene credenciales asignadas."]);
        exit;
      }
      $sql = "INSERT INTO usuarios (id_empleado, id_rol, username, password_hash, contrasena_visible, activo)
              VALUES (:id_empleado, :id_rol, :username, :hash, :visible, 1)";
      $stmt = $pdo->prepare($sql);
      $stmt->execute([
        ':id_empleado' => $id_empleado,
        ':id_rol'      => $rolId,
        ':username'    => $username,
        ':hash'        => password_hash($password, PASSWORD_DEFAULT),
        ':visible'     => $password 
      ]);

      echo json_encode(["success" => true, "message" => "Credenciales asignadas correctamente."]);
    } catch (Exception $e) {
      http_response_code(500);
      echo json_encode(["success" => false, "message" => "Error al registrar usuario.", "details" => $e->getMessage()]);
    }
    break;

  case 'PUT':
    $data = json_decode(file_get_contents("php://input"), true);
    $id_empleado = $data['id_empleado'] ?? null;
    $username    = $data['usuario'] ?? null;
    $password    = $data['contrasena'] ?? null;

    if (!$id_empleado || !$username || !$password) {
      echo json_encode(["success" => false, "message" => "Datos incompletos."]);
      exit;
    }

    try {
      
      $dup = $pdo->prepare("SELECT COUNT(*) FROM usuarios WHERE username = ? AND id_empleado <> ?");
      $dup->execute([$username, $id_empleado]);
      if ($dup->fetchColumn() > 0) {
        echo json_encode(["success" => false, "message" => "El nombre de usuario ya está en uso por otro empleado."]);
        exit;
      }

      $stmt = $pdo->prepare("UPDATE usuarios 
                             SET username = ?, password_hash = ?, contrasena_visible = ? 
                             WHERE id_empleado = ?");
      $stmt->execute([$username, password_hash($password, PASSWORD_DEFAULT), $password, $id_empleado]);

      echo json_encode(["success" => true, "message" => "Credenciales actualizadas correctamente."]);
    } catch (Exception $e) {
      http_response_code(500);
      echo json_encode(["success" => false, "message" => "Error al actualizar credenciales.", "details" => $e->getMessage()]);
    }
    break;

  case 'PATCH':
    $data = json_decode(file_get_contents("php://input"), true);
    $id_empleado = $data['id_empleado'] ?? null;
    $activo      = $data['activo'] ?? null;

    if (!$id_empleado || $activo === null) {
      echo json_encode(["success" => false, "message" => "Datos insuficientes."]);
      exit;
    }

    try {
      $stmt = $pdo->prepare("UPDATE usuarios SET activo = ? WHERE id_empleado = ?");
      $stmt->execute([$activo, $id_empleado]);
      echo json_encode(["success" => true, "message" => "Estado actualizado correctamente."]);
    } catch (Exception $e) {
      http_response_code(500);
      echo json_encode(["success" => false, "message" => "Error al cambiar estado.", "details" => $e->getMessage()]);
    }
    break;

  default:
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido."]);
    break;
}
