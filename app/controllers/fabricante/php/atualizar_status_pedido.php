<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
include_once __DIR__ . '/../../../../config/conexao.php';

if (!isset($_SESSION['id'])) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Não autorizado.']);
    exit;
}

$makerId = (int) $_SESSION['id'];
$dados   = json_decode(file_get_contents('php://input'), true);

$pedidoId    = (int)($dados['id']          ?? 0);
$novoStatus  = trim($dados['status']       ?? '');
$observacao  = trim($dados['observacao']   ?? '');

// Validação de dados
if ($pedidoId <= 0 || !$novoStatus) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Dados inválidos.']);
    exit;
}

// Valores permitidos de status
$statusPermitidos = ['AGUARDANDO_CONFIRMACAO', 'ACEITO', 'EM_PRODUCAO', 'CONCLUIDO', 'ENTREGUE', 'CANCELADO', 'NEGADO'];
if (!in_array($novoStatus, $statusPermitidos)) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Status inválido.']);
    exit;
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $conexao->begin_transaction();

    // 1. Verifica se o pedido pertence ao maker logado e busca dados para notificação
    $stmtBusca = $conexao->prepare(
        "SELECT p.status AS status_atual,
                pr.nome_projeto,
                u.email AS cliente_email,
                u.nome  AS cliente_nome
         FROM pedidos p
         JOIN projetos pr ON pr.id = p.projeto_id
         JOIN usuarios u  ON u.id  = pr.cliente_id
         WHERE p.id = ? AND p.maker_id = ?"
    );
    $stmtBusca->bind_param('ii', $pedidoId, $makerId);
    $stmtBusca->execute();
    $pedido = $stmtBusca->get_result()->fetch_assoc();
    $stmtBusca->close();

    if (!$pedido) {
        throw new Exception('Pedido não encontrado ou sem permissão.');
    }

    $statusAnterior = $pedido['status_atual'];
    $nomeProjeto    = $pedido['nome_projeto'];
    $clienteEmail   = $pedido['cliente_email'];

    // Se o status não mudou, não faz nada
    if ($statusAnterior === $novoStatus) {
        echo json_encode(['status' => 'ok', 'mensagem' => 'Status não alterado (já era o mesmo).']);
        exit;
    }

    // 2. Atualiza o status no pedido — registra data_atualizacao automaticamente via ON UPDATE
    $stmtUpdate = $conexao->prepare(
        "UPDATE pedidos SET status = ?, data_atualizacao = NOW() WHERE id = ? AND maker_id = ?"
    );
    $stmtUpdate->bind_param('sii', $novoStatus, $pedidoId, $makerId);
    $stmtUpdate->execute();
    if ($stmtUpdate->affected_rows === 0) {
        throw new Exception('Nenhuma alteração realizada.');
    }
    $stmtUpdate->close();

    // 3. Registra no histórico de status com data/hora da atualização
    $obsGravada = $observacao ?: null;
    $stmtHist = $conexao->prepare(
        "INSERT INTO historico_status_pedido (pedido_id, status_anterior, status_novo, alterado_por, observacao, data_hora)
         VALUES (?, ?, ?, ?, ?, NOW())"
    );
    $stmtHist->bind_param('issss', $pedidoId, $statusAnterior, $novoStatus, $makerId, $obsGravada);
    $stmtHist->execute();
    $stmtHist->close();

    // 4. Envia notificação ao cliente sobre a atualização
    $labelsStatus = [
        'ACEITO'       => 'Aceito',
        'EM_PRODUCAO'  => 'Em Produção',
        'CONCLUIDO'    => 'Concluído',
        'ENTREGUE'     => 'Entregue',
        'CANCELADO'    => 'Cancelado',
        'NEGADO'       => 'Negado',
        'AGUARDANDO_CONFIRMACAO' => 'Aguardando Confirmação',
    ];
    $labelNovo = $labelsStatus[$novoStatus] ?? $novoStatus;
    $titulo    = "Atualização do Pedido #{$pedidoId}";
    $mensagem  = "O status do seu pedido \"{$nomeProjeto}\" foi atualizado para: {$labelNovo}.";
    if ($observacao) {
        $mensagem .= " Observação do fabricante: {$observacao}";
    }
    $tipo = 'RETIFICACAO';

    $stmtNotif = $conexao->prepare(
        "INSERT INTO notificacoes (tipo, pedido_id, titulo, mensagem, email_destino, data_envio)
         VALUES (?, ?, ?, ?, ?, NOW())"
    );
    $stmtNotif->bind_param('sisss', $tipo, $pedidoId, $titulo, $mensagem, $clienteEmail);
    $stmtNotif->execute();
    $stmtNotif->close();

    $conexao->commit();

    echo json_encode([
        'status'   => 'ok',
        'mensagem' => 'Status atualizado com sucesso!'
    ]);

} catch (Exception $e) {
    $conexao->rollback();
    echo json_encode(['status' => 'nok', 'mensagem' => 'Erro: ' . $e->getMessage()]);
}

$conexao->close();