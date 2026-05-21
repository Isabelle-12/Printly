<?php
session_start();
header("Content-type: application/json;charset=utf-8");

include_once __DIR__ . "/../../../../config/conexao.php";

if (!isset($_SESSION['id']) || $_SESSION['tipo'] !== 'MAKER') {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Acesso negado', 'data' => []]);
    exit;
}

$maker_id   = (int) $_SESSION['id'];
$pedido_id  = isset($_POST['pedido_id']) ? (int) $_POST['pedido_id'] : 0;
$descricao  = trim($_POST['descricao'] ?? '');

if ($pedido_id <= 0 || $descricao === '') {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Descreva o problema técnico', 'data' => []]);
    exit;
}

$stmt = $conexao->prepare("SELECT status FROM pedidos WHERE id = ? AND maker_id = ?");
$stmt->bind_param("ii", $pedido_id, $maker_id);
$stmt->execute();
$pedido = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$pedido) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Pedido não encontrado', 'data' => []]);
    exit;
}

$status_anterior = $pedido['status'];
$msg_publica = 'O fabricante solicitou ajustes no arquivo: ' . $descricao;

$stmt = $conexao->prepare("INSERT INTO historico_status_pedido (pedido_id, status_anterior, status_novo, alterado_por, observacao, mensagem_publica)
                           VALUES (?, ?, 'AJUSTES_SOLICITADOS', ?, ?, ?)");
$stmt->bind_param("isiss", $pedido_id, $status_anterior, $maker_id, $descricao, $msg_publica);

if ($stmt->execute()) {
    echo json_encode(['status' => 'ok', 'mensagem' => 'Solicitação de ajustes enviada ao cliente. A produção está bloqueada até o envio de um novo arquivo.', 'data' => []]);
} else {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Erro ao registrar solicitação', 'data' => []]);
}

$stmt->close();
$conexao->close();