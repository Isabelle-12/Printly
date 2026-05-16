<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include_once(__DIR__ . '/../../../../config/conexao.php');

if (!isset($_SESSION['id'])) {
    echo json_encode(["status" => "nok", "mensagem" => "Não autorizado."]);
    exit;
}

$maker_id = (int) $_SESSION['id'];
$dados    = json_decode(file_get_contents('php://input'), true);

$id        = (int)($dados['id']        ?? 0);
$modelo    = trim($dados['modelo']     ?? '');
$volume    = !empty($dados['volume'])    ? (float)$dados['volume']    : null;
$quantidade = !empty($dados['quantidade']) ? (int)$dados['quantidade']  : 1;
$tipos     = trim($dados['tipos']      ?? '');

if (!$id || !$modelo) {
    echo json_encode(["status" => "nok", "mensagem" => "Dados inválidos."]);
    exit;
}

// Garante que a impressora pertence ao maker logado
$chk = $conexao->prepare("SELECT id FROM impressoras WHERE id = ? AND maker_id = ?");
$chk->bind_param("ii", $id, $maker_id);
$chk->execute();
$chk->store_result();
if ($chk->num_rows === 0) {
    echo json_encode(["status" => "nok", "mensagem" => "Impressora não encontrada."]);
    exit;
}
$chk->close();

$s = $conexao->prepare(
    "UPDATE impressoras SET modelo = ?, tipo_impressora = ?, quantidade = ?, volume_maximo_cm3 = ? WHERE id = ? AND maker_id = ?"
);
$s->bind_param("ssiidi", $modelo, $tipos, $quantidade, $volume, $id, $maker_id);

if ($s->execute()) {
    echo json_encode(["status" => "ok", "mensagem" => "Impressora atualizada com sucesso."]);
} else {
    echo json_encode(["status" => "nok", "mensagem" => "Erro ao atualizar: " . $s->error]);
}

$s->close();
$conexao->close();