<?php
header("Content-type: application/json;charset=utf-8");

include_once __DIR__ . "/../../../../config/conexao.php";

$maker_id = isset($_GET['maker_id']) ? (int) $_GET['maker_id'] : 0;

if ($maker_id <= 0) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Maker inválido', 'data' => []]);
    exit;
}

$sql = "SELECT a.id, a.nota, a.comentario, a.resposta_maker, a.data_avaliacao, u.nome AS cliente_nome
        FROM avaliacoes a
        JOIN usuarios u ON u.id = a.cliente_id
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