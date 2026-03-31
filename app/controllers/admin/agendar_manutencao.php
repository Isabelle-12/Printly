<?php

include_once '../../../config/conexao.php';

$retorno = [
    "status"   => "",
    "mensagem" => "",
    "data"     => []
];

$titulo      = isset($_POST['titulo'])      ? trim($_POST['titulo'])      : '';
$mensagem    = isset($_POST['mensagem'])    ? trim($_POST['mensagem'])    : '';
$data_inicio = isset($_POST['data_inicio']) ? trim($_POST['data_inicio']) : '';
$data_fim    = isset($_POST['data_fim'])    ? trim($_POST['data_fim'])    : '';

if (!$titulo || !$mensagem || !$data_inicio || !$data_fim) {
    $retorno = [
        "status"   => "nok",
        "mensagem" => "Preencha todos os campos do formulário",
        "data"     => []
    ];
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno, );
    exit;
}

$stmt = $conexao->prepare("
    INSERT INTO anuncios_globais (titulo, mensagem, data_inicio, data_fim)
    VALUES (?, ?, ?, ?)
");
$stmt->bind_param("ssss", $titulo, $mensagem, $data_inicio, $data_fim);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    $retorno = [
        "status"   => "ok",
        "mensagem" => "Manutenção agendada com sucesso",
        "data"     => []
    ];
} else {
    $retorno = [
        "status"   => "nok",
        "mensagem" => "Não foi possível agendar a manutenção",
        "data"     => []
    ];
}

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);