<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

include_once(__DIR__ . '/../../../../config/conexao.php');

if (!isset($_SESSION['id'])) {
    echo json_encode(["status" => "nok", "mensagem" => "Usuário não está logado."]);
    exit;
}

$makerId = (int) $_SESSION['id'];
$id_pedido = (int) ($_POST['id'] ?? 0);
$motivo_recusa = trim($_POST['motivo_recusa'] ?? '');

if ($id_pedido <= 0 || empty($motivo_recusa)) {
    echo json_encode(["status" => "nok", "mensagem" => "Dados insuficientes para recusar o pedido."]);
    exit;
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $conexao->begin_transaction();

    // 1. Busca o nome do projeto e o e-mail do cliente (dono do projeto)
    $sqlBusca = "SELECT pr.nome_projeto, u.email AS cliente_email 
                 FROM pedidos p 
                 JOIN projetos pr ON p.projeto_id = pr.id 
                 JOIN usuarios u ON pr.cliente_id = u.id
                 WHERE p.id = ?";
    $stmtBusca = $conexao->prepare($sqlBusca);
    $stmtBusca->bind_param("i", $id_pedido);
    $stmtBusca->execute();
    $resBusca = $stmtBusca->get_result()->fetch_assoc();
    $stmtBusca->close();

    if (!$resBusca) {
        throw new Exception("Pedido ou projeto não encontrado.");
    }

    $nomeProjeto = $resBusca['nome_projeto'];
    $clienteEmail = $resBusca['cliente_email'];

    // 2. Atualiza o status do pedido para 'NEGADO'
    $sqlUpdate = "UPDATE pedidos 
                  SET status = 'NEGADO', motivo_recusa = ? 
                  WHERE id = ? AND maker_id = ?";
    $stmtUpdate = $conexao->prepare($sqlUpdate);
    $stmtUpdate->bind_param("sii", $motivo_recusa, $id_pedido, $makerId);
    $stmtUpdate->execute();

    if ($stmtUpdate->affected_rows === 0) {
        throw new Exception("Nenhuma alteração feita no pedido.");
    }
    $stmtUpdate->close();

    // 3. Insere a notificação usando exatamente as colunas do seu banco
    $tipoNotif = 'RETIFICACAO';
    $tituloNotif = "Pedido Recusado";
    $msgNotif = "O seu pedido para o projeto '{$nomeProjeto}' foi recusado pelo fabricante. Motivo informado: {$motivo_recusa}";

    $sqlNotif = "INSERT INTO notificacoes (tipo, pedido_id, titulo, mensagem, email_destino, data_envio) VALUES (?, ?, ?, ?, ?, NOW())";
    $stmtNotif = $conexao->prepare($sqlNotif);
    $stmtNotif->bind_param("sisss", $tipoNotif, $id_pedido, $tituloNotif, $msgNotif, $clienteEmail);
    $stmtNotif->execute();
    $stmtNotif->close();

    $conexao->commit();
    echo json_encode(["status" => "ok", "mensagem" => "Pedido recusado e cliente notificado com sucesso!"]);
} catch (Exception $e) {
    $conexao->rollback();
    echo json_encode(["status" => "nok", "mensagem" => "Erro: " . $e->getMessage()]);
}
