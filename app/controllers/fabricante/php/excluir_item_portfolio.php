<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

include_once(__DIR__ . '/../../../../config/conexao.php');

if (!isset($_SESSION['id'])) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Usuário não está logado."
    ]);
    exit;
}

$makerId = (int) $_SESSION['id'];
$id = (int) ($_POST['id'] ?? 0);

if ($id <= 0) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Item inválido."
    ]);
    exit;
}

/*
    Primeiro busca o caminho da imagem para apagar o arquivo físico também.
*/
$sqlBusca = "SELECT caminho_imagem 
             FROM portfolio_maker
             WHERE id = ?
             AND maker_id = ?";

$stmtBusca = $conexao->prepare($sqlBusca);

if (!$stmtBusca) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Erro no prepare busca: " . $conexao->error
    ]);
    exit;
}

$stmtBusca->bind_param("ii", $id, $makerId);
$stmtBusca->execute();
$resultado = $stmtBusca->get_result();

if ($resultado->num_rows === 0) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Item não encontrado ou não pertence a este fabricante."
    ]);
    exit;
}

$item = $resultado->fetch_assoc();
$caminhoImagem = $item['caminho_imagem'];

$stmtBusca->close();

$sqlDelete = "DELETE FROM portfolio_maker
              WHERE id = ?
              AND maker_id = ?";

$stmtDelete = $conexao->prepare($sqlDelete);

if (!$stmtDelete) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Erro no prepare delete: " . $conexao->error
    ]);
    exit;
}

$stmtDelete->bind_param("ii", $id, $makerId);

if ($stmtDelete->execute()) {
    $arquivoFisico = __DIR__ . '/../../../../' . $caminhoImagem;

    if (file_exists($arquivoFisico)) {
        unlink($arquivoFisico);
    }

    echo json_encode([
        "status" => "ok",
        "mensagem" => "Item excluído com sucesso!"
    ]);
} else {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Erro ao excluir: " . $stmtDelete->error
    ]);
}

$stmtDelete->close();
$conexao->close();
?>