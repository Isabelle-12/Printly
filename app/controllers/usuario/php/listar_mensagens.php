<?php
session_start();
header("Content-type: application/json;charset=utf-8");

include_once __DIR__ . "/../../../../config/conexao.php";

if (!isset($_SESSION['id'])) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Usuário não autenticado', 'data' => []]);
    exit;
}

$usuario_id = (int) $_SESSION['id'];
$pedido_id  = isset($_GET['pedido_id']) ? (int) $_GET['pedido_id'] : 0;

if ($pedido_id <= 0) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Pedido inválido', 'data' => []]);
    exit;
}

$sql = "SELECT p.maker_id, pr.cliente_id, c.nome AS cliente_nome, m.nome AS maker_nome,
               pr.nome_projeto
        FROM pedidos p
        JOIN projetos pr ON pr.id = p.projeto_id
        JOIN usuarios c  ON c.id = pr.cliente_id
        JOIN usuarios m  ON m.id = p.maker_id
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

if ($usuario_id !== (int) $pedido['cliente_id'] && $usuario_id !== (int) $pedido['maker_id']) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Você não tem acesso a este pedido', 'data' => []]);
    exit;
}

$outro_nome = ($usuario_id === (int) $pedido['cliente_id']) ? $pedido['maker_nome'] : $pedido['cliente_nome'];

$sql = "SELECT m.id, m.remetente_id, m.mensagem, m.lida, m.data_envio, u.nome AS remetente_nome
        FROM mensagens m
        JOIN usuarios u ON u.id = m.remetente_id
        WHERE m.pedido_id = ?
        ORDER BY m.data_envio ASC, m.id ASC";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("i", $pedido_id);
$stmt->execute();
$resultado = $stmt->get_result();

$mensagens = [];
while ($linha = $resultado->fetch_assoc()) {
    $mensagens[] = $linha;
}
$stmt->close();

$stmt = $conexao->prepare("UPDATE mensagens SET lida = 1 WHERE pedido_id = ? AND destinatario_id = ? AND lida = 0");
$stmt->bind_param("ii", $pedido_id, $usuario_id);
$stmt->execute();
$stmt->close();

echo json_encode([
    'status'   => 'ok',
    'mensagem' => 'Mensagens carregadas',
    'data'     => [
        'mensagens'   => $mensagens,
        'meu_id'      => $usuario_id,
        'outro_nome'  => $outro_nome,
        'nome_projeto'=> $pedido['nome_projeto']
    ]
]);

$conexao->close();