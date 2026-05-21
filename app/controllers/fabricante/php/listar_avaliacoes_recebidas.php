<?php
session_start();
header("Content-type: application/json;charset=utf-8");

include_once __DIR__ . "/../../../../config/conexao.php";

if (!isset($_SESSION['id']) || $_SESSION['tipo'] !== 'MAKER') {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Acesso negado', 'data' => []]);
    exit;
}

$maker_id = (int) $_SESSION['id'];

$sql = "SELECT a.id, a.nota, a.comentario, a.resposta_maker, a.data_avaliacao,
               u.nome AS cliente_nome,
               p.id AS pedido_id, pr.nome_projeto
        FROM avaliacoes a
        JOIN usuarios u  ON u.id = a.cliente_id
        JOIN pedidos p   ON p.id = a.pedido_id
        JOIN projetos pr ON pr.id = p.projeto_id
        WHERE a.maker_id = ?
        ORDER BY a.data_avaliacao DESC";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("i", $maker_id);
$stmt->execute();
$resultado = $stmt->get_result();

$avaliacoes = [];
while ($linha = $resultado->fetch_assoc()) {
    $avaliacoes[] = $linha;
}
$stmt->close();

$stmt = $conexao->prepare("SELECT total_avaliacoes, media_nota FROM view_media_avaliacoes_maker WHERE maker_id = ?");
$stmt->bind_param("i", $maker_id);
$stmt->execute();
$media = $stmt->get_result()->fetch_assoc();
$stmt->close();

echo json_encode([
    'status'   => 'ok',
    'mensagem' => 'Avaliações carregadas',
    'data'     => [
        'avaliacoes'       => $avaliacoes,
        'total_avaliacoes' => $media['total_avaliacoes'] ?? 0,
        'media_nota'       => $media['media_nota'] ?? null
    ]
]);

$conexao->close();