<?php


// Archivo que conecta con la base de datos
require 'db.php';
//Archivo de auditoria
require 'auditoria.php';





// Función para agregar un proveedor
function agregarProveedor($cedula_juridica, $telefono, $correo, $estado, $nombre)
{
    global $pdo;

    try {
        $sql = "INSERT INTO proveedores (cedula_juridica, telefono, correo, estado, nombre)
                VALUES (:cedula_juridica, :telefono, :correo, :estado, :nombre)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':cedula_juridica' => $cedula_juridica,
            ':telefono' => $telefono,
            ':correo' => $correo,
            ':estado' => $estado,
            ':nombre' => $nombre,
        ]);
        return $pdo->lastInsertId(); // Devuelve el ID del proveedor creado
    } catch (Exception $e) {
        logError("Error creando proveedor: " . $e->getMessage());
        return 0;
    }
}




// Función para editar un proveedor
function editarProveedor($id_proveedor, $cedula_juridica, $telefono, $correo, $estado, $nombre)
{
    global $pdo;

    try {
        $sql = "UPDATE proveedores
                SET cedula_juridica = :cedula_juridica, telefono = :telefono, correo = :correo, estado = :estado, nombre = :nombre
                WHERE id_proveedor = :id_proveedor";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':cedula_juridica' => $cedula_juridica,
            ':telefono' => $telefono,
            ':correo' => $correo,
            ':estado' => $estado,
            ':nombre' => $nombre,
            ':id_proveedor' => $id_proveedor,
        ]);
        $affectRows = $stmt->rowCount();
        return $affectRows > 0; // Devuelve true si se actualizó algo
    } catch (Exception $e) {
        logError("Error editando proveedor: " . $e->getMessage());
        return false;
    }
}




// Función para obtener todos los proveedores
function obtenerTodosLosProveedores()
{
    global $pdo;

    try {
        $sql = "SELECT * FROM proveedores";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC); // Devuelve todos los proveedores como un array asociativo
    } catch (Exception $e) {
        logError("Error obteniendo proveedores: " . $e->getMessage());
        return [];
    }

}




//Función para inactivar un proveedor - Solo cambia el estado a Inactivo

function inactivarProveedor($id_proveedor)
{
    global $pdo;
    try {
        // Cambia el estado del proveedor a Inactivo (0) en lugar de eliminarlo
        $sql = "UPDATE proveedores 
                   SET estado = 'Inactivo'
                 WHERE id_proveedor = :id_proveedor";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id_proveedor' => $id_proveedor]);

        return $stmt->rowCount() > 0; // Devuelve true si se cambió el estado
    } catch (Exception $e) {
        logError("Error cambiando estado del proveedor: " . $e->getMessage());
        return false;
    }
}




// Manejo de la solicitud HTTP
$method = $_SERVER['REQUEST_METHOD'];
header('Content-Type: application/json');  // Establece el encabezado de la respuesta como JSON

function getJsonInput()
{
    return json_decode(file_get_contents("php://input"), true);
}


switch ($method) {
    case 'GET':
        $proveedores = obtenerTodosLosProveedores();
        echo json_encode($proveedores);
        break;

    case 'POST':
        $input = getJsonInput();
        if (
            isset(
            $input['cedula_juridica'],
            $input['telefono'],
            $input['correo'],
            $input['nombre']
        )
        ) {
            $id_proveedor = agregarProveedor(
                $input['cedula_juridica'],
                $input['telefono'],
                $input['correo'],
                $estado = 'Activo',
                $input['nombre']
            );
            registrarAuditoria('proveedores', $id_proveedor, 'CREAR', 'Se creo un proveedor');

            if ($id_proveedor > 0) {
                http_response_code(201); // Código de respuesta HTTP 201 (Created)
                echo json_encode(["message " => "Proveedor creado exitosamente: ID =" . $id_proveedor]);
            } else {
                http_response_code(500); // Código de respuesta HTTP 500 (Internal Server Error)
                echo json_encode(["error" => "Error al crear el proveedor"]);
            }
        } else {
            http_response_code(400); // Código de respuesta HTTP 400 (Bad Request)
            echo json_encode(["error" => "Faltan datos"]);
        }
        break;

    case 'PUT':
        $id_proveedor = $_GET['id_proveedor'] ?? ($input['id_proveedor'] ?? null); // Obtiene el ID del proveedor de la URL o el cuerpo de la solicitud
        $input = getJsonInput(); // Obtiene el cuerpo de la solicitud
        if (
            isset(
            $input['id_proveedor'],
            $input['cedula_juridica'],
            $input['telefono'],
            $input['correo'],
            $input['estado'],
            $input['nombre']
        )
        ) {
            $editResult = editarProveedor(
                $input['id_proveedor'],
                $input['cedula_juridica'],
                $input['telefono'],
                $input['correo'],
                $input['estado'],
                $input['nombre']
            );
            registrarAuditoria('proveedores', $id_proveedor, 'EDITAR', 'Se edito un proveedor');

            if ($editResult) {
                http_response_code(200); // Código de respuesta HTTP 200 (OK)
                echo json_encode(["message" => "Proveedor editado exitosamente"]);
            } else {
                http_response_code(500); // Código de respuesta HTTP 500 (Internal Server Error)
                echo json_encode(["error" => "Error al editar el proveedor"]);
            }
        } else {
            http_response_code(400); // Código de respuesta HTTP 400 (Bad Request)
            echo json_encode(["error" => "Faltan datos"]);
        }
        break;

    case 'DELETE':
        $id_proveedor = $_GET['id_proveedor'] ?? ($input['id_proveedor'] ?? null); // Obtiene el ID del proveedor de la URL o del body
        $input = getJsonInput(); // Obtiene el cuerpo de la solicitud (por si viene el id en JSON)
        registrarAuditoria('proveedores', $id_proveedor, 'INACTIVAR', 'Se inactivo un proveedor');

        if ($id_proveedor) {
            // Llama a la función que actualiza el estado = 0 (Inactivo)
            $result = inactivarProveedor($id_proveedor);

            if ($result) {
                http_response_code(200); // Código de respuesta HTTP 200 (OK)
                echo json_encode(["message" => "Proveedor inactivado exitosamente"]);
            } else {
                http_response_code(500); // Código de respuesta HTTP 500 (Internal Server Error)
                echo json_encode(["error" => "Error al inactivar el proveedor"]);
            }
        } else {
            http_response_code(400); // Código de respuesta HTTP 400 (Bad Request)
            echo json_encode(["error" => "Faltan datos"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Metodo no permitido"]);
        break;
}