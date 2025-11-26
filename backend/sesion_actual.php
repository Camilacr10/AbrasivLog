<?php
session_start();
header('Content-Type: application/json; charset=utf-8');


if (empty($_SESSION)) {
    http_response_code(401);
    echo json_encode([
        "ok" => false,
        "message" => "No autenticado (sesión vacía)",
        "session" => $_SESSION 
    ]);
    exit;
}

$username =
    $_SESSION['username'] ??
    $_SESSION['correo'] ??
    $_SESSION['email'] ??
    $_SESSION['usuario'] ??
    $_SESSION['nombre'] ??
    'Usuario';

echo json_encode([
    "ok" => true,
    "username" => $username,
    "session" => $_SESSION 
]);
