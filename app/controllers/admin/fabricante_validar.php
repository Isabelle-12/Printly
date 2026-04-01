<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . "/../../../config/conexao.php";

$id = $_GET['id'] ?? null;
$decisao = $_GET['decisao'] ?? null;

if (!$id || !$decisao) {
    echo json_encode(["status" => "erro", "mensagem" => "Dados incompletos"]);
    exit;
}

$status = ($decisao === 'aprovar') ? 'APROVADO' : 'REJEITADO';
$perfil = ($decisao === 'aprovar') ? 'MAKER' : 'CLIENTE';

$sql = "UPDATE usuarios SET status_fabricante = '$status', tipo_perfil = '$perfil' WHERE id = $id";

if ($conexao->query($sql)) {
    echo json_encode(["status" => "ok", "mensagem" => "Fabricante $status com sucesso!"]);
} else {
    echo json_encode(["status" => "erro", "mensagem" => $conexao->error]);
}

$conexao->close();
