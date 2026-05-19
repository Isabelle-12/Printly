<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
include_once __DIR__ . '/../../../../config/conexao.php';

if (!isset($_SESSION['id'])) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Não autorizado.']);
    exit;
}

$makerId = (int) $_SESSION['id'];

$sql = "SELECT id, nome_projeto, cliente_nome, cliente_email,
               material_escolhido, quantidade, valor_total,
               status, data_solicitacao, data_atualizacao,
               prazo_pedido, endereco_entrega
        FROM view_pedidos_completos
        WHERE maker_id = ?
        ORDER BY data_atualizacao DESC";

$stmt = $conexao->prepare($sql);
if (!$stmt) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Erro no prepare: ' . $conexao->error]);
    exit;
}

$stmt->bind_param('i', $makerId);
$stmt->execute();
$resultado = $stmt->get_result();

$pedidos = [];
while ($row = $resultado->fetch_assoc()) {
    $pedidos[] = $row;
}

$stmt->close();
$conexao->close();

echo json_encode(['status' => 'ok', 'data' => $pedidos]);