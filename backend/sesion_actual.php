<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// 🔍 1. Verificar si hay algo en la sesión
if (empty($_SESSION)) {
    http_response_code(401);
    echo json_encode([
        "ok" => false,
        "message" => "No autenticado (sesión vacía)",
        "session" => $_SESSION  // solo para debug, luego lo puedes quitar
    ]);
    exit;
}

// 🔍 2. Intentar obtener algún nombre de usuario con distintas llaves
$username =
    $_SESSION['username'] ??
    $_SESSION['correo'] ??
    $_SESSION['email'] ??
    $_SESSION['usuario'] ??
    $_SESSION['nombre'] ??
    'Usuario';

// ✅ 3. Responder OK
echo json_encode([
    "ok" => true,
    "username" => $username,
    "session" => $_SESSION // solo para debug, luego lo puedes quitar
]);
