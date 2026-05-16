<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../../../config/conexao.php';

$retorno = ["status" => "", "mensagem" => "", "data" => []];

//verifica se o usuário está logado
if (!isset($_SESSION['id'])) { 
    $retorno["status"]   = "nok";
    $retorno["mensagem"] = "Você precisa estar logado.";
    echo json_encode($retorno);
    exit;
}

$usuario_id = (int)$_SESSION['id'];

//le o JSON enviado pelo formulário
$dados = json_decode(file_get_contents('php://input'), true);

//valida os campos mínimos
if (empty($dados['impressoras'])) {
    $retorno["status"]   = "nok";
    $retorno["mensagem"] = "Informe ao menos uma impressora.";
    echo json_encode($retorno);
    exit;
}
if (empty($dados['materiais'])) {
    $retorno["status"]   = "nok";
    $retorno["mensagem"] = "Informe ao menos um material.";
    echo json_encode($retorno);
    exit;
}

//verifica se já existe solicitação pendente ou aprovada
$chk = $conexao->prepare("SELECT status_fabricante FROM usuarios WHERE id = ?");
$chk->bind_param("i", $usuario_id);
$chk->execute();
$chk->bind_result($status_fab);
$chk->fetch();
$chk->close();

if (in_array($status_fab, ['PENDENTE', 'APROVADO'])) {
    $retorno["status"]   = "nok";
    $retorno["mensagem"] = "Você já possui uma solicitação em andamento ou já é Maker.";
    echo json_encode($retorno);
    exit;
}

//insere ou atualiza na tabela fabricantes
$nome_empresa       = $dados['nome_empresa'] ?? '';
$email_comercial    = $dados['email_comercial'] ?? '';
$cnpj               = $dados['cnpj']              ?? '';
$telefone           = $dados['telefone_comercial'] ?? '';
$endereco           = $dados['endereco_empresa']  ?? '';

$stmt = $conexao->prepare("
    INSERT INTO fabricantes (usuario_id, nome_empresa, email_comercial, cnpj, telefone_comercial, endereco_empresa)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE nome_empresa=VALUES(nome_empresa), email_comercial=VALUES(email_comercial), cnpj=VALUES(cnpj), telefone_comercial=VALUES(telefone_comercial), endereco_empresa=VALUES(endereco_empresa)
");
$stmt->bind_param("isssss", $usuario_id, $nome_empresa, $email_comercial, $cnpj, $telefone, $endereco);
$stmt->execute();
$stmt->close();

//remove impressoras e materiais antigos e insere os novos
$conexao->query("DELETE FROM impressoras WHERE maker_id = $usuario_id");
$conexao->query("DELETE FROM materiais_maker WHERE maker_id = $usuario_id");

foreach ($dados['impressoras'] as $imp) {
    $modelo    = $imp['modelo']    ?? '';
    $volume    = !empty($imp['volume'])    ? (float)$imp['volume']    : null;
    $quantidade = !empty($imp['quantidade']) ? (int)$imp['quantidade']  : 1;
    $tipos     = !empty($imp['tipos']) ? implode(',', array_map('trim', (array)$imp['tipos'])) : null;
    error_log("DEBUG impressora - modelo: $modelo | tipos recebidos: " . json_encode($imp['tipos']) . " | tipos salvos: $tipos");
    $s = $conexao->prepare("INSERT INTO impressoras (maker_id, modelo, tipo_impressora, volume_maximo_cm3, quantidade) VALUES (?, ?, ?, ?, ?)");
    $s->bind_param("issdi", $usuario_id, $modelo, $tipos, $volume, $quantidade);
    $s->execute();
    $s->close();
}

foreach ($dados['materiais'] as $mat) {
    $tipo  = $mat['tipo']  ?? '';
    $preco = !empty($mat['preco']) ? (float)$mat['preco'] : 0;
    $s = $conexao->prepare("INSERT INTO materiais_maker (maker_id, tipo_material, preco_por_grama) VALUES (?, ?, ?)");
    $s->bind_param("isd", $usuario_id, $tipo, $preco);
    $s->execute();
    $s->close();
}

//atualiza o status_fabricante para PENDENTE
$upd = $conexao->prepare("UPDATE usuarios SET status_fabricante = 'PENDENTE' WHERE id = ?");
$upd->bind_param("i", $usuario_id);
$upd->execute();
$upd->close();

$conexao->close();

$retorno["status"]   = "ok";
$retorno["mensagem"] = "Solicitação enviada com sucesso!";
echo json_encode($retorno);