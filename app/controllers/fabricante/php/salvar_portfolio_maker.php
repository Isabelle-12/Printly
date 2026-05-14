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

    $makerId = (int) $_SESSION['id'];

    $titulo = trim($_POST['titulo'] ?? '');
    $descricao = trim($_POST['descricao'] ?? '');

    if ($titulo === '') {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Informe o título do projeto."
        ]);
        exit;
    }

    if (!isset($_FILES['imagem']) || $_FILES['imagem']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Selecione uma imagem para o portfólio."
        ]);
        exit;
    }

    $arquivo = $_FILES['imagem'];
    $extensao = strtolower(pathinfo($arquivo['name'], PATHINFO_EXTENSION));

    $extensoesPermitidas = ['jpg', 'jpeg', 'png', 'webp'];

    if (!in_array($extensao, $extensoesPermitidas)) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Formato inválido. Use JPG, PNG ou WEBP."
        ]);
        exit;
    }

    $pastaDestino = __DIR__ . '/../../../../assets/uploads/portfolio/';

    if (!is_dir($pastaDestino)) {
        mkdir($pastaDestino, 0777, true);
    }

    $nomeArquivo = 'portfolio_' . $makerId . '_' . time() . '.' . $extensao;
    $caminhoCompleto = $pastaDestino . $nomeArquivo;

    if (!move_uploaded_file($arquivo['tmp_name'], $caminhoCompleto)) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Erro ao salvar a imagem."
        ]);
        exit;
    }

    $caminhoBanco = 'assets/uploads/portfolio/' . $nomeArquivo;

    $sql = "INSERT INTO portfolio_maker 
                (maker_id, titulo, descricao, caminho_imagem)
            VALUES 
                (?, ?, ?, ?)";

    $stmt = $conexao->prepare($sql);

    if (!$stmt) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Erro no prepare: " . $conexao->error
        ]);
        exit;
    }

    $stmt->bind_param("isss", $makerId, $titulo, $descricao, $caminhoBanco);

    if ($stmt->execute()) {
        echo json_encode([
            "status" => "ok",
            "mensagem" => "Foto adicionada ao portfólio com sucesso!"
        ]);
    } else {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Erro ao salvar no banco: " . $stmt->error
        ]);
    }

    $stmt->close();
    $conexao->close();
?>