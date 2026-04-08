<?php
session_start();

if (!isset($_SESSION['email'])) {
    echo json_encode([
        "logado" => false
    ]);
    exit;
}

header("Content-Type: application/json; charset=UTF-8");
echo json_encode([
    "logado" => true,
    "email" => $_SESSION['email']

]);
