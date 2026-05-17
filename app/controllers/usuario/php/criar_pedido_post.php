<?php
    session_start();
    header('Content-Type: application/json; charset=utf-8');
    include_once(__DIR__ . '/../../../../config/conexao.php');

    $retorno = ['sucesso' => false, 'mensagem' => ''];

    try {
        if (!isset($_SESSION['id'])) throw new Exception('Usuário não autenticado.');

        $cliente_id   = $_SESSION['id'];
        $maker_id     = isset($_POST['maker_id'])     ? (int)$_POST['maker_id']     : null;
        $nome_projeto = trim($_POST['nome_projeto']   ?? '');
        $descricao    = trim($_POST['descricao']      ?? '');
        $quantidade   = (int)($_POST['quantidade']    ?? 1);
        $prazo        = !empty($_POST['prazo'])        ? $_POST['prazo']        : null;
        $endereco     = trim($_POST['endereco']       ?? '');
        $observacoes  = trim($_POST['observacoes']    ?? '');
        $partes       = isset($_POST['partes'])        ? json_decode($_POST['partes'], true) : [];

        // Validações básicas
        if (!$maker_id)     throw new Exception('Fabricante não informado.');
        if (!$nome_projeto) throw new Exception('Nome do projeto é obrigatório.');
        if (!$descricao)    throw new Exception('Descrição é obrigatória.');
        if (!$endereco)     throw new Exception('Endereço de entrega é obrigatório.');
        if (empty($partes)) throw new Exception('Adicione ao menos uma parte ao pedido.');

        // ─────────────────────────────
        // UPLOAD — ARQUIVO 3D
        // ─────────────────────────────
        $arquivo_path = $arquivo_path ?? '';

        if (!empty($_FILES['arquivo_3d']) && $_FILES['arquivo_3d']['error'] === UPLOAD_ERR_OK) {

            $ext = strtolower(pathinfo($_FILES['arquivo_3d']['name'], PATHINFO_EXTENSION));
            $extPermitidas = ['stl', 'obj'];

            if (!in_array($ext, $extPermitidas)) {
                throw new Exception('Formato do arquivo 3D inválido. Use STL ou OBJ.');
            }

            $dir = __DIR__ . '/../../../../uploads/projetos/';
            if (!is_dir($dir)) mkdir($dir, 0777, true);

            $nomeArquivo = uniqid('proj_') . '.' . $ext;
            move_uploaded_file($_FILES['arquivo_3d']['tmp_name'], $dir . $nomeArquivo);
            $arquivo_path = 'uploads/projetos/' . $nomeArquivo;

        } 

        // ─────────────────────────────
        // UPLOAD — IMAGEM DE CAPA (opcional)
        // ─────────────────────────────
        $capa_path = null;

        if (!empty($_FILES['imagem_capa']) && $_FILES['imagem_capa']['error'] === UPLOAD_ERR_OK) {

            $extCapa = strtolower(pathinfo($_FILES['imagem_capa']['name'], PATHINFO_EXTENSION));
            $extCapaPermitidas = ['png', 'jpg', 'jpeg'];

            if (in_array($extCapa, $extCapaPermitidas)) {
                $dir = __DIR__ . '/../../../../uploads/capas/';
                if (!is_dir($dir)) mkdir($dir, 0777, true);

                $nomeCapa = uniqid('capa_') . '.' . $extCapa;
                move_uploaded_file($_FILES['imagem_capa']['tmp_name'], $dir . $nomeCapa);
                $capa_path = 'uploads/capas/' . $nomeCapa;
            }
        }

        // Detecta formato pelo arquivo 3D
        $formato = strtoupper(pathinfo($arquivo_path, PATHINFO_EXTENSION));
        if (!in_array($formato, ['STL', 'OBJ'])) $formato = 'STL';

        // ─────────────────────────────
        // 1. CRIAR PROJETO
        // ─────────────────────────────
        $stmt = $conexao->prepare("
            INSERT INTO projetos (
                cliente_id, nome_projeto, descricao,
                arquivo_caminho, formato, status
            ) VALUES (?, ?, ?, ?, ?, 'AGUARDANDO_ORCAMENTO')
        ");
        $stmt->bind_param('issss', $cliente_id, $nome_projeto, $descricao, $arquivo_path, $formato);
        $stmt->execute();
        $projeto_id = $stmt->insert_id;
        $stmt->close();

        // Salva imagem de capa se tiver — reutiliza campo arquivo_caminho de projetos
        // ou cria coluna separada. Como não há coluna de capa em projetos, salvamos em uploads/capas
        // e guardamos o caminho nas observações ou em campo futuro. Por ora registramos no log.

        // ─────────────────────────────
        // 2. CRIAR PEDIDO
        // ─────────────────────────────
        $stmt = $conexao->prepare("
            INSERT INTO pedidos (
                projeto_id, maker_id, material_escolhido,
                quantidade, valor_total, status,
                endereco_entrega, prazo_pedido, arquivo_caminho
            ) VALUES (?, ?, '', ?, 0, 'AGUARDANDO_CONFIRMACAO', ?, ?, ?)
        ");
        $stmt->bind_param('iiisss', $projeto_id, $maker_id, $quantidade, $endereco, $prazo, $capa_path);
        $stmt->execute();
        $pedido_id = $stmt->insert_id;
        $stmt->close();

        // ─────────────────────────────
        // 3. PARTES DO PEDIDO
        // ─────────────────────────────
        $stmt = $conexao->prepare("
            INSERT INTO partes_pedido (pedido_id, nome, descricao, material, cor, quantidade)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        foreach ($partes as $parte) {
            $nomeParte  = trim($parte['nome']      ?? '');
            $descParte  = trim($parte['descricao'] ?? '');
            $matParte   = trim($parte['material']  ?? '');
            $corParte   = trim($parte['cor']       ?? '');
            $qtdParte   = (int)($parte['quantidade'] ?? 1);

            if (!$nomeParte || !$matParte || !$corParte) continue;

            $stmt->bind_param('issssi', $pedido_id, $nomeParte, $descParte, $matParte, $corParte, $qtdParte);
            $stmt->execute();
        }
        $stmt->close();

        // ─────────────────────────────
        // 4. HISTÓRICO DE STATUS
        // ─────────────────────────────
        $stmt = $conexao->prepare("
            INSERT INTO historico_status_pedido (pedido_id, status_anterior, status_novo, alterado_por, observacao)
            VALUES (?, NULL, 'AGUARDANDO_CONFIRMACAO', ?, 'Pedido criado pelo cliente.')
        ");
        $stmt->bind_param('ii', $pedido_id, $cliente_id);
        $stmt->execute();
        $stmt->close();

        $retorno['sucesso']   = true;
        $retorno['mensagem']  = 'Pedido criado com sucesso!';
        $retorno['pedido_id'] = $pedido_id;

    } catch (Exception $e) {
        http_response_code(500);
        $retorno['mensagem'] = $e->getMessage();
    }

    echo json_encode($retorno, JSON_UNESCAPED_UNICODE);
?>