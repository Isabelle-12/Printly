<?php

    session_start();
    header('Content-Type: application/json; charset=utf-8');

    include_once(__DIR__ . '/../../../../config/conexao.php');

    $retorno = [
        'sucesso' => false,
        'mensagem' => ''
    ];

    try {

        if (!isset($_SESSION['id'])) {
            throw new Exception('Usuário não autenticado.');
        }

        $cliente_id = $_SESSION['id'];

        // ─────────────────────────────
        // DADOS POST
        // ─────────────────────────────
        $maker_id     = $_POST['maker_id'] ?? null;
        $nome_projeto = $_POST['nome_projeto'] ?? null;
        $descricao    = $_POST['descricao'] ?? null;
        $quantidade   = (int)($_POST['quantidade'] ?? 1);
        $prazo        = $_POST['prazo'] ?: null;
        $endereco     = $_POST['endereco'] ?? null;
        $observacoes  = $_POST['observacoes'] ?? null;

        $partes = isset($_POST['partes'])
            ? json_decode($_POST['partes'], true)
            : [];

        if (!$maker_id || !$nome_projeto || !$descricao || !$endereco) {
            throw new Exception('Campos obrigatórios não preenchidos.');
        }

        // ─────────────────────────────
        // UPLOAD ARQUIVO PRINCIPAL
        // ─────────────────────────────
        $arquivo_path = null;

        if (!empty($_FILES['arquivo_3d']) && $_FILES['arquivo_3d']['error'] === 0) {

            $ext = pathinfo($_FILES['arquivo_3d']['name'], PATHINFO_EXTENSION);
            $nomeArquivo = uniqid('proj_') . '.' . $ext;

            $caminho = __DIR__ . '/../../../../uploads/projetos/';

            if (!is_dir($caminho)) {
                mkdir($caminho, 0777, true);
            }

            move_uploaded_file(
                $_FILES['arquivo_3d']['tmp_name'],
                $caminho . $nomeArquivo
            );

            $arquivo_path = 'uploads/projetos/' . $nomeArquivo;
        }

        // ─────────────────────────────
        // 1. CRIAR PROJETO
        // ─────────────────────────────
        $stmt = $conexao->prepare("
            INSERT INTO projetos (
                cliente_id,
                nome_projeto,
                descricao,
                arquivo_caminho,
                formato,
                status
            ) VALUES (?, ?, ?, ?, 'STL', 'AGUARDANDO_ORCAMENTO')
        ");

        $stmt->bind_param(
            "isss",
            $cliente_id,
            $nome_projeto,
            $descricao,
            $arquivo_path
        );

        $stmt->execute();

        $projeto_id = $stmt->insert_id;
        $stmt->close();

        // ─────────────────────────────
        // 2. CRIAR PEDIDO
        // ─────────────────────────────
        $stmt = $conexao->prepare("
            INSERT INTO pedidos (
                projeto_id,
                maker_id,
                material_escolhido,
                quantidade,
                valor_total,
                status,
                endereco_entrega,
                prazo_pedido
            ) VALUES (?, ?, '', ?, 0, 'AGUARDANDO_CONFIRMACAO', ?, ?)
        ");

        $stmt->bind_param(
            "iiiss",
            $projeto_id,
            $maker_id,
            $quantidade,
            $endereco,
            $prazo
        );

        $stmt->execute();

        $pedido_id = $stmt->insert_id;
        $stmt->close();

        // ─────────────────────────────
        // 3. PARTES DO PEDIDO
        // ─────────────────────────────
        if (!empty($partes)) {

            $stmt = $conexao->prepare("
                INSERT INTO partes_pedido (
                    pedido_id,
                    nome,
                    descricao,
                    material,
                    cor,
                    quantidade
                ) VALUES (?, ?, ?, ?, ?, ?)
            ");

            foreach ($partes as $parte) {

                $stmt->bind_param(
                    "issssi",
                    $pedido_id,
                    $parte['nome'],
                    $parte['descricao'],
                    $parte['material'],
                    $parte['cor'],
                    $parte['quantidade']
                );

                $stmt->execute();
            }

            $stmt->close();
        }

        // ─────────────────────────────
        // SUCESSO
        // ─────────────────────────────
        $retorno['sucesso'] = true;
        $retorno['mensagem'] = 'Pedido criado com sucesso!';
        $retorno['pedido_id'] = $pedido_id;

    } catch (Exception $e) {

        http_response_code(500);
        $retorno['mensagem'] = $e->getMessage();
    }

    echo json_encode($retorno, JSON_UNESCAPED_UNICODE);
?>