<?php
session_start();
header("Content-type: application/json;charset=utf-8");

include_once __DIR__ . "/../../../../config/conexao.php";

if (!isset($_SESSION['id']) || $_SESSION['tipo'] !== 'MAKER') {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Acesso negado', 'data' => []]);
    exit;
}

$maker_id      = (int) $_SESSION['id'];
$avaliacao_id  = isset($_POST['avaliacao_id']) ? (int) $_POST['avaliacao_id'] : 0;
$resposta      = trim($_POST['resposta'] ?? '');

if ($avaliacao_id <= 0 || $resposta === '') {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Dados inválidos', 'data' => []]);
    exit;
}

$sql = "UPDATE avaliacoes SET resposta_maker = ? WHERE id = ? AND maker_id = ?";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("sii", $resposta, $avaliacao_id, $maker_id);

if ($stmt->execute() && $stmt->affected_rows >= 0) {
    echo json_encode(['status' => 'ok', 'mensagem' => 'Resposta publicada', 'data' => []]);
} else {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Erro ao salvar resposta', 'data' => []]);
}

$stmt->close();
$conexao->close();