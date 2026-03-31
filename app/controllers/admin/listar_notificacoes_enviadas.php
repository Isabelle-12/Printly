<?php
include_once '../../../config/conexao.php';

$retorno = [
    "status"   => "",
    "mensagem" => "",
    "data"     => []
];

$stmt = $conexao->prepare("SELECT id, tipo, pedido_id, titulo, mensagem, email_destino, retratada, data_envio FROM notificacoes
    ORDER BY data_envio DESC
");
$stmt->execute();
$resultado = $stmt->get_result();

$tabela = [];
if ($resultado->num_rows > 0) {
    while ($linha = $resultado->fetch_assoc()) {
        $tabela[] = $linha;
    }
    $retorno = [
        "status"   => "ok",
        "mensagem" => "Notificações carregadas com sucesso",
        "data"     => $tabela
    ];
} else {
    $retorno = [
        "status"   => "ok",
        "mensagem" => "Nenhuma notificação encontrada",
        "data"     => []
    ];
}

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);