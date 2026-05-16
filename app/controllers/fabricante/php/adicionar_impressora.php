<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include_once(__DIR__ . '/../../../../config/conexao.php');

if (!isset($_SESSION['id'])) {
    echo json_encode(["status" => "nok", "mensagem" => "Não autorizado."]);
    exit;
}

$maker_id = (int) $_SESSION['id'];
$dados    = json_decode(file_get_contents('php://input'), true);

$modelo    = trim($dados['modelo']    ?? '');
$volume    = !empty($dados['volume'])    ? (float)$dados['volume']    : null;
$quantidade = !empty($dados['quantidade']) ? (int)$dados['quantidade']  : 1;
$tipos     = trim($dados['tipos']     ?? '');

if (!$modelo) {
    echo json_encode(["status" => "nok", "mensagem" => "Informe o modelo da impressora."]);
    exit;
}

$s = $conexao->prepare(
    "INSERT INTO impressoras (maker_id, modelo, tipo_impressora, quantidade, volume_maximo_cm3) VALUES (?, ?, ?, ?, ?)"
);
$s->bind_param("issid", $maker_id, $modelo, $tipos, $quantidade, $volume);

if ($s->execute()) {
    echo json_encode(["status" => "ok", "mensagem" => "Impressora adicionada com sucesso."]);
} else {
    echo json_encode(["status" => "nok", "mensagem" => "Erro ao salvar: " . $s->error]);
}

$s->close();
$conexao->close();