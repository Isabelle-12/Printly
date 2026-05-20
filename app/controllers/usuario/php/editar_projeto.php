<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once(__DIR__ . '/../../../../config/conexao.php');

if (!isset($_SESSION['id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Não autenticado']);
    exit;
}

try {

    $conexao->begin_transaction();

    $usuarioId = (int)$_SESSION['id'];
    $id = (int)($_POST['editar_id'] ?? 0);

    $nome = trim($_POST['editar_nome'] ?? '');
    $descricao = trim($_POST['editar_descricao'] ?? '');
    $formato = $_POST['editar_formato'] ?? 'STL';

    $endereco = trim($_POST['endereco_entrega'] ?? '');

    $quantidade = (int)($_POST['editar_quantidade'] ?? 1);
    if ($quantidade < 1) $quantidade = 1;

    if ($id <= 0 || empty($nome)) {
        throw new Exception("Dados inválidos");
    }

    /* =========================
       BUSCA PROJETO
    ========================= */
    $stmt = $conexao->prepare("
        SELECT p.*, 
               ped.id AS pedido_id, 
               ped.arquivo_caminho AS capa_atual
        FROM projetos p
        LEFT JOIN pedidos ped ON ped.projeto_id = p.id
        WHERE p.id = ? AND p.cliente_id = ?
        LIMIT 1
    ");

    $stmt->bind_param("ii", $id, $usuarioId);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows === 0) {
        throw new Exception("Projeto não encontrado");
    }

    $projeto = $res->fetch_assoc();
    $pedidoId = $projeto['pedido_id'] ?? null;

    /* =========================
       CAPA (UPLOAD SEGURO)
    ========================= */
    $capaAtual = $projeto['capa_atual'] ?? null;

    if (isset($_FILES['imagem_capa']) && $_FILES['imagem_capa']['error'] === UPLOAD_ERR_OK) {

        $ext = strtolower(pathinfo($_FILES['imagem_capa']['name'], PATHINFO_EXTENSION));
        $permitidas = ['png', 'jpg', 'jpeg'];

        if (!in_array($ext, $permitidas)) {
            throw new Exception("Formato de imagem inválido");
        }

        $dir = __DIR__ . '/../../../../uploads/capas/';
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        $nomeArquivo = uniqid('capa_') . '.' . $ext;

        if (!move_uploaded_file($_FILES['imagem_capa']['tmp_name'], $dir . $nomeArquivo)) {
            throw new Exception("Erro ao enviar imagem da capa");
        }

        $capaAtual = 'uploads/capas/' . $nomeArquivo;
    }

    /* =========================
       UPDATE PROJETO
    ========================= */
    $stmt = $conexao->prepare("
        UPDATE projetos
        SET nome_projeto = ?, descricao = ?, formato = ?
        WHERE id = ? AND cliente_id = ?
    ");

    $stmt->bind_param("sssii", $nome, $descricao, $formato, $id, $usuarioId);
    $stmt->execute();

    /* =========================
       UPDATE PEDIDO (SE EXISTIR)
    ========================= */
    if ($pedidoId) {

        $stmt = $conexao->prepare("
            UPDATE pedidos
            SET endereco_entrega = ?, quantidade = ?, arquivo_caminho = ?
            WHERE id = ?
        ");

        $stmt->bind_param("sisi", $endereco, $quantidade, $capaAtual, $pedidoId);
        $stmt->execute();
    }

    $conexao->commit();

    echo json_encode([
        'status' => 'sucesso',
        'mensagem' => 'Projeto atualizado com sucesso!'
    ]);

} catch (Exception $e) {

    $conexao->rollback();

    echo json_encode([
        'status' => 'erro',
        'mensagem' => $e->getMessage()
    ]);
}