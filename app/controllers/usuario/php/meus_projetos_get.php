<?php

session_start();

header('Content-Type: application/json');

ini_set('display_errors', 0);
error_reporting(0);

require_once(__DIR__ . '/../../../../config/conexao.php');

$retorno = [
    'status' => 'erro',
    'mensagem' => ''
];

/*
=========================
VALIDAR SESSÃO
=========================
*/
if (!isset($_SESSION['id'])) {
    $retorno['mensagem'] = 'Usuário não autenticado';
    echo json_encode($retorno);
    exit;
}

try {
    $usuarioId = $_SESSION['id'];

    /*
    =========================
    QUERY PRINCIPAL
    =========================
    Ajustado com ALIASES (AS) para fornecer as chaves exatas que o renderizador
    de cards do seu arquivo JavaScript 'meus_projetos.js' espera ler.
    */
    $sql = "
        SELECT
            id,
            projeto_id,
            nome_projeto,
            descricao,
            formato,
            status AS status_solicitacao,
            valor_total,
            quantidade,
            data_solicitacao,
            prazo_pedido,
            motivo_recusa,
            maker_nome,
            total_partes,
            arquivo_caminho AS imagem_capa
        FROM view_pedidos_completos
        WHERE cliente_id = ?
        ORDER BY data_solicitacao DESC
    ";

    $stmt = $conexao->prepare($sql);

    if (!$stmt) {
        throw new Exception("Erro no prepare da listagem");
    }

    $stmt->bind_param("i", $usuarioId);
    $stmt->execute();

    $resultado = $stmt->get_result();

    $projetos = [];
    while ($row = $resultado->fetch_assoc()) {
        $projetos[] = $row;
    }

    /*
    =========================
    RETORNO SINCRONIZADO
    =========================
    */
    $retorno['status'] = 'sucesso'; // Alinhado com dados.status === 'sucesso'
    $retorno['mensagem'] = 'Projetos listados com sucesso';
    $retorno['projetos'] = $projetos; // Injetado direto na raiz como 'projetos'

} catch (Exception $e) {
    error_log($e->getMessage());
    $retorno['mensagem'] = 'Erro interno no servidor ao carregar listagem.';
}

echo json_encode($retorno);