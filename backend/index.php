<?php
// backend/index.php
declare(strict_types=1);

// ─────────────── BORRA CACHE ───────────────


header('Content-Type: application/json; charset=utf-8');

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: 0");



ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

try {
    require_once __DIR__ . '/db.php';  

    if (!isset($pdo) || !($pdo instanceof PDO)) {
        throw new RuntimeException('PDO no inicializado; revisa backend/db.php');
    }

   
    $sql = "
        SELECT nombre, slug, icono_path
        FROM categorias
        ORDER BY CASE WHEN slug='broca' THEN 0 ELSE 1 END, nombre
    ";
    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$r) {
        if (empty($r['icono_path'])) {
            $r['icono_path'] = '../IMG/placeholder.png'; 
        }
    }

    echo json_encode(['ok' => true, 'data' => $rows], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
