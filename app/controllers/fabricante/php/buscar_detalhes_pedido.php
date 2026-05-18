<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

include_once(__DIR__ . '/../../../../config/conexao.php');

if (!isset($_SESSION['id'])) {
    echo json_encode(["status" => "nok", "mensagem" => "Usuário não está logado."]);
    exit;
}

$id_fabricante_logado = (int) $_SESSION['id'];
$id_pedido = (int) ($_GET['id'] ?? 0); // Pega o ID que o JS enviou pela URL

if ($id_pedido <= 0) {
    echo json_encode(["status" => "nok", "mensagem" => "ID do pedido inválido."]);
    exit;
}

try {
    // Busca os detalhes exatos desse único pedido
    $sql = "SELECT id, nome_projeto, cliente_nome, material_escolhido, valor_total, arquivo_caminho 
            FROM view_pedidos_completos 
            WHERE id = ? AND maker_id = ?";

    $stmt = $conexao->prepare($sql);

    // Vincula o ID do pedido e o ID do fabricante (segurança para um não ver o pedido do outro)
    $stmt->bind_param("ii", $id_pedido, $id_fabricante_logado);
    $stmt->execute();

    $resultado = $stmt->get_result();

    if ($resultado->num_rows === 0) {
        echo json_encode(["status" => "nok", "mensagem" => "Pedido não encontrado."]);
        exit;
    }

    $pedido = $resultado->fetch_assoc();

    // Devolve o objeto do pedido para o JavaScript preencher o Modal
    echo json_encode($pedido);
} catch (Exception $e) {
    echo json_encode(["status" => "nok", "mensagem" => "Erro ao buscar detalhes: " . $e->getMessage()]);
}

$stmt->close();
$conexao->close();
