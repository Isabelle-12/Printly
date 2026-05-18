<?php
session_start();
header('Content-Type: application/json');

ini_set('display_errors', 0); // Mude para 1 se quiser ver o erro exato no Console > Network
error_reporting(E_ALL);

require_once(__DIR__ . '/../../../../config/conexao.php');

$retorno = ['status' => 'erro', 'mensagem' => ''];

if (!isset($_SESSION['id'])) {
    $retorno['mensagem'] = 'Usuário não autenticado';
    echo json_encode($retorno);
    exit;
}

// Detalhes geralmente vêm via GET: obter_detalhes.php?id=123
$pedidoId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($pedidoId <= 0) {
    $retorno['mensagem'] = 'ID do projeto inválido';
    echo json_encode($retorno);
    exit;
}

try {
    $usuarioId = $_SESSION['id'];

    // SQL Ajustado para as colunas REAIS da sua view_pedidos_completos
    $sqlProjeto = "
        SELECT 
            id,
            nome_projeto,
            descricao,
            formato,
            status AS status_solicitacao,
            quantidade,
            volume_estimado_cm3,
            peso_estimado_gramas,
            arquivo_caminho AS caminho_arquivo,
            motivo_recusa AS feedback_maker 
        FROM view_pedidos_completos
        WHERE id = ?
        AND cliente_id = ?
        LIMIT 1
    ";

    $stmtProjeto = $conexao->prepare($sqlProjeto);
    $stmtProjeto->bind_param("ii", $pedidoId, $usuarioId);
    $stmtProjeto->execute();
    $projeto = $stmtProjeto->get_result()->fetch_assoc();

    if (!$projeto) {
        // Se não achou na view de pedidos, pode ser um projeto que ainda não virou pedido
        // Vamos buscar na tabela projetos direto
        $sqlAvulso = "SELECT id, nome_projeto, descricao, formato, status as status_solicitacao, 
                             arquivo_caminho as caminho_arquivo, volume_estimado_cm3, peso_estimado_gramas 
                      FROM projetos WHERE id = ? AND cliente_id = ?";
        $stmtAvulso = $conexao->prepare($sqlAvulso);
        $stmtAvulso->bind_param("ii", $pedidoId, $usuarioId);
        $stmtAvulso->execute();
        $projeto = $stmtAvulso->get_result()->fetch_assoc();
        
        if (!$projeto) {
            throw new Exception("Projeto não encontrado ou acesso negado.");
        }
    }

    // Buscar Partes (tabela partes_pedido)
    $sqlPartes = "SELECT id, nome AS nome_parte, descricao, material, cor, quantidade AS infill 
                  FROM partes_pedido WHERE pedido_id = ?";
    $stmtPartes = $conexao->prepare($sqlPartes);
    $stmtPartes->bind_param("i", $pedidoId);
    $stmtPartes->execute();
    $projeto['partes'] = $stmtPartes->get_result()->fetch_all(MYSQLI_ASSOC);

    // Buscar Histórico
    $sqlHist = "SELECT status_anterior, status_novo, mensagem_publica, data_hora 
                FROM historico_status_pedido WHERE pedido_id = ? ORDER BY data_hora ASC";
    $stmtHist = $conexao->prepare($sqlHist);
    $stmtHist->bind_param("i", $pedidoId);
    $stmtHist->execute();
    $projeto['historico_real'] = $stmtHist->get_result()->fetch_all(MYSQLI_ASSOC);

    $retorno['status'] = 'sucesso';
    $retorno['projeto'] = $projeto;

} catch (Exception $e) {
    $retorno['mensagem'] = $e->getMessage();
}

echo json_encode($retorno);