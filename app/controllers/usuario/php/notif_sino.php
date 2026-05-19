<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
include_once '../../../../config/conexao.php';

$email = $_SESSION['email'] ?? null;

if (!$email) {
    echo json_encode(["status" => "nok", "nao_lidas" => 0, "data" => []]);
    exit;
}

$stmt = $conexao->prepare(
    "SELECT id, titulo, mensagem, data_envio, lida
     FROM notificacoes
     WHERE email_destino = ? AND retratada = FALSE
     ORDER BY data_envio DESC
     LIMIT 10"
);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

$notifs = [];
$nao_lidas = 0;
while ($row = $result->fetch_assoc()) {
    if (!$row['lida']) $nao_lidas++;
    $notifs[] = $row;
}
$stmt->close();
$conexao->close();

echo json_encode(["status" => "ok", "nao_lidas" => $nao_lidas, "data" => $notifs]);