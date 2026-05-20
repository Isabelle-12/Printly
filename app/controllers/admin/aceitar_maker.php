<?php

session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../../config/conexao.php';

$retorno = [
    "status" => "",
    "mensagem" => ""
];

/*
=========================
VALIDAR ADMIN
=========================
*/
if (
    !isset($_SESSION['tipo']) ||
    $_SESSION['tipo'] !== 'ADMIN'
) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Sem permissão."
    ]);
    exit;
}

/*
=========================
VALIDAR USUÁRIO
=========================
*/
$usuario_id = isset($_POST['usuario_id'])
    ? (int) $_POST['usuario_id']
    : 0;

if ($usuario_id <= 0) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "usuario_id inválido."
    ]);
    exit;
}

/*
=========================
APROVAR MAKER
=========================
*/
$stmt = $conexao->prepare("
    UPDATE usuarios
    SET
        tipo_perfil = 'MAKER',
        status_fabricante = 'APROVADO',
        status = 'ATIVO'
    WHERE id = ?
");

if (!$stmt) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Erro prepare usuarios: " . $conexao->error
    ]);
    exit;
}

$stmt->bind_param("i", $usuario_id);

if (!$stmt->execute()) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Erro execute usuarios: " . $stmt->error
    ]);
    exit;
}

if ($stmt->affected_rows <= 0) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Nenhum usuário atualizado."
    ]);
    exit;
}

/*
=========================
ATUALIZA FABRICANTE
=========================
*/
$stmt2 = $conexao->prepare("
    UPDATE fabricantes
    SET data_aprovacao = NOW()
    WHERE usuario_id = ?
");

if (!$stmt2) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Erro prepare fabricantes: " . $conexao->error
    ]);
    exit;
}

$stmt2->bind_param("i", $usuario_id);

if (!$stmt2->execute()) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Erro execute fabricantes: " . $stmt2->error
    ]);
    exit;
}

/*
=========================
SUCESSO
=========================
*/
echo json_encode([
    "status" => "ok",
    "mensagem" => "Usuário aprovado como Maker!"
]);