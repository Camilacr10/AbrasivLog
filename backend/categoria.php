<?php
declare(strict_types=1);
ini_set('display_errors','0'); error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db.php'; 

try {
  if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('PDO no inicializado; revisa backend/db.php');
  }

  $slug = isset($_GET['cat']) ? trim($_GET['cat']) : '';
  if ($slug === '') {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'Falta cat'], JSON_UNESCAPED_UNICODE);
    exit;
  }

  $sql = "
    SELECT
      p.id_producto,
      p.nombre,
      p.codigo,                 -- NECESARIO para armar el link a detalle
      p.imagen_path,
      p.precio_base,
      p.porcentaje_iva,
      p.porcentaje_descuento,
      p.iva,
      p.precio_final,
      p.cantidad,
      p.estado,
      ISNULL(i.existencia,0) AS existencia,
      c.nombre AS categoria
    FROM productos p
    JOIN categorias c ON c.id_categoria = p.id_categoria
    LEFT JOIN inventario i ON i.id_producto = p.id_producto
    WHERE c.slug = :slug
    ORDER BY p.nombre
  ";
  $st = $pdo->prepare($sql);
  $st->execute([':slug' => $slug]);
  $rows = $st->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode(['ok'=>true,'data'=>$rows], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
