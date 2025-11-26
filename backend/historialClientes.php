<?php
require_once 'db.php';

function obtenerHistorialCliente($id_cliente)
{
    global $pdo;
    try {
        $sql = "SELECT 
                    h.id_historial,
                    h.tipo_interaccion,
                    h.fecha,
                    h.observaciones,
                    e.nombre_completo AS empleado
                FROM historial_clientes h
                LEFT JOIN empleados e ON h.id_empleado = e.id_empleado
                WHERE h.id_cliente = :id_cliente
                ORDER BY h.fecha DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id_cliente' => $id_cliente]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return ["error" => $e->getMessage()];
    }
}


function registrarHistorialInteraccion($id_cliente, $tipo_interaccion, $id_empleado, $observaciones = null)
{
    global $pdo;
    try {
        $sql = "INSERT INTO historial_clientes (id_cliente, tipo_interaccion, id_empleado, observaciones)
                VALUES (:id_cliente, :tipo_interaccion, :id_empleado, :observaciones)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id_cliente'       => $id_cliente,
            ':tipo_interaccion' => $tipo_interaccion,
            ':id_empleado'      => $id_empleado,
            ':observaciones'    => $observaciones !== '' ? $observaciones : null
        ]);
        return (int)$pdo->lastInsertId();
    } catch (PDOException $e) {
        return ["error" => $e->getMessage(), "code" => $e->getCode()];
    } catch (Exception $e) {
        return ["error" => $e->getMessage(), "code" => "0"];
    }
}