<?php
require_once "db.php";
require_once "message_log.php";
require 'auditoria.php';
header('Content-Type: application/json; charset=utf-8');

// ─────────────── BORRA CACHE ───────────────


header('Content-Type: application/json; charset=utf-8');

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: 0");


// ─────────────── FUNCIONES ───────────────

// Buscar cliente por cédula
function obtenerClientePorCedula($cedula) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT id_cliente, nombre FROM clientes WHERE cedula = :cedula AND estado = 'ACTIVO'");
    $stmt->execute([':cedula' => $cedula]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// Buscar empleado por nombre (puesto Mensajero)
function obtenerEmpleadoPorNombre($nombre) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT id_empleado, nombre_completo 
                           FROM empleados 
                           WHERE nombre_completo = :nombre 
                             AND puesto = 'Mensajero' 
                             AND estado = 'Activo'");
    $stmt->execute([':nombre' => $nombre]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// Buscar producto por nombre
function obtenerProductoPorNombre($nombre) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT id_producto, nombre 
                           FROM productos 
                           WHERE nombre = :nombreP 
                             AND estado = 'Activo'");
    $stmt->execute([':nombreP' => $nombre]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// Agregar entrega
function agregarEntrega($id_cliente, $id_empleado, $fecha) {
    global $pdo;
    $sql = "INSERT INTO entregas (id_cliente, id_empleado, fecha_entrega, estado)
            VALUES (:id_cliente, :id_empleado, :fecha, 'Pendiente')";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id_cliente' => $id_cliente,
        ':id_empleado' => $id_empleado,
        ':fecha' => $fecha
    ]);
    return $pdo->lastInsertId();
}

function editarEntrega($id_entrega, $id_cliente, $id_empleado, $fecha) {
    global $pdo;
    $sql = "UPDATE entregas 
            SET id_cliente = :id_cliente,
                id_empleado = :id_empleado, 
                fecha_entrega = :fecha
            WHERE id_entrega = :id_entrega";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([
        ':id_cliente' => $id_cliente,
        ':id_empleado' => $id_empleado,
        ':fecha' => $fecha,
        ':id_entrega' => $id_entrega
    ]);
}


// Agregar detalle entrega
function agregarDetalleEntrega($id_entrega, $id_producto, $cantidad, $precio_unitario, $descuento_aplicado, $porcentaje_iva_aplicado) {
    global $pdo;
    $sql = "INSERT INTO entregas_detalle 
            (id_entrega, id_producto, cantidad, precio_unitario, descuento_aplicado, porcentaje_iva_aplicado)
            VALUES 
            (:id_entrega, :id_producto, :cantidad, :precio_unitario, :descuento_aplicado, :porcentaje_iva_aplicado)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id_entrega' => $id_entrega,
        ':id_producto' => $id_producto,
        ':cantidad' => $cantidad,
        ':precio_unitario' => $precio_unitario,
        ':descuento_aplicado' => $descuento_aplicado,
        ':porcentaje_iva_aplicado' => $porcentaje_iva_aplicado
    ]);
}

function editarDetalleEntrega($id_entrega, $id_producto_original, $id_producto_nuevo, $cantidad, $precio_unitario, $descuento, $iva) {
    global $pdo;
    $sql = "UPDATE entregas_detalle 
            SET id_producto = :id_producto_nuevo,
                cantidad = :cantidad, 
                precio_unitario = :precio_unitario, 
                descuento_aplicado = :descuento, 
                porcentaje_iva_aplicado = :iva
            WHERE id_entrega = :id_entrega AND id_producto = :id_producto_original";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([
        ':id_producto_nuevo' => $id_producto_nuevo,
        ':cantidad' => $cantidad,
        ':precio_unitario' => $precio_unitario,
        ':descuento' => $descuento,
        ':iva' => $iva,
        ':id_entrega' => $id_entrega,
        ':id_producto_original' => $id_producto_original
    ]);
}


// Obtener entregas
function obtenerEntregas() {
    global $pdo;
    $sql = "SELECT 
                e.id_entrega,
                e.id_cliente,
                e.id_empleado,
                c.cedula AS cedula_cliente,
                c.nombre AS nombre_cliente,
                emp.nombre_completo AS nombre_empleado,
                e.fecha_entrega,
                e.estado
            FROM entregas e
            INNER JOIN clientes c ON e.id_cliente = c.id_cliente
            INNER JOIN empleados emp ON e.id_empleado = emp.id_empleado
            ORDER BY e.fecha_entrega DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function obtenerDetallesPorEntrega($id_entrega) {
    global $pdo;
    $sql = "SELECT 
                en.id_entrega,
                en.fecha_entrega,
                en.estado,
                c.nombre AS nombre_cliente,
                c.direccion,
                c.telefono,
                e.nombre_completo AS nombre_empleado,
                p.id_producto,             
                p.nombre AS nombre_producto,
                ed.cantidad,
                ed.precio_unitario,
                ed.descuento_aplicado,
                ed.porcentaje_iva_aplicado
            FROM entregas_detalle ed
            INNER JOIN productos p ON ed.id_producto = p.id_producto
            INNER JOIN entregas en ON ed.id_entrega = en.id_entrega
            INNER JOIN clientes c ON en.id_cliente = c.id_cliente
            INNER JOIN empleados e ON en.id_empleado = e.id_empleado
            WHERE ed.id_entrega = :id_entrega";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id_entrega' => $id_entrega]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}


function cambiarEstadoEntrega($id_entrega, $estado) {
    global $pdo;
    try {
        $sql = "UPDATE entregas 
                   SET estado = :estado
                 WHERE id_entrega = :id_entrega";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':estado' => $estado,
            ':id_entrega' => $id_entrega
        ]);
        return $stmt->rowCount() > 0;
    } catch (Exception $e) {
        logError("Error cambiando estado de la entrega: " . $e->getMessage());
        return false;
    }
}

