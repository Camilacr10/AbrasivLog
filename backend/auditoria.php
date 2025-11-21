<?php
// Archivo: backend/auditoria.php
// Guarda una acción en la tabla auditoria_general

require_once __DIR__ . "/db.php";
session_start();




function registrarAuditoria($tabla, $id_registro, $accion, $detalle = null)
{
    global $pdo;
    if (!$pdo)
        return;

    try {
        $usuario = $_SESSION['user']['id_usuario'] ?? null;

        $sql = "INSERT INTO auditoria_general (tabla, id_registro, accion, id_usuario, detalle)
                VALUES (:tabla, :id_registro, :accion, :id_usuario, :detalle)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':tabla' => $tabla,
            ':id_registro' => $id_registro,
            ':accion' => $accion,
            ':id_usuario' => $usuario,
            ':detalle' => $detalle
        ]);
    } catch (Exception $e) {
        error_log("Error en auditoría: " . $e->getMessage());
    }
}