<?php
require 'db.php';
header("Content-Type: application/json");

try {
  $stmt = $pdo->query("SELECT id_rol, nombre FROM roles ORDER BY nombre");
  echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
  echo json_encode(["error" => "Error al obtener roles: " . $e->getMessage()]);
}
?>
