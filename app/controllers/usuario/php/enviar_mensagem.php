<?php
session_start();
header("Content-type: application/json;charset=utf-8");

include_once __DIR__ . "/../../../../config/conexao.php";

if (!isset($_SESSION['id'])) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Usuário não autenticado', 'data' => []]);
    exit;
}

$remetente_id = (int) $_SESSION['id'];
$pedido_id    = isset($_POST['pedido_id']) ? (int) $_POST['pedido_id'] : 0;
$mensagem     = trim($_POST['mensagem'] ?? '');

if ($pedido_id <= 0 || $mensagem === '') {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Dados inválidos', 'data' => []]);
    exit;
}

if (mb_strlen($mensagem) > 1000) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Mensagem muito longa (máx. 1000 caracteres)', 'data' => []]);
    exit;
}

$sql = "SELECT p.maker_id, pr.cliente_id
        FROM pedidos p
        JOIN projetos pr ON pr.id = p.projeto_id
        WHERE p.id = ?";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("i", $pedido_id);
$stmt->execute();
$pedido = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$pedido) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Pedido não encontrado', 'data' => []]);
    exit;
}

$destinatario_id = null;
if ($remetente_id === (int) $pedido['cliente_id']) {
    $destinatario_id = (int) $pedido['maker_id'];
} elseif ($remetente_id === (int) $pedido['maker_id']) {
    $destinatario_id = (int) $pedido['cliente_id'];
} else {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Você não tem acesso a este pedido', 'data' => []]);
    exit;
}

$sql = "INSERT INTO mensagens (pedido_id, remetente_id, destinatario_id, mensagem) VALUES (?, ?, ?, ?)";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("iiis", $pedido_id, $remetente_id, $destinatario_id, $mensagem);

if ($stmt->execute()) {
    $id_inserido = $stmt->insert_id;
    echo json_encode(['status' => 'ok', 'mensagem' => 'Mensagem enviada', 'data' => ['id' => $id_inserido]]);
} else {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Erro ao enviar mensagem', 'data' => []]);
}

$stmt->close();
$conexao->close();