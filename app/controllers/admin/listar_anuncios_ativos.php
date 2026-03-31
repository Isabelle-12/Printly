<?php

include_once '../../../config/conexao.php';

$retorno = [
    "status"   => "",
    "mensagem" => "",
    "data"     => []
];

$stmt = $conexao->prepare("
    SELECT id, titulo, mensagem, data_inicio, data_fim
    FROM anuncios_globais
    WHERE data_inicio <= NOW()
      AND data_fim    >= NOW()
    ORDER BY data_inicio DESC
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
        "mensagem" => $resultado->num_rows . " anúncio(s) ativo(s)",
        "data"     => $tabela
    ];
} else {
    $retorno = [
        "status"   => "ok",
        "mensagem" => "Nenhum anúncio ativo no momento",
        "data"     => []
    ];
}

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
