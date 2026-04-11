<?php
include_once(__DIR__ . '/../../../config/conexao.php');


header("Content-type: application/json; charset=utf-8");



$retorno = ['status' => 'nok', 'mensagem' => 'Erro interno', 'data' => []];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    
    // Limpando espaços extras
    $nome      = trim($_POST['nome'] ?? '');
    $email     = trim($_POST['email'] ?? '');
    $senha     = $_POST['senha'] ?? '';
    $telefone  = trim($_POST['telefone'] ?? '');
    $documento = trim($_POST['documento'] ?? '');
    $cep       = trim($_POST['cep'] ?? '');
    $cidade    = trim($_POST['cidade'] ?? '');
    $estado    = trim($_POST['estado'] ?? '');
    $endereco  = trim($_POST['endereco'] ?? '');
    $perfil    = $_POST['perfil'] ?? 'ADMIN';

    // Validação básica de campos obrigatórios
    if (empty($nome) || empty($email) || empty($senha)) {
        echo json_encode(['status' => 'nok', 'mensagem' => 'Preencha todos os campos obrigatórios.']);
        exit;
    }

    // 1. Validar se usuário já existe (E-mail ou Documento)
    // Dica: É bom checar o documento também se ele for único!
    $sql_check = "SELECT id FROM usuarios WHERE email = ? OR (documento = ? AND documento != '')";
    $stmt_check = $conexao->prepare($sql_check);
    $stmt_check->bind_param("ss", $email, $documento);
    $stmt_check->execute();
    
    if ($stmt_check->get_result()->num_rows > 0) {
        echo json_encode(['status' => 'nok', 'mensagem' => 'Este e-mail ou documento já está cadastrado.']);
        exit;
    }

    // 2. Criptografar a senha (RECOMENDADO)
    // Se quiser manter texto puro, use apenas $senha_final = $senha;
    // Mas recomendo fortemente usar:

    // 3. Inserir no banco
    $sql = "INSERT INTO usuarios 
            (nome, email, senha, tipo_perfil, documento, telefone, cep, cidade, estado, endereco, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ATIVO')";
    
    $stmt = $conexao->prepare($sql);
    
    // "ssssssssss" indica que todos os 10 campos são strings
    $stmt->bind_param("ssssssssss", 
        $nome, $email, $senha, $perfil, $documento, $telefone, $cep, $cidade, $estado, $endereco
    );

    if ($stmt->execute()) {
        $retorno = [
            'status' => 'ok',
            'mensagem' => 'Administrador cadastrado com sucesso!',
            'data' => ['id' => $stmt->insert_id]
        ];
    } else {
        $retorno['mensagem'] = "Erro ao inserir no banco: " . $stmt->error;
    }

    $stmt->close();
    $conexao->close();
}

echo json_encode($retorno);