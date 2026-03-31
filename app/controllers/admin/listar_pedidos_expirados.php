<?php

include_once '../../../config/conexao.php';

$retorno = [
    "status"   => "",
    "mensagem" => "",
    "data"     => []
];

$stmt = $conexao->prepare("SELECT p.id, p.status, p.prazo_pedido, p.data_solicitacao, p.material_escolhido, u.nome  AS maker_nome,  u.email AS maker_email FROM pedidos p JOIN usuarios u ON u.id = p.maker_id WHERE p.status NOT IN ('CONCLUIDO', 'NEGADO') AND p.prazo_pedido IS NOT NULL AND p.prazo_pedido < NOW()  ORDER BY p.prazo_pedido ASC");
$stmt->execute();
$resultado = $stmt->get_result();

$tabela = [];
if ($resultado->num_rows > 0) {
    while ($linha = $resultado->fetch_assoc()) {
        $tabela[] = $linha;
    }
    $retorno = [
        "status"   => "ok",
        "mensagem" => $resultado->num_rows . " pedido(s) expirado(s) encontrado(s)",
        "data"     => $tabela
    ];
} else {
    $retorno = [
        "status"   => "ok",
        "mensagem" => "Nenhum pedido com prazo expirado",
        "data"     => []
    ];
}

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");

echo json_encode($retorno);