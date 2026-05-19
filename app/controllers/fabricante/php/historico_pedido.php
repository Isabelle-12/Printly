<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
include_once __DIR__ . '/../../../../config/conexao.php';

if (!isset($_SESSION['id'])) {
    echo json_encode(['status' => 'nok', 'data' => []]);
    exit;
}

$makerId  = (int) $_SESSION['id'];
$pedidoId = (int) ($_GET['id'] ?? 0);

if ($pedidoId <= 0) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'ID inválido.', 'data' => []]);
    exit;
}

// Valida que o pedido pertence ao maker
$chk = $conexao->prepare("SELECT id FROM pedidos WHERE id = ? AND maker_id = ?");
$chk->bind_param('ii', $pedidoId, $makerId);
$chk->execute();
$chk->store_result();
if ($chk->num_rows === 0) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Pedido não encontrado.', 'data' => []]);
    exit;
}
$chk->close();

$stmt = $conexao->prepare(
    "SELECT h.status_anterior, h.status_novo, h.observacao, h.data_hora,
            u.nome AS alterado_por_nome
     FROM historico_status_pedido h
     LEFT JOIN usuarios u ON u.id = h.alterado_por
     WHERE h.pedido_id = ?
     ORDER BY h.data_hora DESC"
);
$stmt->bind_param('i', $pedidoId);
$stmt->execute();
$resultado = $stmt->get_result();

$historico = [];
while ($row = $resultado->fetch_assoc()) {
    $historico[] = $row;
}

$stmt->close();
$conexao->close();

echo json_encode(['status' => 'ok', 'data' => $historico]);