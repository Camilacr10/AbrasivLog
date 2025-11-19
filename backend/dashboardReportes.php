<?php
declare(strict_types=1);
ini_set('display_errors','0'); 
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');
// ─────────────── BORRA CACHE ───────────────
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: 0");


require_once __DIR__ . '/db.php';

try {
  if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('PDO no inicializado; revisa db.php');
  }

  if (!isset($_GET['q'])) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>"Falta parámetro 'q'"], JSON_UNESCAPED_UNICODE);
    exit;
  }

  $q = strtolower(trim($_GET['q']));
  $from = $_GET['from'] ?? null;
  $to   = $_GET['to']   ?? null;

  // filtro opcional de fechas
  $dateFilter = '';
  $params = [];
  if ($from && $to) {
    $dateFilter = " AND e.fecha_entrega BETWEEN :from AND :to ";
    $params = [':from'=>$from, ':to'=>$to];
  } elseif ($from) {
    $dateFilter = " AND e.fecha_entrega >= :from ";
    $params = [':from'=>$from];
  } elseif ($to) {
    $dateFilter = " AND e.fecha_entrega <= :to ";
    $params = [':to'=>$to];
  }

  // -------------------- CONSULTAS --------------------

  if ($q === 'metrics') {
    $ventas = $pdo->query("
      SELECT CAST(SUM(
        (ed.precio_unitario * ed.cantidad)
        - ISNULL(ed.descuento_aplicado,0)
        + ((ed.precio_unitario * ed.cantidad) - ISNULL(ed.descuento_aplicado,0)) * (ed.porcentaje_iva_aplicado/100.0)
      ) AS DECIMAL(18,2)) AS total
      FROM entregas_detalle ed
      INNER JOIN entregas e ON e.id_entrega = ed.id_entrega
    ")->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    $clientes    = $pdo->query("SELECT COUNT(*) AS c FROM clientes")->fetch(PDO::FETCH_ASSOC)['c'];
    $pedidos     = $pdo->query("SELECT COUNT(*) AS c FROM entregas")->fetch(PDO::FETCH_ASSOC)['c'];
    $proveedores = $pdo->query("SELECT COUNT(*) AS c FROM proveedores")->fetch(PDO::FETCH_ASSOC)['c'];

    echo json_encode([
      'ok'=>true,
      'ventasTotales'=>(float)$ventas,
      'totalClientes'=>(int)$clientes,
      'totalPedidos'=>(int)$pedidos,
      'totalProveedores'=>(int)$proveedores
    ], JSON_UNESCAPED_UNICODE);
    exit;
  }

  if ($q === 'top_products') {
    $sql = "
      SELECT TOP 5 p.nombre, SUM(ed.cantidad) AS unidades
      FROM entregas_detalle ed
      INNER JOIN entregas e ON e.id_entrega = ed.id_entrega
      INNER JOIN productos p ON p.id_producto = ed.id_producto
      WHERE 1=1 $dateFilter
      GROUP BY p.nombre
      ORDER BY unidades DESC, p.nombre ASC
    ";
    $st = $pdo->prepare($sql);
    foreach ($params as $k=>$v) $st->bindValue($k, $v);
    $st->execute();
    echo json_encode(['ok'=>true,'data'=>$st->fetchAll(PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
    exit;
  }

  if ($q === 'frequent_clients') {
    $sql = "
      SELECT TOP 5 c.nombre, COUNT(*) AS entregas
      FROM entregas e
      INNER JOIN clientes c ON c.id_cliente = e.id_cliente
      WHERE 1=1 $dateFilter
      GROUP BY c.nombre
      ORDER BY entregas DESC, c.nombre ASC
    ";
    $st = $pdo->prepare($sql);
    foreach ($params as $k=>$v) $st->bindValue($k, $v);
    $st->execute();
    echo json_encode(['ok'=>true,'data'=>$st->fetchAll(PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
    exit;
  }

  if ($q === 'pending_deliveries') {
    $sql = "
      SELECT TOP 20
        c.nombre AS cliente,
        p.nombre AS producto,
        CONVERT(VARCHAR(10), e.fecha_entrega, 103) AS fecha,
        e.estado AS estado
      FROM entregas e
      INNER JOIN entregas_detalle ed ON ed.id_entrega = e.id_entrega
      INNER JOIN clientes c ON c.id_cliente = e.id_cliente
      INNER JOIN productos p ON p.id_producto = ed.id_producto
      WHERE UPPER(e.estado) IN ('PENDIENTE','PENDIENTES')
      ORDER BY e.fecha_entrega ASC
    ";
    echo json_encode(['ok'=>true,'data'=>$pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
    exit;
  }

  // ======= AQUÍ EL CAMBIO: devolver teléfono como "ultimo_pedido" =======
  if ($q === 'top_suppliers') {
    $sql = "
      SELECT TOP 10
        pr.nombre AS proveedor,
        CAST(AVG(CAST(ISNULL(d.puntualidad,0) AS FLOAT)
               + CAST(ISNULL(d.atencion,0) AS FLOAT)
               + CAST(ISNULL(d.disponibilidad,0) AS FLOAT)
          )/3.0 AS DECIMAL(10,2)) AS calificacion,
        pr.telefono AS ultimo_pedido
      FROM proveedores pr
      LEFT JOIN desempeno d ON d.id_proveedor = pr.id_proveedor
      GROUP BY pr.nombre, pr.telefono
      ORDER BY calificacion DESC, pr.nombre ASC
    ";
    $rows = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['ok'=>true,'data'=>$rows], JSON_UNESCAPED_UNICODE);
    exit;
  }
  // ======================================================================

  if ($q === 'all') {
    echo json_encode([
      'ok'=>true,
      'metrics'=>$pdo->query("SELECT COUNT(*) AS total FROM clientes")->fetch(PDO::FETCH_ASSOC)
    ], JSON_UNESCAPED_UNICODE);
    exit;
  }

  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>"Valor de 'q' no reconocido"], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
