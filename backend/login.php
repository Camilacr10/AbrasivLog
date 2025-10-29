<?php
require 'db.php';
header('Content-Type: application/json');
 
$data = json_decode(file_get_contents("php://input"), true);
$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');
 
if ($username === '' || $password === '') {
    echo json_encode(["success" => false, "message" => "Debe ingresar usuario y contraseña."]);
    exit;
}
 
try {
    $sql = "
        SELECT
            u.id_usuario,
            u.username,
            u.password_hash,
            u.activo,
            r.nombre AS rol
        FROM usuarios u
        INNER JOIN roles r ON u.id_rol = r.id_rol
        WHERE u.username = :username
    ";
 
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
 
    if (!$user) {
        echo json_encode(["success" => false, "message" => "Usuario no encontrado."]);
        exit;
    }
 
    if ((int)$user['activo'] === 0) {
        echo json_encode(["success" => false, "message" => "Usuario inactivo. Contacte al administrador."]);
        exit;
    }
 
    // ✅ Nueva verificación universal (SHA2_256 o bcrypt)
    $inputHash = strtoupper(bin2hex(hash('sha256', $password, true)));
 
    if (
        password_verify($password, $user['password_hash']) || 
        $user['password_hash'] === $inputHash
    ) {
        echo json_encode([
            "success" => true,
            "rol" => $user['rol'],
            "message" => "Inicio de sesión exitoso como " . $user['rol']
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Contraseña incorrecta."]);
    }
 
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error en el servidor.",
        "details" => $e->getMessage()
    ]);
}
?>