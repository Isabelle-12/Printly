<?php

include_once '../../../config/conexao.php';

$retorno = [
    "status"   => "",
    "mensagem" => "",
    "data"     => []
];

$id = isset($_POST['id']) ? (int)$_POST['id'] : 0;

if (!$id) {
    $retorno = [
        "status"   => "nok",
        "mensagem" => "É necessário informar o ID da notificação",
        "data"     => []
    ];
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit;
}

$stmt = $conexao->prepare("
    UPDATE notificacoes SET retratada = 1 WHERE id = ?
");
$stmt->bind_param("i", $id);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    $retorno = [
        "status"   => "ok",
        "mensagem" => "Notificação retratada com sucesso",
        "data"     => []
    ];
} else {
    $retorno = [
        "status"   => "nok",
        "mensagem" => "Notificação não encontrada ou já retratada",
        "data"     => []
    ];
}

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);