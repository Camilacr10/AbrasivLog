<?php
require 'db.php';

header('Content-Type: application/json; charset=utf-8');

function getJsonInput() {
    $raw = file_get_contents("php://input");
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}


function agregarCliente($nombre, $razon_social, $cedula, $telefono, $correo, $direccion, $estado = 'ACTIVO')
{
    global $pdo;
    try {
        $sql = "INSERT INTO clientes (nombre, razon_social, cedula, telefono, correo_electronico, direccion, estado)
                VALUES (:nombre, :razon_social, :cedula, :telefono, :correo, :direccion, :estado)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':nombre'        => $nombre,
            ':razon_social'  => $razon_social !== '' ? $razon_social : null,
            ':cedula'        => $cedula,
            ':telefono'      => $telefono !== '' ? $telefono : null,
            ':correo'        => $correo   !== '' ? $correo   : null,
            ':direccion'     => $direccion!== '' ? $direccion: null,
            ':estado'        => $estado !== '' ? $estado : 'ACTIVO',
        ]);
        return (int)$pdo->lastInsertId();
    } catch (PDOException $e) {
        return ["error" => $e->getMessage(), "code" => $e->getCode()];
    } catch (Exception $e) {
        return ["error" => $e->getMessage(), "code" => "0"];
    }
}

function editarCliente($id_cliente, $nombre, $razon_social, $cedula, $telefono, $correo, $direccion, $estado)
{
    global $pdo;
    try {
        $sql = "UPDATE clientes
                   SET nombre = :nombre,
                       razon_social = :razon_social,
                       cedula = :cedula,
                       telefono = :telefono,
                       correo_electronico = :correo,
                       direccion = :direccion,
                       estado = :estado
                 WHERE id_cliente = :id_cliente";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':nombre'        => $nombre,
            ':razon_social'  => $razon_social !== '' ? $razon_social : null,
            ':cedula'        => $cedula,
            ':telefono'      => $telefono !== '' ? $telefono : null,
            ':correo'        => $correo   !== '' ? $correo   : null,
            ':direccion'     => $direccion!== '' ? $direccion: null,
            ':estado'        => $estado,
            ':id_cliente'    => $id_cliente,
        ]);
        return $stmt->rowCount() > 0;
    } catch (PDOException $e) {
        return ["error" => $e->getMessage(), "code" => $e->getCode()];
    } catch (Exception $e) {
        return ["error" => $e->getMessage(), "code" => "0"];
    }
}

function obtenerTodosLosClientes()
{
    global $pdo;
    try {
    
        $sql = "SELECT id_cliente, nombre, razon_social, cedula, telefono, correo_electronico, direccion, estado
                  FROM clientes
              ORDER BY nombre ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return ["error" => $e->getMessage()];
    }
}

