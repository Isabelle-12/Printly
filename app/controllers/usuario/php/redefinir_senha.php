<?php
session_start();
header("Content-type: application/json; charset=utf-8");

include_once(__DIR__ . '/../../../../config/conexao.php');

$retorno = ['status' => 'nok', 'mensagem' => 'Erro interno', 'data' => []];

if (!$conexao) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Erro de conexão com o banco']);
    exit;
}

$token = isset($_POST['token']) ? trim($_POST['token']) : '';
$acao  = isset($_POST['acao'])  ? trim($_POST['acao'])  : '';

if (empty($token)) {
    $retorno['mensagem'] = 'Token não informado.';
    echo json_encode($retorno);
    exit;
}

// a ação validar é chamada quando a página de redefinir_senha.html carrega

if ($acao === 'validar') {

    $stmt = $conexao->prepare("SELECT id, usuario_id, usado, data_expiracao FROM tokens_reset_senha WHERE token = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows === 0) {
        echo json_encode(['status' => 'nok', 'mensagem' => 'Link inválido ou expirado.']);
        $stmt->close(); $conexao->close(); exit;
    }

    $linha = $resultado->fetch_assoc();
    $stmt->close();

    if ($linha['usado'] == 1) {
        echo json_encode(['status' => 'nok', 'mensagem' => 'Este link já foi utilizado.']);
        $conexao->close(); exit;
    }

    if (strtotime($linha['data_expiracao']) < time()) {
        echo json_encode(['status' => 'nok', 'mensagem' => 'Este link expirou (válido por 1 hora).']);
        $conexao->close(); exit;
    }

    echo json_encode(['status' => 'ok', 'mensagem' => 'Token válido.']);
    $conexao->close(); exit;
}

// a ação redefinir é chamada quando o usuário clica em salvar

if ($acao === 'redefinir') {

    $nova_senha = isset($_POST['nova_senha']) ? $_POST['nova_senha'] : '';

    if (empty($nova_senha) || strlen($nova_senha) < 6) {
        echo json_encode(['status' => 'nok', 'mensagem' => 'Senha inválida. Mínimo 6 caracteres.']);
        exit;
    }

    // busca o token para pegar o usuario_id
    $stmt = $conexao->prepare("SELECT id, usuario_id, usado, data_expiracao FROM tokens_reset_senha WHERE token = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows === 0) {
        echo json_encode(['status' => 'nok', 'mensagem' => 'Link inválido.']);
        $stmt->close(); $conexao->close(); exit;
    }

    $linha = $resultado->fetch_assoc();
    $stmt->close();

    // valida novamente no servidor para ter certeza
    if ($linha['usado'] == 1) {
        echo json_encode(['status' => 'nok', 'mensagem' => 'Este link já foi utilizado.']);
        $conexao->close(); exit;
    }

    if (strtotime($linha['data_expiracao']) < time()) {
        echo json_encode(['status' => 'nok', 'mensagem' => 'Este link expirou.']);
        $conexao->close(); exit;
    }

    $usuario_id = $linha['usuario_id'];

    // atualiza a senha na tabela usuarios no banco
    $stmt_update = $conexao->prepare("UPDATE usuarios SET senha = ? WHERE id = ?");
    $stmt_update->bind_param("si", $nova_senha, $usuario_id);

    if (!$stmt_update->execute()) {
        echo json_encode(['status' => 'nok', 'mensagem' => 'Erro ao atualizar a senha.']);
        $stmt_update->close(); $conexao->close(); exit;
    }
    $stmt_update->close();

    // marca o token como usado pra ele não ser utilizado de novo
    $stmt_used = $conexao->prepare("UPDATE tokens_reset_senha SET usado = TRUE WHERE token = ?");
    $stmt_used->bind_param("s", $token);
    $stmt_used->execute();
    $stmt_used->close();

    $conexao->close();
    echo json_encode(['status' => 'ok', 'mensagem' => 'Senha alterada com sucesso!']);
    exit;
}

$retorno['mensagem'] = 'Ação inválida.';
echo json_encode($retorno);
$conexao->close();