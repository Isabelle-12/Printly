<?php

include_once '../../../config/conexao.php';

$retorno = [
    "status"   => "",
    "mensagem" => "",
    "data"     => []
];

$stmt = $conexao->prepare("SELECT p.id,p.status, p.prazo_pedido,p.data_solicitacao,p.material_escolhido,c.nome  AS cliente_nome,c.email AS cliente_email,m.nome  AS maker_nome,m.email AS maker_email FROM pedidos p JOIN projetos pr ON pr.id = p.projeto_id JOIN usuarios c  ON c.id  = pr.cliente_id JOIN usuarios m  ON m.id  = p.maker_id WHERE p.status NOT IN ('CONCLUIDO', 'NEGADO') AND p.prazo_pedido IS NOT NULL AND p.prazo_pedido < NOW() ORDER BY p.prazo_pedido ASC");
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