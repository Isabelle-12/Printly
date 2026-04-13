<?php
session_start();
header("Content-type: application/json; charset=utf-8");

include_once(__DIR__ . '/../../../../config/conexao.php');

$retorno = ['status' => 'nok', 'mensagem' => 'Erro interno', 'data' => []];

if (!$conexao) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Erro de conexão com o banco']);
    exit;
}

if (isset($_POST['email']) && isset($_POST['senha'])) {
    $email = $_POST['email'];
    $senha = $_POST['senha'];

    // mudança: busca o usuário pelo email e senha, mas agora vamos validar o status antes de criar a sessão
    $stmt = $conexao->prepare("SELECT * FROM usuarios WHERE email = ? AND senha = ?");
    $stmt->bind_param("ss", $email, $senha);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows > 0) {
        $usuario = $resultado->fetch_assoc();

        // mudança: impede login de usuário banido
        if ($usuario['status'] === 'BANIDO') {
            $retorno['mensagem'] = "Usuário banido pelo administrador";
        } else {
            // mudança: sessão só é criada se o usuário estiver ativo
            $_SESSION['email'] = $usuario['email'];
            $_SESSION['tipo'] = $usuario['tipo_perfil'];
            $_SESSION['id'] = $usuario['id'];
            $_SESSION['status_fabricante'] = $usuario['status_fabricante'];

            $retorno = [
                'status' => 'ok',
                'mensagem' => 'Sucesso',
                'data' => $usuario
            ];
        }
    } else {
        $retorno['mensagem'] = "Usuário não encontrado ou senha incorreta";
    }

    $stmt->close();
} else {
    $retorno['mensagem'] = "Email e senha são obrigatórios";
}

$conexao->close();

echo json_encode($retorno);