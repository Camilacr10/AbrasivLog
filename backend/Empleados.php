<?php
require_once "db.php";
require_once "message_log.php";

// ─────────────── FUNCIONES ───────────────

// Agregar empleado
function agregarEmpleado($nombre, $fecha, $vacaciones, $puesto, $archivo) {
    global $pdo;

    $sql = "INSERT INTO empleados (nombre_completo, fecha_ingreso, dias_vacaciones, puesto, estado, archivo)
            VALUES (:nombre, :fecha, :vacaciones, :puesto, 'Activo', :archivo)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':nombre' => $nombre,
        ':fecha' => $fecha,
        ':vacaciones' => $vacaciones,
        ':puesto' => $puesto,
        ':archivo' => $archivo 
    ]);

    return $pdo->lastInsertId();
}

function editarEmpleado($id, $nombre, $fecha, $vacaciones, $puesto, $link = null) {
    global $pdo;

    if ($link) {
        $sql = "UPDATE empleados 
                   SET nombre_completo=:nombre, fecha_ingreso=:fecha, dias_vacaciones=:vacaciones,
                       puesto=:puesto, estado=:estado, archivo=:archivo
                 WHERE id_empleado=:id";
        $params = [
            ':id' => $id,
            ':nombre' => $nombre,
            ':fecha' => $fecha,
            ':vacaciones' => $vacaciones,
            ':puesto' => $puesto,
            ':archivo' => $link
        ];
    } else {
        $sql = "UPDATE empleados 
                   SET nombre_completo=:nombre, fecha_ingreso=:fecha, dias_vacaciones=:vacaciones,
                       puesto=:puesto
                 WHERE id_empleado=:id";
        $params = [
            ':id' => $id,
            ':nombre' => $nombre,
            ':fecha' => $fecha,
            ':vacaciones' => $vacaciones,
            ':puesto' => $puesto
        ];
    }

    $stmt = $pdo->prepare($sql);
    return $stmt->execute($params);
}

// Obtener todos los empleados
function obtenerEmpleados() {
    global $pdo;
    $stmt = $pdo->query("SELECT * FROM empleados ORDER BY id_empleado ASC");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function cambiarEstadoEmpleado($id, $estado) {
    global $pdo;
    try {
        $sql = "UPDATE empleados 
                   SET estado = :estado
                 WHERE id_empleado = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':estado' => $estado,
            ':id' => $id
        ]);
        return $stmt->rowCount() > 0;
    } catch (Exception $e) {
        logError("Error cambiando estado del empleado: " . $e->getMessage());
        return false;
    }
}

// ─────────────── CONTROLADOR ───────────────

header('Content-Type: application/json');

$accion = $_GET['accion'] ?? '';

switch ($accion) {
    case 'agregar':
        $id = agregarEmpleado(
    $_POST['nombre'],
    $_POST['fecha'],
    $_POST['vacaciones'],
    $_POST['puesto'],
    $_POST['archivo'] 
);
        echo json_encode(['success' => $id > 0, 'id' => $id]);
        break;

    case 'listar':
        $empleados = obtenerEmpleados();
        echo json_encode($empleados);
        break;

   case 'editar':
    $ok = editarEmpleado(
        $_POST['id'],
        $_POST['nombre'],
        $_POST['fecha'],
        $_POST['vacaciones'],
        $_POST['puesto'],
        $_POST['archivo'] 
    );
        echo json_encode(['success' => $ok]);
        break;

    case 'cambiarEstado':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) $data = $_POST;

        $id = $data['id'] ?? null;
        $estado = $data['estado'] ?? 'Inactivo';
        $ok = cambiarEstadoEmpleado($id, $estado);
        echo json_encode(['success' => $ok]);
        break;

    default:
        echo json_encode(['success' => false, 'msg' => 'Acción no válida']);
}
