<?php
session_start();
header("Content-type: application/json;charset=utf-8");

include_once __DIR__ . "/../../../../config/conexao.php";

if (!isset($_SESSION['id'])) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Usuário não autenticado', 'data' => []]);
    exit;
}

$cliente_id = (int) $_SESSION['id'];

$sql = "SELECT a.id, a.nota, a.comentario, a.resposta_maker, a.data_avaliacao,
               u.id AS maker_id, u.nome AS maker_nome, f.nome_empresa
        FROM avaliacoes a
        JOIN usuarios u ON u.id = a.maker_id
        LEFT JOIN fabricantes f ON f.usuario_id = u.id
        WHERE a.cliente_id = ?
        ORDER BY a.data_avaliacao DESC";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("i", $cliente_id);
$stmt->execute();
$resultado = $stmt->get_result();

$avaliacoes = [];
while ($linha = $resultado->fetch_assoc()) {
    $avaliacoes[] = $linha;
}
$stmt->close();

echo json_encode(['status' => 'ok', 'mensagem' => 'Suas avaliações carregadas', 'data' => $avaliacoes]);

$conexao->close();