// ─────────────── CONTROLADOR ───────────────
$accion = $_GET['accion'] ?? '';

switch ($accion) {
    case 'buscarPorCedula':
        $cedula = $_GET['cedula'] ?? '';
        $cliente = obtenerClientePorCedula($cedula);
        echo json_encode($cliente ?: []);
        break;

    case 'agregar':
        $clienteCedula = $_POST['cliente_cedula'] ?? '';
        $idEmpleado = $_POST['empleado_id'] ?? '';
        $fecha = $_POST['fecha'] ?? '';
        
        if (!$clienteCedula || !$idEmpleado || !$fecha) {
            echo json_encode(['success' => false, 'msg' => 'Faltan datos obligatorios']);
            exit;
        }

        $cliente = obtenerClientePorCedula($clienteCedula);
        if (!$cliente) {
            echo json_encode(['success' => false, 'msg' => 'Cliente no encontrado o inactivo']);
            exit;
        }

        $id = agregarEntrega($cliente['id_cliente'], $idEmpleado, $fecha);

         if ($id > 0) {
        registrarAuditoria('entregas', $id, 'CREAR', "Se registró la entrega #$id");
    }

        echo json_encode(['success' => $id > 0, 'id' => $id]);
        break;

    case 'listar':
        $entregas = obtenerEntregas();
        echo json_encode($entregas);
        break;

    case 'agregarDetalle':
    $id_entrega = $_POST['id_entrega'] ?? '';
    $id_producto = $_POST['id_producto'] ?? '';
    $cantidad = $_POST['cantidad'] ?? '';
    $precio_unitario = $_POST['precio_unitario'] ?? '';
    $descuento = $_POST['descuento_aplicado'] ?? 0;
    $iva = $_POST['porcentaje_iva_aplicado'] ?? 13;

    if (!$id_entrega || !$id_producto || !$cantidad || !$precio_unitario) {
        echo json_encode(['success' => false, 'msg' => 'Datos incompletos']);
        exit;
    }

    agregarDetalleEntrega($id_entrega, $id_producto, $cantidad, $precio_unitario, $descuento, $iva);
    echo json_encode(['success' => true]);
    break;
   
    case 'editarEntrega':
    $id = $_POST['id_entrega'] ?? null;
    $id_cliente = $_POST['cliente_id'] ?? null; 
    $id_empleado = $_POST['empleado_id'] ?? null; 
    $fecha = $_POST['fecha'] ?? null;

    if (!$id || !$id_cliente || !$id_empleado || !$fecha) {
        echo json_encode(['success' => false, 'msg' => 'Faltan datos en editar Entrega']);
        exit;
    }

    $ok = editarEntrega($id, $id_cliente, $id_empleado, $fecha);
    if ($ok) {
        registrarAuditoria('entregas', $id, 'EDITAR', "Se modificó la entrega #$id");
    }
    echo json_encode(['success' => (bool)$ok]);
    break;

    case 'editarDetalle':
    $id_entrega = $_POST['id_entrega'];
    $id_producto_original = $_POST['id_producto_original']; 
    $id_producto_nuevo = $_POST['id_producto']; 
    $cantidad = $_POST['cantidad'];
    $precio = $_POST['precio_unitario'];
    $descuento = $_POST['descuento_aplicado'];
    $iva = $_POST['porcentaje_iva_aplicado'];

    $ok = editarDetalleEntrega($id_entrega, $id_producto_original, $id_producto_nuevo, $cantidad, $precio, $descuento, $iva);
    echo json_encode(['success' => $ok]);
    break;

    
    case 'obtenerDetallePorEntrega':
    $id = $_GET['id_entrega'] ?? null;
    if (!$id) {
        echo json_encode(["error" => "ID de entrega no válido."]);
        exit;
    }
    $detalles = obtenerDetallesPorEntrega($id);
    echo json_encode($detalles);
    break;

    case 'cambiarEstado':
    $id_entrega = $_POST['id_entrega'] ?? null;
    $estado = $_POST['estado'] ?? null;

    if (!$id_entrega || !$estado) {
        echo json_encode(['success' => false, 'msg' => 'No se puede cambiar el estado']);
        exit;
    }

    $ok = cambiarEstadoEntrega($id_entrega, $estado);
    if ($ok) {
        registrarAuditoria('entregas', $id_entrega, 'ESTADO', "Se cambió el estado de la entrega #$id_entrega a '$estado'");
    }

    echo json_encode(['success' => $ok]);
    break;

    case 'buscarCedulas':
    $stmt = $pdo->query("SELECT cedula, nombre FROM clientes WHERE estado = 'ACTIVO'");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    break;

    default:
        echo json_encode(['success' => false, 'msg' => 'Acción no válida']);
}
?>
