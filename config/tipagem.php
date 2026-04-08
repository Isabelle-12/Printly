<?php
session_start();
$resposta = [];

if (!isset($_SESSION['tipo'])) {
    echo json_encode([
        "tipo" => false
    ]);
    exit;
}

$resposta = [ 
    "tipo" => true,
    "tipos" => $_SESSION['tipo']
];
    
header("Content-Type: application/json; charset=UTF-8");
echo json_encode($resposta);
