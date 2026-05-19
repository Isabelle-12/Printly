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
VALIDAR E ADAPTAR SESSÃO
=========================
*/
if (!isset($_SESSION['email']) || !isset($_SESSION['id'])) {
    $retorno['mensagem'] = 'Usuário não autenticado';
    echo json_encode($retorno);
    exit;
}

// Sincroniza a chave exigida pelo sistema Printly sem alterar o login.php
if (!isset($_SESSION['usuario_email'])) {
    $_SESSION['usuario_email'] = $_SESSION['email'];
}

try {
    // Como o login já fornece o ID, usamos direto para maior performance
    $usuarioId = (int)$_SESSION['id'];

    /*
    =========================
    QUERY PRINCIPAL
    =========================
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
            arquivo_caminho
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

    $stmt->close();

    /*
    =========================
    RETORNO SINCRONIZADO
    =========================
    */
    $retorno['status'] = 'sucesso';
    $retorno['mensagem'] = 'Projetos listados com sucesso';
    $retorno['projetos'] = $projetos;

} catch (Exception $e) {
    error_log("Erro em meus_projetos_get.php: " . $e->getMessage());
    $retorno['status'] = 'erro';
    $retorno['mensagem'] = 'Erro interno no servidor ao carregar listagem.';
}

echo json_encode($retorno);