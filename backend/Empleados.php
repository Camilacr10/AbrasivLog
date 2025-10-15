<?php
require_once "db.php";
require_once "message_log.php";

//  FUNCIONES 

// Agregar empleado
function agregarEmpleado($nombre, $fecha, $vacaciones, $puesto, $archivo) {
    global $pdo;

    $rutaFinal = null;

    if ($archivo && $archivo['error'] === UPLOAD_ERR_OK) {
       $carpetaDestino = dirname(__DIR__) . "/Documentos_Empleados/";
        $ext = pathinfo($archivo['name'], PATHINFO_EXTENSION);
        $nombreArchivo = uniqid("emp_") . "." . $ext;

        if (move_uploaded_file($archivo['tmp_name'], $carpetaDestino . $nombreArchivo)) {
            $rutaFinal = "Documentos_Empleados/$nombreArchivo";
        }
    }

    $sql = "INSERT INTO empleados (nombre_completo, fecha_ingreso, dias_vacaciones, puesto, estado, archivo)
            VALUES (:nombre, :fecha, :vacaciones, :puesto, 1, :archivo)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':nombre'=>$nombre,
        ':fecha'=>$fecha,
        ':vacaciones'=>$vacaciones,
        ':puesto'=>$puesto,
        ':archivo'=>$rutaFinal
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
function editarEmpleado($id, $nombre, $fecha, $vacaciones, $puesto, $estado, $archivo = null) {
    global $pdo;

    $rutaFinal = null;

    // Si se subió un archivo, se guarda
    if ($archivo && $archivo['error'] === UPLOAD_ERR_OK) {
        $carpetaDestino = dirname(__DIR__) . "/Documentos_Empleados/";
        if (!is_dir($carpetaDestino)) mkdir($carpetaDestino, 0777, true);

        $ext = pathinfo($archivo['name'], PATHINFO_EXTENSION);
        $nombreArchivo = uniqid("emp_") . "." . $ext;

        if (move_uploaded_file($archivo['tmp_name'], $carpetaDestino . $nombreArchivo)) {
            $rutaFinal = "Documentos_Empleados/$nombreArchivo";
        }
    }

    // Si hay archivo nuevo, se actualiza también
    if ($rutaFinal) {
        $sql = "UPDATE empleados 
                   SET nombre_completo=:nombre, fecha_ingreso=:fecha, dias_vacaciones=:vacaciones, puesto=:puesto, estado=:estado, archivo=:archivo
                 WHERE id_empleado=:id";
        $params = [
            ':id'        => $id,
            ':nombre'    => $nombre,
            ':fecha'     => $fecha,
            ':vacaciones'=> $vacaciones,
            ':puesto'    => $puesto,
            ':estado'    => $estado,
            ':archivo'   => $rutaFinal
        ];
    } else {
        // Si no se sube archivo, se actualizan solo los demás campos
        $sql = "UPDATE empleados 
                   SET nombre_completo=:nombre, fecha_ingreso=:fecha, dias_vacaciones=:vacaciones, puesto=:puesto, estado=:estado 
                 WHERE id_empleado=:id";
        $params = [
            ':id'        => $id,
            ':nombre'    => $nombre,
            ':fecha'     => $fecha,
            ':vacaciones'=> $vacaciones,
            ':puesto'    => $puesto,
            ':estado'    => $estado
        ];
    }

    $stmt = $pdo->prepare($sql);
    return $stmt->execute($params);
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
    $id = agregarEmpleado(
        $_POST['nombre'],
        $_POST['fecha'],
        $_POST['vacaciones'],
        $_POST['puesto'],
        $_FILES['archivo'] ?? null
    );
    echo json_encode(['success'=>$id>0, 'id'=>$id]);
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
        $_POST['estado'],
        $_FILES['archivo'] ?? null
    );
    echo json_encode(['success'=>$ok]);
    break;

  case 'cambiarEstado':
    $data = json_decode(file_get_contents('php://input'), true);
      if (!$data) {
        $data = $_POST;
    }

    $id = $data['id'] ?? null;
    $estado = $data['estado'] ?? 0;
    $ok = cambiarEstadoEmpleado($id, $estado);
    echo json_encode(['success'=>$ok]);
    break;

    default:
        echo json_encode(['success'=>false, 'msg'=>'Acción no válida']);
}
