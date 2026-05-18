<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

// Caminho perfeito que você já usa nos outros arquivos
include_once(__DIR__ . '/../../../../config/conexao.php');

if (!isset($_SESSION['id'])) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Usuário não está logado."
    ]);
    exit;
}

$id_fabricante_logado = (int) $_SESSION['id'];

// DESCOMENTE A LINHA ABAIXO SE QUISER TESTAR DIRETO NO NAVEGADOR
// $id_fabricante_logado = 2; // ID da Maria Souza (Maker) do seu script

try {
    // Busca na VIEW (onde estão agrupados o nome do projeto e cliente)
    $sql = "SELECT id, nome_projeto, cliente_nome, data_solicitacao, valor_total 
            FROM view_pedidos_completos 
            WHERE status = 'AGUARDANDO_CONFIRMACAO' AND maker_id = ?";

    $stmt = $conexao->prepare($sql);

    if (!$stmt) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Erro no prepare: " . $conexao->error
        ]);
        exit;
    }

    $stmt->bind_param("i", $id_fabricante_logado);
    $stmt->execute();

    $resultado = $stmt->get_result();

    // Retorna todos os pedidos encontrados num array
    $pedidos = $resultado->fetch_all(MYSQLI_ASSOC);

    echo json_encode($pedidos);
} catch (Exception $e) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Erro ao buscar pedidos: " . $e->getMessage()
    ]);
}

$stmt->close();
$conexao->close();
