<?php

$routes = require __DIR__ . '/../config/routes.php';

$rota = $_GET['rota'] ?? 'admin-notificacoes';

if (!isset($routes[$rota])) {
    http_response_code(404);
    echo 'Rota não encontrada.';
    exit;
}

include $routes[$rota];
