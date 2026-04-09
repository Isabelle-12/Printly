<?php
session_start();
include_once(__DIR__ . '/../../../config/conexao.php');


header('Content-Type: application/json; charset=UTF-8');

$retorno = [
    'status'    => '',
    'mensagem'  => '',
    'data'      => []
];




if (!isset($_POST['id'])) {
    $retorno['status'] = 'no';
    $retorno['mensagem'] = 'ID do usuário não informado';
    echo json_encode($retorno);
    $conexao->close();
    exit;
}


$id          = (int) ($_POST['id'] ?? 0);
$nome        = $_POST['nome'] ?? '';
$email       = $_POST['email'] ?? '';
$documento   = $_POST['documento'] ?? '';
$endereco    = $_POST['endereco'] ?? '';
$telefone    = $_POST['telefone'] ?? '';
$cep         = $_POST['cep'] ?? '';
$cidade      = $_POST['cidade'] ?? '';
$estado      = $_POST['estado'] ?? '';
$tipo_perfil = $_POST['tipo_perfil'] ?? '';
$nova_senha  = $_POST['nova_senha'] ?? '';


$stmt = $conexao->prepare("SELECT * FROM usuarios WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();
$stmt->close();

if ($result->num_rows === 0) {
    echo json_encode(['status'=>'erro','mensagem'=>'Usuário não encontrado']);
    $conexao->close();
    exit;
}


$stmt = $conexao->prepare("SELECT id FROM usuarios WHERE email = ? AND id != ?");
$stmt ? $stmt->bind_param("si", $email, $id) : die(json_encode(['status'=>'erro','mensagem'=>'Falha no prepare do SELECT email']));
$stmt->execute();
$resultEmail = $stmt->get_result();
$stmt->close();

if ($resultEmail->num_rows > 0) {
    echo json_encode(['status'=>'erro','mensagem'=>'Email já em uso']);
    $conexao->close();
    exit;
}


if (!empty($nova_senha)) {
    $senha_hash = password_hash($nova_senha, PASSWORD_DEFAULT);
    $sql = "UPDATE usuarios SET nome=?, email=?, documento=?, endereco=?, telefone=?, cep=?, cidade=?, estado=?, tipo_perfil=?, senha=? WHERE id=?";
    $stmt = $conexao->prepare($sql);
    if (!$stmt) {
        echo json_encode(['status'=>'erro','mensagem'=>'Falha no prepare do UPDATE com senha']);
        $conexao->close();
        exit;
    }
    $stmt->bind_param("ssssssssssi", $nome, $email, $documento, $endereco, $telefone, $cep, $cidade, $estado, $tipo_perfil, $senha_hash, $id);
} else {
    $sql = "UPDATE usuarios SET nome=?, email=?, documento=?, endereco=?, telefone=?, cep=?, cidade=?, estado=?, tipo_perfil=? WHERE id=?";
    $stmt = $conexao->prepare($sql);
    if (!$stmt) {
        echo json_encode(['status'=>'erro','mensagem'=>'Falha no prepare do UPDATE sem senha']);
        $conexao->close();
        exit;
    }
    $stmt->bind_param("sssssssssi", $nome, $email, $documento, $endereco, $telefone, $cep, $cidade, $estado, $tipo_perfil, $id);
}


$stmt->execute();
if ($stmt->affected_rows > 0) {
    $retorno['status'] = 'ok';
    $retorno['mensagem'] = 'Usuário atualizado com sucesso';
} else {
    $retorno['status'] = 'no';
    $retorno['mensagem'] = 'Nenhuma alteração realizada ou dados iguais aos atuais';
}

$stmt->close();
$conexao->close();

echo json_encode($retorno);
exit;