<?php
include_once(__DIR__ . '/../../../config/conexao.php');

$retorno = [
    'status'    => '', 
    'mensagem'  => '', 
    'data'      => []
];

if(isset($_GET['id'])){
    $stmt = $conexao->prepare("
        SELECT f.id, f.usuario_id, u.nome, u.email, f.cnpj, f.telefone_comercial, f.endereco_empresa, f.data_aprovacao
        FROM fabricantes f
        JOIN usuarios u ON f.usuario_id = u.id
        WHERE f.id = ?
    ");
    $stmt->bind_param("i", $_GET['id']);
} else {
    $stmt = $conexao->prepare("
        SELECT f.id, f.usuario_id, u.nome, u.email, f.cnpj, f.telefone_comercial, f.endereco_empresa, f.data_aprovacao
        FROM fabricantes f
        JOIN usuarios u ON f.usuario_id = u.id
        ORDER BY u.nome
    ");
}

$stmt->execute();
$resultado = $stmt->get_result();

$tabela = [];
if($resultado->num_rows > 0){
    while($linha = $resultado->fetch_assoc()){
        $tabela[] = $linha;
    }
    $retorno = [
        'status'    => 'ok', 
        'mensagem'  => 'Fabricantes encontrados.', 
        'data'      => $tabela
    ];
} else {
    $retorno = [
        'status'    => 'No', 
        'mensagem'  => 'Nenhum fabricante encontrado.', 
        'data'      => []
    ];
}

$stmt->close();
$conexao->close();

header("Content-Type: application/json; charset=utf-8");
echo json_encode($retorno);