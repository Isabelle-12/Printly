<?php
session_start();
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(0);

require_once(__DIR__ . '/../../../../config/conexao.php');

$retorno = ['status' => 'erro', 'mensagem' => ''];

if (!isset($_SESSION['id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Usuário não autenticado']);
    exit;
}

$pedidoId  = isset($_GET['id']) ? intval($_GET['id']) : 0;
$usuarioId = (int)$_SESSION['id'];

if ($pedidoId <= 0) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID inválido']);
    exit;
}

try {
    /* ── DADOS PRINCIPAIS via view ── */
    $sql = "
        SELECT
            id,
            projeto_id,
            nome_projeto,
            descricao,
            formato,
            status          AS status_solicitacao,
            quantidade,
            valor_total,
            prazo_pedido,
            motivo_recusa   AS feedback_maker,
            arquivo_caminho,
            volume_estimado_cm3,
            peso_estimado_gramas,
            maker_nome,
            maker_email,
            maker_cidade,
            maker_estado
        FROM view_pedidos_completos
        WHERE id = ? AND cliente_id = ?
        LIMIT 1
    ";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param('ii', $pedidoId, $usuarioId);
    $stmt->execute();
    $projeto = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    /* fallback: busca direto em projetos (projeto sem pedido ainda) */
    if (!$projeto) {
        $sql2 = "
            SELECT
                id, id AS projeto_id,
                nome_projeto, descricao, formato, status AS status_solicitacao,
                quantidade, arquivo_caminho, volume_estimado_cm3, peso_estimado_gramas
            FROM projetos
            WHERE id = ? AND cliente_id = ?
            LIMIT 1
        ";
        $stmt2 = $conexao->prepare($sql2);
        $stmt2->bind_param('ii', $pedidoId, $usuarioId);
        $stmt2->execute();
        $projeto = $stmt2->get_result()->fetch_assoc();
        $stmt2->close();
        if (!$projeto) throw new Exception('Projeto não encontrado ou acesso negado.');
    }

    /* ── PARTES DO PEDIDO ── */
    $stmtP = $conexao->prepare("
        SELECT id, nome AS nome_parte, descricao, material, cor,
               quantidade, custo_estimado
        FROM partes_pedido
        WHERE pedido_id = ?
        ORDER BY id ASC
    ");
    $stmtP->bind_param('i', $pedidoId);
    $stmtP->execute();
    $projeto['partes'] = $stmtP->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmtP->close();

    /* ── HISTÓRICO DE STATUS ── */
    $stmtH = $conexao->prepare("
        SELECT
            h.status_anterior,
            h.status_novo,
            h.observacao,
            h.mensagem_publica,
            h.data_hora,
            u.nome AS alterado_por_nome
        FROM historico_status_pedido h
        LEFT JOIN usuarios u ON u.id = h.alterado_por
        WHERE h.pedido_id = ?
        ORDER BY h.data_hora ASC
    ");
    $stmtH->bind_param('i', $pedidoId);
    $stmtH->execute();
    $projeto['historico_real'] = $stmtH->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmtH->close();

    $retorno['status']  = 'sucesso';
    $retorno['projeto'] = $projeto;

} catch (Exception $e) {
    $retorno['mensagem'] = $e->getMessage();
}

echo json_encode($retorno, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);