<?php
header("Content-type: application/json; charset=utf-8");

include_once(__DIR__ . '/../../../../config/conexao.php');


$retorno = ['status' => 'nok', 'mensagem' => 'Erro interno', 'data' => []];

// Verifique se a conexão existe
if (!$conexao) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Erro de conexão com o banco']);
    exit;
}

// ... restante do código com a comparação de senha simples (==)
if (isset($_POST['email']) && isset($_POST['senha'])) {
    $email = $_POST['email'];
    $senha = $_POST['senha'];

    $stmt = $conexao->prepare("SELECT * FROM usuarios WHERE email = ? AND senha = ?");
    $stmt->bind_param("ss", $email, $senha);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows > 0) {
        while ($linha = $resultado->fetch_assoc()) {
            $tabela[] = $linha;
        }
        session_start();
        $_SESSION['email'] = $email; // cria sessão e guarda
        $_SESSION['tipo'] = $tabela[0]['tipo_perfil']; //ta recebendo o tipo logado la na table, 0 é pq é só um array q tem na lista q é oq loga
      
        
            $retorno = [
                'status' => 'ok',
                'mensagem' => 'Sucesso',
                'data' => $linha
            ];
        } else {
            $retorno['mensagem'] = "Senha incorreta";
        }
    } else {
        $retorno['mensagem'] = "Usuário não encontrado";
    }

$stmt->close();
$conexao->close();

echo json_encode($retorno);