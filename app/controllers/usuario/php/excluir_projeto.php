<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Desative em produção, mas mantenha 0 agora para evitar vazamentos no JSON
ini_set('display_errors', 0); 
error_reporting(0);

require_once(__DIR__ . '/../../../../config/conexao.php');

$retorno = ['status' => 'erro', 'mensagem' => ''];

/*
=========================
VALIDAR E ADAPTAR SESSÃO
=========================
*/
if (!isset($_SESSION['email']) || !isset($_SESSION['id'])) {
    $retorno['mensagem'] = 'Sessão expirada ou usuário não autenticado.';
    echo json_encode($retorno, JSON_UNESCAPED_UNICODE);
    exit;
}

// Sincroniza dinamicamente a chave exigida pelo ecossistema Printly
if (!isset($_SESSION['usuario_email'])) {
    $_SESSION['usuario_email'] = $_SESSION['email'];
}

// Lê o JSON enviado pelo JavaScript
$dados = json_decode(file_get_contents("php://input"), true);

if (!isset($dados['id'])) {
    $retorno['mensagem'] = 'ID do projeto não recebido.';
    echo json_encode($retorno, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $usuarioId = (int)$_SESSION['id']; // ID numérico vindo do login legado
    $projetoId = intval($dados['id']);

    /*
    ==================================================
    1. VERIFICAR PROPRIEDADE E TRAVA DE SEGURANÇA
    ==================================================
    */
    $sqlBusca = "SELECT id, status FROM projetos WHERE id = ? AND cliente_id = ? LIMIT 1";
    $stmtBusca = $conexao->prepare($sqlBusca);
    $stmtBusca->bind_param("ii", $projetoId, $usuarioId);
    $stmtBusca->execute();
    $projeto = $stmtBusca->get_result()->fetch_assoc();
    $stmtBusca->close();

    if (!$projeto) {
        throw new Exception("Projeto não encontrado ou você não tem permissão para excluí-lo.");
    }

    // Bloquear exclusão se o projeto já passou da fase de rascunho/solicitação inicial
    $statusAtual = strtoupper(trim($projeto['status']));
    if ($statusAtual === 'COM_PEDIDO' || $statusAtual === 'EM_PRODUCAO' || $statusAtual === 'CONCLUIDO') {
        throw new Exception("Este projeto possui ordens de serviço vinculadas em andamento e não pode ser removido.");
    }

    $conexao->begin_transaction();

    /*
    ==================================================
    2. EXECUÇÃO DA EXCLUSÃO (Cascateamento controlado)
    ==================================================
    Mesmo que o seu banco possua ON DELETE CASCADE, fazemos a remoção limpa
    do registro pai na tabela projetos.
    */
    $sqlDel = "DELETE FROM projetos WHERE id = ? AND cliente_id = ?";
    $stmtDel = $conexao->prepare($sqlDel);
    $stmtDel->bind_param("ii", $projetoId, $usuarioId);
    $stmtDel->execute();

    if ($stmtDel->affected_rows > 0) {
        $conexao->commit();
        $retorno['status'] = 'sucesso';
        $retorno['mensagem'] = 'Projeto removido com sucesso!';
    } else {
        throw new Exception("Não foi possível excluir o registro do banco de dados.");
    }
    $stmtDel->close();

} catch (Exception $e) {
    if (isset($conexao) && $conexao->ping()) {
        $conexao->rollback();
    }
    error_log("Erro em excluir_projeto.php: " . $e->getMessage());
    $retorno['status'] = 'erro';
    $retorno['mensagem'] = $e->getMessage();
}

echo json_encode($retorno, JSON_UNESCAPED_UNICODE);