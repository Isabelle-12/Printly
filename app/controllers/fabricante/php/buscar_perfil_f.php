<?php
    session_start();
    header("Content-Type: application/json; charset=utf-8");

    include_once(__DIR__ . '/../../../../config/conexao.php');

    if (!isset($_SESSION['id'])) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Usuário não está logado."
        ]);
        exit;
    }

    $id = (int) $_SESSION['id'];

    $sql = "SELECT 
                id,
                nome,
                email,
                tipo_perfil,
                documento,
                telefone,
                cep,
                cidade,
                estado,
                endereco,
                foto_perfil,
                status,
                status_fabricante,
                disponivel_para_pedidos
            FROM usuarios 
            WHERE id = ?";

    $stmt = $conexao->prepare($sql);

    if (!$stmt) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Erro no prepare: " . $conexao->error
        ]);
        exit;
    }

    $stmt->bind_param("i", $id);
    $stmt->execute();

    $resultado = $stmt->get_result();

    if ($resultado->num_rows === 0) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Usuário não encontrado."
        ]);
        exit;
    }

    $usuario = $resultado->fetch_assoc();

    echo json_encode([
        "status" => "ok",
        "mensagem" => "Perfil carregado com sucesso.",
        "data" => $usuario
    ]);

    $stmt->close();
    $conexao->close();
?>