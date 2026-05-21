<?php
session_start();
header("Content-type: application/json;charset=utf-8");

include_once __DIR__ . "/../../../../config/conexao.php";

if (!isset($_SESSION['id']) || $_SESSION['tipo'] !== 'MAKER') {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Acesso negado', 'data' => []]);
    exit;
}

$maker_id  = (int) $_SESSION['id'];
$pedido_id = isset($_POST['pedido_id']) ? (int) $_POST['pedido_id'] : 0;

if ($pedido_id <= 0) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Pedido inválido', 'data' => []]);
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

$stmt = $conexao->prepare("UPDATE pedidos SET status = 'ARQUIVO_VALIDADO' WHERE id = ? AND maker_id = ?");
$stmt->bind_param("ii", $pedido_id, $maker_id);

if (!$stmt->execute()) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Erro ao atualizar status', 'data' => []]);
    exit;
}
$stmt->close();

$obs = 'Arquivo 3D validado pelo fabricante. Viável para impressão.';
$msg = 'Seu arquivo foi validado pelo fabricante e está apto para produção.';
$stmt = $conexao->prepare("INSERT INTO historico_status_pedido (pedido_id, status_anterior, status_novo, alterado_por, observacao, mensagem_publica)
                           VALUES (?, ?, 'ARQUIVO_VALIDADO', ?, ?, ?)");
$stmt->bind_param("isiss", $pedido_id, $status_anterior, $maker_id, $obs, $msg);
$stmt->execute();
$stmt->close();

echo json_encode(['status' => 'ok', 'mensagem' => 'Arquivo validado com sucesso', 'data' => []]);

$conexao->close();