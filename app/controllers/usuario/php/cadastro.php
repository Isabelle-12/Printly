<?php
header("Content-type: application/json; charset=utf-8");
// Ajuste o caminho conforme sua estrutura real (4 níveis para chegar na raiz/config)
include_once(__DIR__ . '/../../../../config/conexao.php');

$retorno = ['status' => 'nok', 'mensagem' => 'Erro interno', 'data' => []];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    
    $nome          = $_POST['nome'] ?? '';
    $email         = $_POST['email'] ?? '';
    $senha         = $_POST['senha'] ?? ''; // Texto puro conforme solicitado
    $telefone      = $_POST['telefone'] ?? '';
    $documento     = $_POST['documento'] ?? '';
    $cep           = $_POST['cep'] ?? '';
    $cidade        = $_POST['cidade'] ?? '';
    $estado        = $_POST['estado'] ?? '';
    $endereco      = $_POST['endereco'] ?? '';
    $nome_cachorro = $_POST['nome_cachorro'] ?? '';
    $perfil        = $_POST['perfil'] ?? 'CLIENTE';

    // 1. Validar se usuário já existe
    $sql_check = "SELECT id FROM usuarios WHERE email = ?";
    $stmt_check = $conexao->prepare($sql_check);
    $stmt_check->bind_param("s", $email);
    $stmt_check->execute();
    
    if ($stmt_check->get_result()->num_rows > 0) {
        echo json_encode(['status' => 'nok', 'mensagem' => 'Este e-mail já está em uso.']);
        exit;
    }

    // 2. Inserir todos os campos
    $sql = "INSERT INTO usuarios
            (nome, email, senha, tipo_perfil, documento, telefone, cep, cidade, estado, endereco, nome_cachorro, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ATIVO')";

    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("sssssssssss",
        $nome, $email, $senha, $perfil, $documento, $telefone, $cep, $cidade, $estado, $endereco, $nome_cachorro
    );

    if ($stmt->execute()) {
        $retorno = [
            'status' => 'ok',
            'mensagem' => 'Cadastro realizado com sucesso!',
            'data' => ['id' => $stmt->insert_id]
        ];
    } else {
        $retorno['mensagem'] = "Erro ao inserir no banco: " . $conexao->error;
    }

    $stmt->close();
    $conexao->close();
}

echo json_encode($retorno);