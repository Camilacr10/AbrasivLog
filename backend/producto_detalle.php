<?php
// /backend/producto_detalle.php
declare(strict_types=1);
ini_set('display_errors','0'); error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db.php'; 

try {
    if (!isset($pdo) || !($pdo instanceof PDO)) {
        throw new RuntimeException('PDO no inicializado; revisa backend/db.php');
    }

    $codigo = isset($_GET['codigo']) ? trim($_GET['codigo']) : null;
    $cat    = isset($_GET['cat'])    ? trim($_GET['cat'])    : null;

    if (!$codigo && !$cat) {
        http_response_code(400);
        echo json_encode(['ok'=>false,'error'=>'Falta parametro codigo o cat'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    
    $where = $codigo ? 'p.codigo = :codigo' : 'c.slug = :slug';
    $params = $codigo ? [':codigo'=>$codigo] : [':slug'=>$cat];
    $top = $codigo ? '' : 'TOP 1';

    $sql = "
      SELECT $top
        p.id_producto,
        p.nombre,
        p.codigo,
        ISNULL(p.detalle,'')             AS detalle,
        ISNULL(p.imagen_path,'')         AS imagen_path,
        ISNULL(p.precio_base,0)          AS precio_base,
        ISNULL(p.porcentaje_descuento,0) AS porcentaje_descuento,
        ISNULL(p.iva,0)                  AS iva,
        ISNULL(p.porcentaje_iva,0)       AS porcentaje_iva,
        ISNULL(p.precio_final,0)         AS precio_final,
        c.nombre                         AS categoria,
        c.slug                           AS categoria_slug,
        ISNULL(i.existencia, ISNULL(p.cantidad,0)) AS existencia
      FROM productos p
      JOIN categorias c ON c.id_categoria = p.id_categoria
      LEFT JOIN inventario i ON i.id_producto = p.id_producto
      WHERE $where
      ".($codigo ? "" : "ORDER BY p.nombre")."
    ";

    $st = $pdo->prepare($sql);
    $st->execute($params);
    $row = $st->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode(['ok'=>false,'error'=>'Producto no encontrado'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode(['ok'=>true,'data'=>$row], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
