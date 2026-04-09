<?php

include_once '../../../config/conexao.php';
// include_once '../../helpers/email.php';

$retorno = [
    "status"   => "",
    "mensagem" => "",
    "data"     => []
];

$pedido_id     = isset($_POST['pedido_id'])     ? (int)$_POST['pedido_id']          : 0;
$email_destino = isset($_POST['email_destino']) ? trim($_POST['email_destino'])      : '';
$mensagem      = isset($_POST['mensagem'])      ? trim($_POST['mensagem'])           : '';

if (!$pedido_id || !$email_destino || !$mensagem) {
    $retorno = [
        "status"   => "nok",
        "mensagem" => "Preencha todos os campos: pedido_id, email_destino, mensagem",
        "data"     => []
    ];
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit;
}

$titulo = "Atraso no pedido #" . $pedido_id;

$stmt = $conexao->prepare("INSERT INTO notificacoes (tipo, pedido_id, titulo, mensagem, email_destino)
    VALUES ('ATRASO', ?, ?, ?, ?)
");
$stmt->bind_param("isss", $pedido_id, $titulo, $mensagem, $email_destino);
$stmt->execute();

if ($stmt->affected_rows > 0) {

    $assunto  = "Printly - " . $titulo;
    $cabecalho = "From: no-reply@printly.com\r\nContent-Type: text/plain; charset=UTF-8";
    mail($email_destino, $assunto, $mensagem, $cabecalho);

    $retorno = [
        "status"   => "ok",
        "mensagem" => "Notificação de atraso registrada e email enviado",
        "data"     => []
    ];
} else {
    $retorno = [
        "status"   => "nok",
        "mensagem" => "Não foi possível registrar a notificação",
        "data"     => []
    ];
}

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);