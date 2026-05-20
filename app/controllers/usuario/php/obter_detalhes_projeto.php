<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(0);

require_once(__DIR__ . '/../../../../config/conexao.php');

$retorno = ['status' => 'erro', 'mensagem' => ''];

if (!isset($_SESSION['email']) || !isset($_SESSION['id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Usuário não autenticado'], JSON_UNESCAPED_UNICODE);
    exit;
}

$pedidoId  = isset($_GET['id']) ? intval($_GET['id']) : 0;
$usuarioId = (int)$_SESSION['id'];

if ($pedidoId <= 0) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID inválido'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {

    $sql = "
        SELECT
            p.id,
            p.projeto_id,

            pr.nome_projeto,
            pr.descricao,
            pr.formato,

            p.status AS status_solicitacao,
            p.quantidade,
            p.valor_total,
            p.prazo_pedido,
            p.motivo_recusa AS feedback_maker,
            p.endereco_entrega,

            COALESCE(p.arquivo_caminho, pr.arquivo_caminho) AS imagem_capa,

            pr.arquivo_caminho AS arquivo_3d,
            pr.volume_estimado_cm3,
            pr.peso_estimado_gramas,

            m.nome AS maker_nome,
            m.email AS maker_email,
            m.cidade AS maker_cidade,
            m.estado AS maker_estado

        FROM pedidos p
        JOIN projetos pr ON pr.id = p.projeto_id
        JOIN usuarios c ON c.id = pr.cliente_id
        LEFT JOIN usuarios m ON m.id = p.maker_id

        WHERE p.id = ? AND c.id = ?
        LIMIT 1
    ";

    $stmt = $conexao->prepare($sql);
    if (!$stmt) throw new Exception('Erro ao preparar consulta principal.');

    $stmt->bind_param('ii', $pedidoId, $usuarioId);
    $stmt->execute();
    $projeto = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    /* fallback */
    if (!$projeto) {

        $sql2 = "
            SELECT
                id,
                id AS projeto_id,
                nome_projeto,
                descricao,
                formato,
                'SEM_PEDIDO' AS status_solicitacao,
                quantidade,

                arquivo_caminho AS arquivo_3d,
                NULL AS imagem_capa,
                '' AS endereco_entrega,

                volume_estimado_cm3,
                peso_estimado_gramas
            FROM projetos
            WHERE id = ? AND cliente_id = ?
            LIMIT 1
        ";

        $stmt2 = $conexao->prepare($sql2);
        if (!$stmt2) throw new Exception('Erro no fallback.');

        $stmt2->bind_param('ii', $pedidoId, $usuarioId);
        $stmt2->execute();
        $projeto = $stmt2->get_result()->fetch_assoc();
        $stmt2->close();

        if (!$projeto) {
            throw new Exception('Projeto não encontrado ou acesso negado.');
        }
    }

    /* PARTES */
    $stmtP = $conexao->prepare("
        SELECT id, nome AS nome_parte, descricao, material, cor, quantidade, custo_estimado
        FROM partes_pedido
        WHERE pedido_id = ?
        ORDER BY id ASC
    ");

    if ($stmtP) {
        $stmtP->bind_param('i', $pedidoId);
        $stmtP->execute();
        $projeto['partes'] = $stmtP->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmtP->close();
    } else {
        $projeto['partes'] = [];
    }

    /* HISTÓRICO */
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

    if ($stmtH) {
        $stmtH->bind_param('i', $pedidoId);
        $stmtH->execute();
        $projeto['historico_real'] = $stmtH->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmtH->close();
    } else {
        $projeto['historico_real'] = [];
    }

    $retorno['status'] = 'sucesso';
    $retorno['projeto'] = $projeto;

} catch (Exception $e) {
    error_log("Erro obter_detalhes_projeto: " . $e->getMessage());
    $retorno['status'] = 'erro';
    $retorno['mensagem'] = $e->getMessage();
}

echo json_encode($retorno, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);