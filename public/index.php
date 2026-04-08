<?php

$routes = require __DIR__ . '/../config/routes.php';

//pra rota q vc configurou funcionar, troque o nome que esta dentro dessas aspas simples antes do ";"
//pelo nome que vc configurou
$rota = $_GET['rota'] ?? 'home';

if (!isset($routes[$rota])) {
    http_response_code(404);
    echo 'Rota não encontrada.';
    exit;
}

include $routes[$rota];
