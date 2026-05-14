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

$usuario_id = (int) $_SESSION['id'];

$nome_empresa       = trim($_POST['nome_empresa'] ?? '');
$email_comercial    = trim($_POST['email_comercial'] ?? '');
$cnpj               = trim($_POST['cnpj'] ?? '');
$telefone_comercial = trim($_POST['telefone_comercial'] ?? '');
$endereco_empresa   = trim($_POST['endereco_empresa'] ?? '');

$foto_empresa = null;

if (isset($_FILES['foto_empresa']) && $_FILES['foto_empresa']['error'] === UPLOAD_ERR_OK) {
    $arquivo = $_FILES['foto_empresa'];

    $extensao = strtolower(pathinfo($arquivo['name'], PATHINFO_EXTENSION));
    $permitidas = ['jpg', 'jpeg', 'png', 'webp'];

    if (!in_array($extensao, $permitidas)) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Formato de imagem inválido. Use JPG, PNG ou WEBP."
        ]);
        exit;
    }

    $pastaDestino = __DIR__ . '/../../../../assets/uploads/empresas/';

    if (!is_dir($pastaDestino)) {
        mkdir($pastaDestino, 0777, true);
    }

    $nomeArquivo = 'empresa_' . $usuario_id . '_' . time() . '.' . $extensao;
    $caminhoCompleto = $pastaDestino . $nomeArquivo;

    if (!move_uploaded_file($arquivo['tmp_name'], $caminhoCompleto)) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Erro ao salvar a foto empresarial."
        ]);
        exit;
    }

    $foto_empresa = 'assets/uploads/empresas/' . $nomeArquivo;
}

if ($foto_empresa !== null) {
    $sql = "UPDATE fabricantes
            SET nome_empresa = ?,
                email_comercial = ?,
                cnpj = ?,
                telefone_comercial = ?,
                endereco_empresa = ?,
                foto_empresa = ?
            WHERE usuario_id = ?";

    $stmt = $conexao->prepare($sql);

    if (!$stmt) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Erro no prepare: " . $conexao->error
        ]);
        exit;
    }

    $stmt->bind_param(
        "ssssssi",
        $nome_empresa,
        $email_comercial,
        $cnpj,
        $telefone_comercial,
        $endereco_empresa,
        $foto_empresa,
        $usuario_id
    );
} else {
    $sql = "UPDATE fabricantes
            SET nome_empresa = ?,
                email_comercial = ?,
                cnpj = ?,
                telefone_comercial = ?,
                endereco_empresa = ?
            WHERE usuario_id = ?";

    $stmt = $conexao->prepare($sql);

    if (!$stmt) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Erro no prepare: " . $conexao->error
        ]);
        exit;
    }

    $stmt->bind_param(
        "sssssi",
        $nome_empresa,
        $email_comercial,
        $cnpj,
        $telefone_comercial,
        $endereco_empresa,
        $usuario_id
    );
}

if ($stmt->execute()) {
    echo json_encode([
        "status" => "ok",
        "mensagem" => "Dados do fabricante atualizados com sucesso!"
    ]);
} else {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Erro ao atualizar dados: " . $stmt->error
    ]);
}

$stmt->close();
$conexao->close();
?>