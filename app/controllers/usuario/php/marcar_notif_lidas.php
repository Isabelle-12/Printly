<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
include_once '../../../../config/conexao.php';

$email = $_SESSION['email'] ?? null;

if (!$email) {
    echo json_encode(["status" => "nok"]);
    exit;
}

$stmt = $conexao->prepare(
    "UPDATE notificacoes SET lida = TRUE WHERE email_destino = ? AND lida = FALSE"
);
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->close();
$conexao->close();

echo json_encode(["status" => "ok"]);