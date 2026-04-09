<?php
include_once '../../../config/conexao.php';

$retorno = ["status" => "", "mensagem" => "", "data" => []];

session_start();
$usuario_id = isset($_SESSION['id']) ? (int)$_SESSION['id'] : 0;

if (!$usuario_id) {
    $retorno = ["status" => "nok", "mensagem" => "Usuário não autenticado", "data" => []];
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit;
}

$stmt = $conexao->prepare("SELECT n.id, n.tipo, n.titulo, n.mensagem, n.data_envio FROM notificacoes n JOIN pedidos p  ON p.id  = n.pedido_id JOIN projetos pr ON pr.id = p.projeto_id WHERE n.retratada = 0 AND (pr.cliente_id = ? OR p.maker_id = ?) ORDER BY n.data_envio DESC");
$stmt->bind_param("ii", $usuario_id, $usuario_id);
$stmt->execute();
$resultado = $stmt->get_result();

$tabela = [];
while ($linha = $resultado->fetch_assoc()) {
    $tabela[] = $linha;
}

$retorno = ["status" => "ok", "mensagem" => count($tabela) . " notificação(ões)", "data" => $tabela];
$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);