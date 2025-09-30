<?php
require_once "db.php";
require_once "message_log.php";

//  FUNCIONES 

// Agregar empleado
function agregarEmpleado($nombre, $fecha, $vacaciones, $puesto, $estado) {
    global $pdo;
    $sql = "INSERT INTO empleados (nombre_completo, fecha_ingreso, dias_vacaciones, puesto, estado)
            VALUES (:nombre, :fecha, :vacaciones, :puesto, :estado)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':nombre'=>$nombre,
        ':fecha'=>$fecha,
        ':vacaciones'=>$vacaciones,
        ':puesto'=>$puesto,
        ':estado' => $estado
    ]);
    return $pdo->lastInsertId();
}

// Obtener todos los empleados
function obtenerEmpleados() {
    global $pdo;
    $stmt = $pdo->query("SELECT * FROM empleados ORDER BY id_empleado ASC");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Editar empleado
function editarEmpleado($id, $nombre, $fecha, $vacaciones, $puesto) {
    global $pdo;
    $sql = "UPDATE empleados 
            SET nombre_completo=:nombre, fecha_ingreso=:fecha, dias_vacaciones=:vacaciones, puesto=:puesto
            WHERE id_empleado=:id";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([
        ':id'=>$id,
        ':nombre'=>$nombre,
        ':fecha'=>$fecha,
        ':vacaciones'=>$vacaciones,
        ':puesto'=>$puesto
    ]);
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

// CONTROLADOR 

header('Content-Type: application/json');

$accion = $_GET['accion'] ?? '';

switch($accion) {
    case 'agregar':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = agregarEmpleado($data['nombre'], $data['fecha'], $data['vacaciones'], $data['puesto'], $data['estado']);
        echo json_encode(['success'=>$id>0, 'id'=>$id]);
        break;

    case 'listar':
        $empleados = obtenerEmpleados();
        echo json_encode($empleados);
        break;

    case 'editar':
        $data = json_decode(file_get_contents('php://input'), true);
        $ok = editarEmpleado($data['id'], $data['nombre'], $data['fecha'], $data['vacaciones'], $data['puesto']);
        echo json_encode(['success'=>$ok]);
        break;

  case 'cambiarEstado':
    $data = json_decode(file_get_contents('php://input'), true);
    $ok = cambiarEstadoEmpleado($data['id'], $data['estado']);
    echo json_encode(['success'=>$ok]);
    break;

    default:
        echo json_encode(['success'=>false, 'msg'=>'Acción no válida']);
}
