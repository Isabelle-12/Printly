<?php
session_start();
header("Content-type: application/json;charset=utf-8");

include_once __DIR__ . "/../../../../config/conexao.php";

if (!isset($_SESSION['id'])) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Não autenticado', 'data' => []]);
    exit;
}

$usuario_id = (int) $_SESSION['id'];
$pedido_id  = isset($_GET['pedido_id']) ? (int) $_GET['pedido_id'] : 0;

if ($pedido_id <= 0) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Pedido inválido', 'data' => []]);
    exit;
}

$sql = "SELECT p.maker_id, pr.cliente_id
        FROM pedidos p JOIN projetos pr ON pr.id = p.projeto_id
        WHERE p.id = ?";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("i", $pedido_id);
$stmt->execute();
$pedido = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$pedido || ($usuario_id !== (int) $pedido['cliente_id'] && $usuario_id !== (int) $pedido['maker_id'])) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Sem acesso', 'data' => []]);
    exit;
}

$sql = "SELECT status_novo, observacao, mensagem_publica, data_hora
        FROM historico_status_pedido
        WHERE pedido_id = ? AND status_novo IN ('AJUSTES_SOLICITADOS', 'ARQUIVO_VALIDADO')
        ORDER BY data_hora DESC";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("i", $pedido_id);
$stmt->execute();
$resultado = $stmt->get_result();

$historico = [];
while ($linha = $resultado->fetch_assoc()) {
    $historico[] = $linha;
}
$stmt->close();

echo json_encode(['status' => 'ok', 'mensagem' => 'Histórico carregado', 'data' => $historico]);

$conexao->close();