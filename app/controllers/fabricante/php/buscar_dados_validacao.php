<?php
session_start();
header("Content-type: application/json;charset=utf-8");

include_once __DIR__ . "/../../../../config/conexao.php";

if (!isset($_SESSION['id']) || $_SESSION['tipo'] !== 'MAKER') {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Acesso negado', 'data' => []]);
    exit;
}

$maker_id  = (int) $_SESSION['id'];
$pedido_id = isset($_GET['pedido_id']) ? (int) $_GET['pedido_id'] : 0;

if ($pedido_id <= 0) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Pedido inválido', 'data' => []]);
    exit;
}

$sql = "SELECT p.id, p.status, p.material_escolhido,
               pr.nome_projeto, pr.arquivo_caminho, pr.formato,
               pr.volume_estimado_cm3, pr.peso_estimado_gramas,
               c.nome AS cliente_nome
        FROM pedidos p
        JOIN projetos pr ON pr.id = p.projeto_id
        JOIN usuarios c  ON c.id = pr.cliente_id
        WHERE p.id = ? AND p.maker_id = ?";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("ii", $pedido_id, $maker_id);
$stmt->execute();
$pedido = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$pedido) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Pedido não encontrado ou sem acesso', 'data' => []]);
    exit;
}

$stmt = $conexao->prepare("SELECT id, modelo, volume_maximo_cm3, status FROM impressoras WHERE maker_id = ? ORDER BY volume_maximo_cm3 DESC");
$stmt->bind_param("i", $maker_id);
$stmt->execute();
$resultado = $stmt->get_result();

$impressoras = [];
$volumeMaximo = 0;
while ($linha = $resultado->fetch_assoc()) {
    $impressoras[] = $linha;
    if ((float) $linha['volume_maximo_cm3'] > $volumeMaximo) {
        $volumeMaximo = (float) $linha['volume_maximo_cm3'];
    }
}
$stmt->close();

$stmt = $conexao->prepare("SELECT observacao, mensagem_publica, data_hora
                           FROM historico_status_pedido
                           WHERE pedido_id = ? AND status_novo = 'AJUSTES_SOLICITADOS'
                           ORDER BY data_hora DESC LIMIT 1");
$stmt->bind_param("i", $pedido_id);
$stmt->execute();
$ajuste_pendente = $stmt->get_result()->fetch_assoc();
$stmt->close();

$volumeProjeto = (float) ($pedido['volume_estimado_cm3'] ?? 0);
$incompatibilidade = ($volumeMaximo > 0 && $volumeProjeto > 0 && $volumeProjeto > $volumeMaximo);

echo json_encode([
    'status'   => 'ok',
    'mensagem' => 'Dados carregados',
    'data'     => [
        'pedido'              => $pedido,
        'impressoras'         => $impressoras,
        'volume_maximo'       => $volumeMaximo,
        'volume_projeto'      => $volumeProjeto,
        'incompatibilidade'   => $incompatibilidade,
        'ajuste_pendente'     => $ajuste_pendente,
        'ja_validado'         => ($pedido['status'] === 'ARQUIVO_VALIDADO')
    ]
]);

$conexao->close();