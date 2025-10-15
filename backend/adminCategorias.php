<?php


// Archivo que conecta con la base de datos
require 'db.php';




// Función para agregar una categoría
function agregarCategoria($nombre, $slug, $estado, $icono_path)
{
    global $pdo;

    try {
        $sql = "INSERT INTO categorias (nombre, slug, estado, icono_path)
                VALUES (:nombre, :slug, :estado, :icono_path)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':nombre' => $nombre,
            ':slug' => $slug,
            ':estado' => $estado,
            ':icono_path' => $icono_path, // URL del icono
        ]);
        return $pdo->lastInsertId(); // Devuelve el ID de la categoría creada
    } catch (Exception $e) {
        logError("Error creando categoría: " . $e->getMessage());
        return 0;
    }
}




// Función para editar una categoría
function editarCategoria($id_categoria, $nombre, $slug, $estado, $icono_path)
{
    global $pdo;

    try {
        $sql = "UPDATE categorias
                SET nombre = :nombre, slug = :slug, estado = :estado, icono_path = :icono_path
                WHERE id_categoria = :id_categoria";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':nombre' => $nombre,
            ':slug' => $slug,
            ':estado' => $estado,
            ':icono_path' => $icono_path,
            ':id_categoria' => $id_categoria,
        ]);
        $affectRows = $stmt->rowCount();
        return $affectRows > 0; // Devuelve true si se actualizó algo
    } catch (Exception $e) {
        logError("Error editando categoría: " . $e->getMessage());
        return false;
    }
}




// Función para obtener todas las categorías
function obtenerTodasLasCategorias()
{
    global $pdo;

    try {
        $sql = "SELECT * FROM categorias";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC); // Devuelve todas las categorías como un array asociativo
    } catch (Exception $e) {
        logError("Error obteniendo categorías: " . $e->getMessage());
        return [];
    }

}




//Función para inactivar una categoría - Solo cambia el estado a Inactivo

function inactivarCategoria($id_categoria)
{
    global $pdo;
    try {
        // Cambia el estado de la categoría a Inactivo en lugar de eliminarla
        $sql = "UPDATE categorias 
                   SET estado = 'Inactivo'
                 WHERE id_categoria = :id_categoria";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id_categoria' => $id_categoria]);

        return $stmt->rowCount() > 0; // Devuelve true si se cambió el estado
    } catch (Exception $e) {
        logError("Error cambiando estado de la categoría: " . $e->getMessage());
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
        $categorias = obtenerTodasLasCategorias();
        echo json_encode($categorias);
        break;

    case 'POST':
        $input = getJsonInput();
        if (
            isset(
            $input['nombre'],
            $input['slug'],
            $input['icono_path']
        )
        ) {
            $id_categoria = agregarCategoria(
                $input['nombre'],
                $input['slug'],
                $estado = 'Activo',
                $input['icono_path'] // URL del icono
            );

            if ($id_categoria > 0) {
                http_response_code(201); // Código de respuesta HTTP 201 (Created)
                echo json_encode(["message " => "Categoría creada exitosamente: ID =" . $id_categoria]);
            } else {
                http_response_code(500); // Código de respuesta HTTP 500 (Internal Server Error)
                echo json_encode(["error" => "Error al crear la categoría"]);
            }
        } else {
            http_response_code(400); // Código de respuesta HTTP 400 (Bad Request)
            echo json_encode(["error" => "Faltan datos"]);
        }
        break;

    case 'PUT':
        $input = getJsonInput(); // Obtiene el cuerpo de la solicitud
        $id_categoria = $_GET['id_categoria'] ?? ($input['id_categoria'] ?? null); // Obtiene el ID de la categoría de la URL o el cuerpo de la solicitud
        if (
            isset(
            $input['id_categoria'],
            $input['nombre'],
            $input['slug'],
            $input['estado'],
            $input['icono_path']
        )
        ) {
            $editResult = editarCategoria(
                $input['id_categoria'],
                $input['nombre'],
                $input['slug'],
                $input['estado'],
                $input['icono_path'] // URL del icono
            );

            if ($editResult) {
                http_response_code(200); // Código de respuesta HTTP 200 (OK)
                echo json_encode(["message" => "Categoría editada exitosamente"]);
            } else {
                http_response_code(500); // Código de respuesta HTTP 500 (Internal Server Error)
                echo json_encode(["error" => "Error al editar la categoría"]);
            }
        } else {
            http_response_code(400); // Código de respuesta HTTP 400 (Bad Request)
            echo json_encode(["error" => "Faltan datos"]);
        }
        break;

    case 'DELETE':
        $input = getJsonInput(); // Obtiene el cuerpo de la solicitud (por si viene el id en JSON)
        $id_categoria = $_GET['id_categoria'] ?? ($input['id_categoria'] ?? null); // Obtiene el ID de la categoría de la URL o del body

        if ($id_categoria) {
            // Llama a la función que actualiza el estado = Inactivo
            $result = inactivarCategoria($id_categoria);

            if ($result) {
                http_response_code(200); // Código de respuesta HTTP 200 (OK)
                echo json_encode(["message" => "Categoría inactivada exitosamente"]);
            } else {
                http_response_code(500); // Código de respuesta HTTP 500 (Internal Server Error)
                echo json_encode(["error" => "Error al inactivar la categoría"]);
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