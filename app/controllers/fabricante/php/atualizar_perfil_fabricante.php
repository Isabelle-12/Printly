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

    $nome      = trim($_POST['nome'] ?? '');
    $email     = trim($_POST['email'] ?? '');
    $telefone  = trim($_POST['telefone'] ?? '');
    $documento = trim($_POST['documento'] ?? '');
    $cep       = trim($_POST['cep'] ?? '');
    $cidade    = trim($_POST['cidade'] ?? '');
    $estado    = strtoupper(trim($_POST['estado'] ?? ''));
    $endereco  = trim($_POST['endereco'] ?? '');
    $senha     = trim($_POST['senha'] ?? '');

    if ($nome === '' || $email === '') {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Nome e e-mail não podem ficar vazios."
        ]);
        exit;
    }

    $senha = trim($_POST['senha'] ?? '');

    if ($senha !== '' && strlen($senha) < 8) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "A senha deve ter no mínimo 8 caracteres."
        ]);
        exit;
    }

    $fotoPerfil = null;

    if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
        $arquivo = $_FILES['foto'];

        $extensao = strtolower(pathinfo($arquivo['name'], PATHINFO_EXTENSION));

        $extensoesPermitidas = ['jpg', 'jpeg', 'png', 'webp'];

        if (!in_array($extensao, $extensoesPermitidas)) {
            echo json_encode([
                "status" => "nok",
                "mensagem" => "Formato de imagem inválido. Use JPG, PNG ou WEBP."
            ]);
            exit;
        }

        $pastaDestino = __DIR__ . '/../../../../assets/uploads/perfis/';

        if (!is_dir($pastaDestino)) {
            mkdir($pastaDestino, 0777, true);
        }

        $nomeArquivo = 'perfil_' . $id . '_' . time() . '.' . $extensao;
        $caminhoCompleto = $pastaDestino . $nomeArquivo;

        if (!move_uploaded_file($arquivo['tmp_name'], $caminhoCompleto)) {
            echo json_encode([
                "status" => "nok",
                "mensagem" => "Erro ao salvar a foto."
            ]);
            exit;
        }

        $fotoPerfil = 'assets/uploads/perfis/' . $nomeArquivo;
    }

    if ($senha !== '' && $fotoPerfil !== null) {
        $sql = "UPDATE usuarios 
                SET nome = ?, 
                    email = ?, 
                    senha = ?, 
                    telefone = ?, 
                    documento = ?, 
                    cep = ?, 
                    cidade = ?, 
                    estado = ?, 
                    endereco = ?,
                    foto_perfil = ?
                WHERE id = ?";

        $stmt = $conexao->prepare($sql);

        $stmt->bind_param(
            "ssssssssssi",
            $nome,
            $email,
            $senha,
            $telefone,
            $documento,
            $cep,
            $cidade,
            $estado,
            $endereco,
            $fotoPerfil,
            $id
        );

    } else if ($senha !== '') {
        $sql = "UPDATE usuarios 
                SET nome = ?, 
                    email = ?, 
                    senha = ?, 
                    telefone = ?, 
                    documento = ?, 
                    cep = ?, 
                    cidade = ?, 
                    estado = ?, 
                    endereco = ?
                WHERE id = ?";

        $stmt = $conexao->prepare($sql);

        $stmt->bind_param(
            "sssssssssi",
            $nome,
            $email,
            $senha,
            $telefone,
            $documento,
            $cep,
            $cidade,
            $estado,
            $endereco,
            $id
        );

    } else if ($fotoPerfil !== null) {
        $sql = "UPDATE usuarios 
                SET nome = ?, 
                    email = ?, 
                    telefone = ?, 
                    documento = ?, 
                    cep = ?, 
                    cidade = ?, 
                    estado = ?, 
                    endereco = ?,
                    foto_perfil = ?
                WHERE id = ?";

        $stmt = $conexao->prepare($sql);

        $stmt->bind_param(
            "sssssssssi",
            $nome,
            $email,
            $telefone,
            $documento,
            $cep,
            $cidade,
            $estado,
            $endereco,
            $fotoPerfil,
            $id
        );

    } else {
        $sql = "UPDATE usuarios 
                SET nome = ?, 
                    email = ?, 
                    telefone = ?, 
                    documento = ?, 
                    cep = ?, 
                    cidade = ?, 
                    estado = ?, 
                    endereco = ?
                WHERE id = ?";

        $stmt = $conexao->prepare($sql);

        $stmt->bind_param(
            "ssssssssi",
            $nome,
            $email,
            $telefone,
            $documento,
            $cep,
            $cidade,
            $estado,
            $endereco,
            $id
        );
    }

    if (!$stmt) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Erro no prepare: " . $conexao->error
        ]);
        exit;
    }

    if ($stmt->execute()) {
        echo json_encode([
            "status" => "ok",
            "mensagem" => "Perfil atualizado com sucesso!"
        ]);
    } else {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Erro ao atualizar perfil: " . $stmt->error
        ]);
    }

    $stmt->close();
    $conexao->close();
?>