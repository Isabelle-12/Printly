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
$titulo = trim($_POST['titulo'] ?? '');
$descricao = trim($_POST['descricao'] ?? '');

if ($id <= 0) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Item inválido."
    ]);
    exit;
}

if ($titulo === '') {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "O título não pode ficar vazio."
    ]);
    exit;
}

$sql = "UPDATE portfolio_maker
        SET titulo = ?,
            descricao = ?
        WHERE id = ?
        AND maker_id = ?";

$stmt = $conexao->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Erro no prepare: " . $conexao->error
    ]);
    exit;
}

$stmt->bind_param("ssii", $titulo, $descricao, $id, $makerId);

if ($stmt->execute()) {
    echo json_encode([
        "status" => "ok",
        "mensagem" => "Item do portfólio atualizado com sucesso!"
    ]);
} else {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Erro ao atualizar: " . $stmt->error
    ]);
}

$stmt->close();
$conexao->close();
?>