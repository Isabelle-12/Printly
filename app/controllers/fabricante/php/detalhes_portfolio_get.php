<?php
    session_start();
    header('Content-Type: application/json; charset=utf-8');
    include_once(__DIR__ . '/../../../../config/conexao.php');

    $retorno = [
        'sucesso'     => false,
        'mensagem'    => '',
        'maker'       => null,
        'fotos'       => [],
        'materiais'   => [],
        'impressoras' => []
    ];

    try {
        if (!isset($_SESSION['id']))              throw new Exception('Usuário não autenticado.');
        if (!isset($_GET['id']) || !$_GET['id']) throw new Exception('ID do fabricante não informado.');

        $makerId = (int) $_GET['id'];

        /* ── DADOS DO MAKER ── */
        $stmt = $conexao->prepare("
            SELECT
                u.id                    AS maker_id,
                u.nome,
                u.email,
                u.cidade,
                u.estado,
                u.telefone,
                u.foto_perfil,
                u.disponivel_para_pedidos,
                f.nome_empresa,
                f.cnpj,
                f.email_comercial,
                f.telefone_comercial,
                f.endereco_empresa,
                f.foto_empresa,
                ROUND(AVG(a.nota), 1)   AS media_nota,
                COUNT(DISTINCT a.id)    AS total_avaliacoes
            FROM usuarios u
            INNER JOIN fabricantes f ON f.usuario_id = u.id
            LEFT JOIN  avaliacoes a  ON a.maker_id   = u.id
            WHERE u.id              = ?
            AND u.tipo_perfil     = 'MAKER'
            AND u.status          = 'ATIVO'
            AND u.status_fabricante = 'APROVADO'
            GROUP BY u.id, f.id
        ");
        if (!$stmt) throw new Exception($conexao->error);
        $stmt->bind_param('i', $makerId);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows <= 0) throw new Exception('Fabricante não encontrado.');
        $maker = $result->fetch_assoc();
        $stmt->close();

        /* ── FOTOS DO PORTFÓLIO ── */
        $stmt = $conexao->prepare("
            SELECT id, titulo, descricao, caminho_imagem, data_upload
            FROM portfolio_maker
            WHERE maker_id = ?
            ORDER BY data_upload DESC
        ");
        if (!$stmt) throw new Exception($conexao->error);
        $stmt->bind_param('i', $makerId);
        $stmt->execute();
        $fotos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        /* ── MATERIAIS com preço ── */
        $stmt = $conexao->prepare("
            SELECT id, tipo_material, preco_por_grama
            FROM materiais_maker
            WHERE maker_id = ?
            ORDER BY tipo_material ASC
        ");
        if (!$stmt) throw new Exception($conexao->error);
        $stmt->bind_param('i', $makerId);
        $stmt->execute();
        $materiais = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        /* ── IMPRESSORAS com tipo, quantidade e status ── */
        $stmt = $conexao->prepare("
            SELECT id, modelo, tipo_impressora, volume_maximo_cm3, quantidade, status
            FROM impressoras
            WHERE maker_id = ?
            ORDER BY modelo ASC
        ");
        if (!$stmt) throw new Exception($conexao->error);
        $stmt->bind_param('i', $makerId);
        $stmt->execute();
        $impressoras = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        $retorno['sucesso']     = true;
        $retorno['maker']       = $maker;
        $retorno['fotos']       = $fotos;
        $retorno['materiais']   = $materiais;
        $retorno['impressoras'] = $impressoras;

    } catch (Exception $e) {
        http_response_code(500);
        $retorno['mensagem'] = $e->getMessage();
    }

    echo json_encode($retorno, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>