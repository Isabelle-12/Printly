<?php
session_start();
header("Content-type: application/json;charset=utf-8");

include_once __DIR__ . "/../../../../config/conexao.php";

if (!isset($_SESSION['id'])) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Usuário não autenticado', 'data' => []]);
    exit;
}

$cliente_id = (int) $_SESSION['id'];
$maker_id   = isset($_POST['maker_id']) ? (int) $_POST['maker_id'] : 0;
$nota       = isset($_POST['nota']) ? (int) $_POST['nota'] : 0;
$comentario = trim($_POST['comentario'] ?? '');

if ($maker_id <= 0 || $nota < 1 || $nota > 5) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Dados inválidos', 'data' => []]);
    exit;
}

$sql = "SELECT p.id FROM pedidos p
        JOIN projetos pr ON pr.id = p.projeto_id
        LEFT JOIN avaliacoes a ON a.pedido_id = p.id
        WHERE pr.cliente_id = ?
          AND p.maker_id = ?
          AND p.status IN ('CONCLUIDO','ENTREGUE')
          AND a.id IS NULL
        ORDER BY p.data_atualizacao DESC
        LIMIT 1";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("ii", $cliente_id, $maker_id);
$stmt->execute();
$resultado = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$resultado) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Você precisa ter um pedido concluído com este fabricante para avaliá-lo', 'data' => []]);
    exit;
}

$pedido_id = (int) $resultado['id'];

$sql = "INSERT INTO avaliacoes (pedido_id, cliente_id, maker_id, nota, comentario) VALUES (?, ?, ?, ?, ?)";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("iiiis", $pedido_id, $cliente_id, $maker_id, $nota, $comentario);

if ($stmt->execute()) {
    echo json_encode(['status' => 'ok', 'mensagem' => 'Feedback enviado com sucesso', 'data' => []]);
} else {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Erro ao salvar feedback', 'data' => []]);
}

$stmt->close();
$conexao->close();