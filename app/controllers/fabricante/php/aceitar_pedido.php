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
$valor_total = (float) ($_POST['valor_total'] ?? 0);
$prazo_dias = (int) ($_POST['prazo_dias'] ?? 0);

if ($id_pedido <= 0 || $valor_total <= 0 || $prazo_dias <= 0) {
    echo json_encode(["status" => "nok", "mensagem" => "Dados inválidos enviados."]);
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

    // 2. Atualiza o status do pedido para 'EM_PRODUCAO'
    $sqlUpdate = "UPDATE pedidos 
                  SET status = 'EM_PRODUCAO', valor_total = ?, prazo_pedido = DATE_ADD(NOW(), INTERVAL ? DAY) 
                  WHERE id = ? AND maker_id = ?";
    $stmtUpdate = $conexao->prepare($sqlUpdate);
    $stmtUpdate->bind_param("diii", $valor_total, $prazo_dias, $id_pedido, $makerId);
    $stmtUpdate->execute();

    if ($stmtUpdate->affected_rows === 0) {
        throw new Exception("Nenhuma alteração feita no pedido.");
    }
    $stmtUpdate->close();

    // 3. Insere a notificação usando exatamente as colunas do seu banco
    $tipoNotif = 'RETIFICACAO';
    $tituloNotif = "Pedido Aceito!";
    $msgNotif = "Ótimas notícias! O fabricante aceitou o seu pedido do projeto '{$nomeProjeto}'. O valor final ficou em R$ " . number_format($valor_total, 2, ',', '.') . " com prazo de {$prazo_dias} dias para produção.";
    
    $sqlNotif = "INSERT INTO notificacoes (tipo, pedido_id, titulo, mensagem, email_destino, data_envio) VALUES (?, ?, ?, ?, ?, NOW())";
    $stmtNotif = $conexao->prepare($sqlNotif);
    $stmtNotif->bind_param("sisss", $tipoNotif, $id_pedido, $tituloNotif, $msgNotif, $clienteEmail);
    $stmtNotif->execute();
    $stmtNotif->close();

    $conexao->commit();
    echo json_encode(["status" => "ok", "mensagem" => "Pedido aceito e cliente notificado com sucesso!"]);

} catch (Exception $e) {
    $conexao->rollback();
    echo json_encode(["status" => "nok", "mensagem" => "Erro: " . $e->getMessage()]);
}
?>