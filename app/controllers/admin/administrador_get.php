<?php

include_once(__DIR__ . '/../../../config/conexao.php');

$retorno = [
    'status'    => '', 
    'mensagem'  => '', 
    'data'      => []
];


$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id > 0) {

    $stmt = $conexao->prepare("SELECT * FROM usuarios WHERE id = ? AND tipo_perfil = 'ADMIN'");
    $stmt->bind_param("i", $id);
} else {

    $stmt = $conexao->prepare("SELECT * FROM usuarios WHERE tipo_perfil = 'ADMIN' ORDER BY nome");
}

$stmt->execute();
$resultado = $stmt->get_result();

$tabela = [];
while($linha = $resultado->fetch_assoc()){
    $tabela[] = $linha;
}

if(count($tabela) > 0){
    $retorno = [
        'status'    => 'ok', 
        'mensagem'  => 'Sucesso.', 
        'data'      => $tabela
    ];
} else {
    $retorno = [
        'status'    => 'erro', 
        'mensagem'  => 'Nenhum administrador encontrado.', 
        'data'      => []
    ];
}

$stmt->close();
$conexao->close();

header("Content-Type: application/json; charset=utf-8");
echo json_encode($retorno);