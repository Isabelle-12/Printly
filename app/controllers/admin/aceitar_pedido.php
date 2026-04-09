<?php

include_once '../../../config/conexao.php';

$retorno = [
    "status"   => "",
    "mensagem" => "",
    "data"     => []
];

$pedido_id  = isset($_POST['pedido_id'])  ? (int)$_POST['pedido_id']  : 0;

if (!$pedido_id) {
    $retorno = [
        "status"   => "nok",
        "mensagem" => "Informe o pedido_id",
        "data"     => []
    ];
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit;
}
$resultado_prazo = $conexao->query("SELECT dias_prazo FROM config_prazos WHERE tipo_operacao = 'PEDIDO_PADRAO'");
$linha_prazo     = $resultado_prazo ? $resultado_prazo->fetch_assoc() : null;

if ($linha_prazo && $linha_prazo['dias_prazo'] > 0) {
    $dias_prazo = (int)$linha_prazo['dias_prazo'];
} else {
    $dias_prazo = 7;
}


$stmt = $conexao->prepare("
    UPDATE pedidos
    SET status       = 'ACEITO',
        prazo_pedido = DATE_ADD(NOW(), INTERVAL ? DAY)
    WHERE id = ?
      AND status NOT IN ('CONCLUIDO', 'NEGADO')
");
$stmt->bind_param("ii", $dias_prazo, $pedido_id);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    $retorno = [
        "status"   => "ok",
        "mensagem" => "Pedido #" . $pedido_id . " aceito. Prazo definido para " . $dias_prazo . " dia(s).",
        "data"     => []
    ];
} else {
    $retorno = [
        "status"   => "nok",
        "mensagem" => "Pedido não encontrado ou já finalizado",
        "data"     => []
    ];
}

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
