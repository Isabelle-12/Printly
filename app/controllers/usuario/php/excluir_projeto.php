<?php
session_start();
header('Content-Type: application/json');

// Desative em produção, mas mantenha 1 agora para debugar se necessário
ini_set('display_errors', 0); 
error_reporting(0);

require_once(__DIR__ . '/../../../../config/conexao.php');

$retorno = ['status' => 'erro', 'mensagem' => ''];

if (!isset($_SESSION['id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Usuário não autenticado']);
    exit;
}

// Lê o JSON enviado pelo JavaScript
$dados = json_decode(file_get_contents("php://input"), true);

if (!isset($dados['id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID do projeto não recebido']);
    exit;
}

try {
    $usuarioId = $_SESSION['id'];
    $projetoId = intval($dados['id']);

    // 1. Verificar se o projeto pertence ao cliente e se pode ser excluído
    // No seu banco a coluna é cliente_id
    $sqlBusca = "SELECT id, status FROM projetos WHERE id = ? AND cliente_id = ? LIMIT 1";
    $stmtBusca = $conexao->prepare($sqlBusca);
    $stmtBusca->bind_param("ii", $projetoId, $usuarioId);
    $stmtBusca->execute();
    $projeto = $stmtBusca->get_result()->fetch_assoc();

    if (!$projeto) {
        throw new Exception("Projeto não encontrado ou você não tem permissão.");
    }

    // 2. Bloquear exclusão se já houver pedido vinculado (Segurança)
    if ($projeto['status'] === 'COM_PEDIDO' || $projeto['status'] === 'CONCLUIDO') {
        throw new Exception("Este projeto possui pedidos vinculados e não pode ser removido.");
    }

    $conexao->begin_transaction();

    // 3. O seu banco já tem ON DELETE CASCADE em várias tabelas, 
    // mas vamos garantir a limpeza de rascunhos aqui se necessário.
    $sqlDel = "DELETE FROM projetos WHERE id = ? AND cliente_id = ?";
    $stmtDel = $conexao->prepare($sqlDel);
    $stmtDel->bind_param("ii", $projetoId, $usuarioId);
    $stmtDel->execute();

    if ($stmtDel->affected_rows > 0) {
        $conexao->commit();
        $retorno['status'] = 'sucesso';
        $retorno['mensagem'] = 'Projeto removido com sucesso!';
    } else {
        throw new Exception("Não foi possível excluir o registro.");
    }

} catch (Exception $e) {
    if (isset($conexao)) $conexao->rollback();
    $retorno['mensagem'] = $e->getMessage();
}

echo json_encode($retorno);