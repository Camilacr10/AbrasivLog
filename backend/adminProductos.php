<?php


// Archivo que conecta con la base de datos
require 'db.php';




// Función para agregar un producto
function agregarProducto($id_categoria, $nombre, $codigo, $detalle, $precio_base, $porcentaje_iva, $cantidad, $iva, $porcentaje_descuento, $precio_final, $estado, $imagen_path)
{

    global $pdo;

    try {
        $sql = "INSERT INTO productos (id_categoria, nombre, codigo, detalle, precio_base, porcentaje_iva, cantidad, iva, porcentaje_descuento, precio_final, estado, imagen_path)
                VALUES (:id_categoria, :nombre, :codigo, :detalle, :precio_base, :porcentaje_iva, :cantidad, :iva, :porcentaje_descuento, :precio_final, :estado, :imagen_path)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id_categoria' => $id_categoria,
            ':nombre' => $nombre,
            ':codigo' => $codigo,
            ':detalle' => $detalle,
            ':precio_base' => $precio_base,
            ':porcentaje_iva' => $porcentaje_iva,
            ':cantidad' => $cantidad,
            ':iva' => $iva,
            ':porcentaje_descuento' => $porcentaje_descuento,
            ':precio_final' => $precio_final,
            ':estado' => $estado,
            ':imagen_path' => $imagen_path,
        ]);
        return $pdo->lastInsertId(); // Devuelve el ID del producto creado
    } catch (Exception $e) {
        logError("Error creando producto: " . $e->getMessage());
        return 0;
    }
}




// Función para editar un producto
function editarProducto($id_producto, $id_categoria, $nombre, $codigo, $detalle, $precio_base, $porcentaje_iva, $cantidad, $iva, $porcentaje_descuento, $precio_final, $estado, $imagen_path)
{
    global $pdo;

    try {
        $sql = "UPDATE productos
                SET id_categoria = :id_categoria, nombre = :nombre, codigo = :codigo, detalle = :detalle,
                    precio_base = :precio_base, porcentaje_iva = :porcentaje_iva, cantidad = :cantidad, 
                    iva = :iva, porcentaje_descuento = :porcentaje_descuento, precio_final = :precio_final,
                    estado = :estado, imagen_path = :imagen_path
                WHERE id_producto = :id_producto";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id_categoria' => $id_categoria,
            ':nombre' => $nombre,
            ':codigo' => $codigo,
            ':detalle' => $detalle,
            ':precio_base' => $precio_base,
            ':porcentaje_iva' => $porcentaje_iva,
            ':cantidad' => $cantidad,
            ':iva' => $iva,
            ':porcentaje_descuento' => $porcentaje_descuento,
            ':precio_final' => $precio_final,
            ':estado' => $estado,
            ':imagen_path' => $imagen_path,
            ':id_producto' => $id_producto,
        ]);
        $affectRows = $stmt->rowCount();
        return $affectRows > 0; // Devuelve true si se actualizó algo
    } catch (Exception $e) {
        logError("Error editando producto: " . $e->getMessage());
        return false;
    }
}




// Función para obtener todos los productos
function obtenerTodosLosProductos()
{
    global $pdo;

    try {
        $sql = "SELECT * FROM productos";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC); // Devuelve todos los productos como un array asociativo
    } catch (Exception $e) {
        logError("Error obteniendo productos: " . $e->getMessage());
        return [];
    }

}




//Función para inactivar un producto - Solo cambia el estado a Inactivo

function inactivarProducto($id_producto)
{
    global $pdo;
    try {
        // Cambia el estado del producto a Inactivo (sin eliminarlo)
        $sql = "UPDATE productos 
                   SET estado = 'Inactivo'
                 WHERE id_producto = :id_producto";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id_producto' => $id_producto]);

        return $stmt->rowCount() > 0; // Devuelve true si se cambió el estado
    } catch (Exception $e) {
        logError("Error cambiando estado del producto: " . $e->getMessage());
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
        $productos = obtenerTodosLosProductos();
        echo json_encode($productos);
        break;

    case 'POST':
        $input = getJsonInput();
        if (
            isset(
            $input['id_categoria'],
            $input['nombre'],
            $input['codigo'],
            $input['detalle'],
            $input['precio_base'],
            $input['porcentaje_iva'],
            $input['cantidad'],
            $input['iva'],
            $input['porcentaje_descuento'],
            $input['precio_final'],
            $input['imagen_path']
        )
        ) {
            $id_producto = agregarProducto(
                $input['id_categoria'],
                $input['nombre'],
                $input['codigo'],
                $input['detalle'],
                $input['precio_base'],
                $input['porcentaje_iva'],
                $input['cantidad'],
                $input['iva'],
                $input['porcentaje_descuento'],
                $input['precio_final'],
                $estado = 'Activo',
                $input['imagen_path']
            );

            if ($id_producto > 0) {
                http_response_code(201); // Código de respuesta HTTP 201 (Created)
                echo json_encode(["message " => "Producto creado exitosamente: ID =" . $id_producto]);
            } else {
                http_response_code(500); // Código de respuesta HTTP 500 (Internal Server Error)
                echo json_encode(["error" => "Error al crear el producto"]);
            }
        } else {
            http_response_code(400); // Código de respuesta HTTP 400 (Bad Request)
            echo json_encode(["error" => "Faltan datos"]);
        }
        break;

    case 'PUT':
        $id_producto = $_GET['id_producto'] ?? ($input['id_producto'] ?? null); // Obtiene el ID del producto de la URL o el cuerpo de la solicitud
        $input = getJsonInput(); // Obtiene el cuerpo de la solicitud
        if (
            isset(
            $input['id_producto'],
            $input['id_categoria'],
            $input['nombre'],
            $input['codigo'],
            $input['detalle'],
            $input['precio_base'],
            $input['porcentaje_iva'],
            $input['cantidad'],
            $input['iva'],
            $input['porcentaje_descuento'],
            $input['precio_final'],
            $input['estado'],
            $input['imagen_path']
        )
        ) {
            $editResult = editarProducto(
                $input['id_producto'],
                $input['id_categoria'],
                $input['nombre'],
                $input['codigo'],
                $input['detalle'],
                $input['precio_base'],
                $input['porcentaje_iva'],
                $input['cantidad'],
                $input['iva'],
                $input['porcentaje_descuento'],
                $input['precio_final'],
                $input['estado'],
                $input['imagen_path']
            );

            if ($editResult) {
                http_response_code(200); // Código de respuesta HTTP 200 (OK)
                echo json_encode(["message" => "Producto editado exitosamente"]);
            } else {
                http_response_code(500); // Código de respuesta HTTP 500 (Internal Server Error)
                echo json_encode(["error" => "Error al editar el producto"]);
            }
        } else {
            http_response_code(400); // Código de respuesta HTTP 400 (Bad Request)
            echo json_encode(["error" => "Faltan datos"]);
        }
        break;

    case 'DELETE':
        $id_producto = $_GET['id_producto'] ?? ($input['id_producto'] ?? null); // Obtiene el ID del producto de la URL o del body
        $input = getJsonInput(); // Obtiene el cuerpo de la solicitud (por si viene el id en JSON)

        if ($id_producto) {
            // Llama a la función que actualiza el estado = Inactivo
            $result = inactivarProducto($id_producto);

            if ($result) {
                http_response_code(200); // Código de respuesta HTTP 200 (OK)
                echo json_encode(["message" => "Producto inactivado exitosamente"]);
            } else {
                http_response_code(500); // Código de respuesta HTTP 500 (Internal Server Error)
                echo json_encode(["error" => "Error al inactivar el producto"]);
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