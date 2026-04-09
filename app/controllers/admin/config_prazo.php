<?php
include_once '../../../config/conexao.php';

$retorno = ["status" => "", "mensagem" => "", "data" => []];

$dias_prazo = isset($_POST['dias_prazo']) ? (int)$_POST['dias_prazo'] : 0;

if (isset($_POST['apenas_consulta'])) {
    $stmt = $conexao->prepare("SELECT dias_prazo FROM config_prazos WHERE tipo_operacao = 'PEDIDO_PADRAO'");
    $stmt->execute();
    $linha_prazo = $stmt->get_result()->fetch_assoc();
    $retorno = [
        "status"   => "ok",
        "mensagem" => "",
        "data"     => $linha_prazo ? $linha_prazo : ["dias_prazo" => 7]
    ];
    $stmt->close();
    $conexao->close();
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit;
}

if (!$dias_prazo || $dias_prazo <= 0) {
    $retorno = ["status" => "nok", "mensagem" => "Informe um prazo válido (mínimo 1 dia)", "data" => []];
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit;
}

$stmt = $conexao->prepare("UPDATE config_prazos SET dias_prazo = ? WHERE tipo_operacao = 'PEDIDO_PADRAO'");
$stmt->bind_param("i", $dias_prazo);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    $retorno = ["status" => "ok",  "mensagem" => "Prazo atualizado para " . $dias_prazo . " dia(s)", "data" => []];
} else {
    $retorno = ["status" => "nok", "mensagem" => "Não foi possível atualizar o prazo", "data" => []];
}

$stmt->close();
$conexao->close();
header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);