function inactivarCliente($id_cliente)
{
    global $pdo;
    try {
        $sql = "UPDATE clientes SET estado = 'INACTIVO' WHERE id_cliente = :id_cliente";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id_cliente' => $id_cliente]);
        return $stmt->rowCount() > 0;
    } catch (PDOException $e) {
        return ["error" => $e->getMessage()];
    }
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':
        $clientes = obtenerTodosLosClientes();
        if (isset($clientes['error'])) {
            http_response_code(500);
            echo json_encode(["ok" => false, "message" => "Error obteniendo clientes", "detail" => $clientes['error']]);
            break;
        }
        echo json_encode(["ok" => true, "data" => $clientes]);
        break;

    case 'POST':
        $input = getJsonInput();

        if (isset($input['nombre'], $input['cedula'])) {
            $nombre       = trim($input['nombre']);
            $razon_social = trim($input['razon_social'] ?? '');
            $cedula       = trim($input['cedula']);
            $telefono     = trim($input['telefono']     ?? '');
            $correo       = trim($input['correo']       ?? '');
            $direccion    = trim($input['direccion']    ?? '');
            $estado       = trim($input['estado']       ?? 'ACTIVO');

            if ($nombre === '' || $cedula === '') {
                http_response_code(400);
                echo json_encode(["ok" => false, "message" => "Por favor, verifique que los campos obligatorios estén completos y digitados correctamente."]);
                break;
            }

            if ($correo !== '' && !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(["ok" => false, "message" => "Los datos ingresados no son válidos. Por favor, verifique e intente de nuevo."]);
                break;
            }

            $res = agregarCliente($nombre, $razon_social, $cedula, $telefono, $correo, $direccion, $estado);

            if (is_array($res) && isset($res['error'])) {
                $status = ($res['code'] === '23000') ? 409 : 500; // UNIQUE / constraint
                http_response_code($status);
                echo json_encode(["ok" => false, "message" => "Error al crear cliente", "detail" => $res['error']]);
                break;
            }

            http_response_code(201);
            echo json_encode([
                "ok" => true,
                "message" => "Cliente registrado exitosamente",
                "id_cliente" => $res
            ]);
        } else {
            http_response_code(400);
            echo json_encode(["ok" => false, "message" => "Por favor, verifique que los campos obligatorios estén completos y digitados correctamente."]);
        }
        break;

    case 'PUT':
        $input = getJsonInput();
        /* ============= VALIDACIONES Y CAMPOS NUEVOS ============= */
        if (isset($input['id_cliente'], $input['nombre'], $input['cedula'], $input['estado'])) {
            $id_cliente   = (int)$input['id_cliente'];
            $nombre       = trim($input['nombre']);
            $razon_social = trim($input['razon_social'] ?? '');
            $cedula       = trim($input['cedula']);
            $telefono     = trim($input['telefono']     ?? '');
            $correo       = trim($input['correo']       ?? '');
            $direccion    = trim($input['direccion']    ?? '');
            $estado       = trim($input['estado']);

            if ($nombre === '' || $cedula === '') {
                http_response_code(400);
                echo json_encode(["ok" => false, "message" => "Por favor, verifique que los campos obligatorios estén completos y digitados correctamente."]);
                break;
            }

            if ($correo !== '' && !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(["ok" => false, "message" => "Los datos ingresados no son válidos. Por favor, verifique e intente de nuevo."]);
                break;
            }

            $edit = editarCliente($id_cliente, $nombre, $razon_social, $cedula, $telefono, $correo, $direccion, $estado);

            if (is_array($edit) && isset($edit['error'])) {
                $status = ($edit['code'] === '23000') ? 409 : 500;
                http_response_code($status);
                echo json_encode(["ok" => false, "message" => "Error al editar cliente", "detail" => $edit['error']]);
                break;
            }

            if ($edit === true) {
                http_response_code(200);
                echo json_encode(["ok" => true, "message" => "Datos actualizados con éxito"]);
            } else {
                http_response_code(404);
                echo json_encode(["ok" => false, "message" => "El sistema descarta los cambios y mantiene la información original del cliente sin modificar."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["ok" => false, "message" => "Por favor, verifique que los campos obligatorios estén completos y digitados correctamente."]);
        }
        break;

    case 'DELETE':
        $input = getJsonInput();
        $id_cliente = (int)($_GET['id_cliente'] ?? ($input['id_cliente'] ?? 0));

        if ($id_cliente <= 0) {
            http_response_code(400);
            echo json_encode(["ok" => false, "message" => "Falta id_cliente"]);
            break;
        }

        $res = inactivarCliente($id_cliente);

        if (is_array($res) && isset($res['error'])) {
            http_response_code(500);
            echo json_encode(["ok" => false, "message" => "Error al inactivar cliente", "detail" => $res['error']]);
            break;
        }

        if ($res === true) {
            http_response_code(200);
            echo json_encode(["ok" => true, "message" => "Cliente inactivado exitosamente"]);
        } else {
            http_response_code(404);
            echo json_encode(["ok" => false, "message" => "Cliente no encontrado"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["ok" => false, "message" => "Método no permitido"]);
        break;
}
