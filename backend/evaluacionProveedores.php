<?php


// Archivo que conecta con la base de datos
require 'db.php';
//Archivo de auditoria
require 'auditoria.php';





// Función para agregar una evaluación
function agregarDesempeno($id_proveedor, $puntualidad, $atencion, $disponibilidad, $observacion)
{
    global $pdo;

    try {
        $sql = "INSERT INTO desempeno (id_proveedor, puntualidad, atencion, disponibilidad, observacion)
            VALUES (:id_proveedor, :puntualidad, :atencion, :disponibilidad, :observacion)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id_proveedor' => $id_proveedor,
            ':puntualidad' => $puntualidad,
            ':atencion' => $atencion,
            ':disponibilidad' => $disponibilidad,
            ':observacion' => $observacion,

        ]);
        return $pdo->lastInsertId(); // Devuelve el ID de la evaluación creada
    } catch (Exception $e) {
        error_log("Error creando evaluación: " . $e->getMessage());
        return 0;
    }
}




// Función para editar una evaluación -- No se usa
function editarDesempeno($id_desempeno, $puntualidad, $atencion, $disponibilidad, $observacion)
{
    global $pdo;

    try {
        $sql = "UPDATE desempeno
              SET puntualidad = :puntualidad, atencion = :atencion,
                  disponibilidad = :disponibilidad, observacion = :observacion
            WHERE id_desempeno = :id_desempeno";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':puntualidad' => $puntualidad,
            ':atencion' => $atencion,
            ':disponibilidad' => $disponibilidad,
            ':observacion' => $observacion,
            ':id_desempeno' => $id_desempeno,
        ]);
        $affectRows = $stmt->rowCount();
        return $affectRows > 0; // Devuelve true si se actualizó algo
    } catch (Exception $e) {
        error_log("Error editando evaluación: " . $e->getMessage());
        return false;
    }
}




// Función para obtener las evaluaciones de un proveedor
function listarDesempenoPorProveedor($id_proveedor)
{
    global $pdo;

    try {
        $sql = "SELECT id_desempeno, id_proveedor, puntualidad, atencion, disponibilidad, observacion, fecha
            FROM desempeno
            WHERE id_proveedor = :id_proveedor
            ORDER BY id_desempeno ASC";
        $stmt = $pdo->prepare($sql); // Preparar la consulta
        $stmt->execute([':id_proveedor' => $id_proveedor]); // Ejecutar la consulta con el ID del proveedor
        return $stmt->fetchAll(PDO::FETCH_ASSOC); // Devuelve todas las evaluaciones como un array asociativo
    } catch (Exception $e) {
        error_log("Error obteniendo evaluaciones: " . $e->getMessage());
        return [];
    }
}




//Función para eliminar una evaluación -- No se usa
function eliminarDesempeno($id_desempeno)
{
    global $pdo;

    try {
        $stmt = $pdo->prepare("DELETE FROM desempeno WHERE id_desempeno = :id");
        $stmt->execute([':id' => $id_desempeno]); // Ejecutar la consulta con el ID de la evaluación
        return $stmt->rowCount() > 0; // Devuelve true si se eliminó la evaluación
    } catch (Exception $e) {
        error_log("Error eliminando evaluación: " . $e->getMessage());
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
        $id_proveedor = $_GET['id_proveedor'] ?? null; // Obtiene el ID del proveedor de la URL
        if (!$id_proveedor) { // Si no se proporciona un ID
            http_response_code(400);
            echo json_encode(["error" => "Falta id_proveedor"]);
            break;
        }
        echo json_encode(listarDesempenoPorProveedor($id_proveedor)); // Devuelve todas las evaluaciones del proveedor
        break;

    case 'POST':
        $input = getJsonInput();
        if (
            isset(
            $input['id_proveedor'],
            $input['puntualidad'],
            $input['atencion'],
            $input['disponibilidad']
        )
        ) {
            $id = agregarDesempeno(
                (int) $input['id_proveedor'],
                (int) $input['puntualidad'],
                (int) $input['atencion'],
                (int) $input['disponibilidad'],
                $input['observacion']
            );
            registrarAuditoria('desempeno', $id_desempeno, 'CREAR', 'Se creo una nueva evaluacion');

            if ($id > 0) {
                http_response_code(201); // Código de respuesta HTTP 201 (Created)
                echo json_encode(["message" => "Evaluación creada", "id_desempeno" => $id]);
            } else {
                http_response_code(500); // Código de respuesta HTTP 500 (Internal Server Error)
                echo json_encode(["error" => "Error al crear la evaluación"]);
            }
        } else {
            http_response_code(400); // Código de respuesta HTTP 400 (Bad Request)
            echo json_encode(["error" => "Faltan datos"]);
        }
        break;

    case 'PUT':
        $id_proveedor = $_GET['id_proveedor'] ?? null; // Obtiene el ID del proveedor de la URL
        $input = getJsonInput(); // Obtiene el cuerpo de la solicitud
        if (
            isset(
            $input['id_desempeno'],
            $input['puntualidad'],
            $input['atencion'],
            $input['disponibilidad']
        )
        ) {
            $editResult = editarDesempeno(
                $input['id_desempeno'],
                $input['puntualidad'],
                $input['atencion'],
                $input['disponibilidad'],
                $input['observacion']
            );
            registrarAuditoria('desempeno', $id_desempeno, 'EDITAR', 'Se edito una evaluacion');
            if ($editResult) {
                http_response_code(200); // Código de respuesta HTTP 200 (OK)
                echo json_encode(["message" => "Evaluación actualizada"]);
            } else {
                http_response_code(500); // Código de respuesta HTTP 500 (Internal Server Error)
                echo json_encode(["error" => "Error al actualizar la evaluación"]);
            }
        } else {
            http_response_code(400); // Código de respuesta HTTP 400 (Bad Request)
            echo json_encode(["error" => "Faltan datos"]);
        }
        break;

    case 'DELETE':
        $id = $_GET['id_desempeno'] ?? ($input['id_desempeno'] ?? null); // Obtiene el ID de la evaluación de la URL
        $input = getJsonInput(); // Obtiene el cuerpo de la solicitud
        registrarAuditoria('desempeno', $id_desempeno, 'INACTIVAR', 'Se inactivo una evaluacion');
        if ($id) {
            $result = eliminarDesempeno($id);

            if ($result) {
                http_response_code(200); // Código de respuesta HTTP 200 (OK)
                echo json_encode(["message" => "Evaluación eliminada"]);
            } else {
                http_response_code(500); // Código de respuesta HTTP 500 (Internal Server Error)
                echo json_encode(["error" => "Error al eliminar la evaluación"]);
            }
        } else {
            http_response_code(400); // Código de respuesta HTTP 400 (Bad Request)
            echo json_encode(["error" => "Falta id_desempeno"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Metodo no permitido"]);
        break;
}
