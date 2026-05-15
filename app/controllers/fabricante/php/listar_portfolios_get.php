<?php
    session_start();
    header("Content-Type: application/json; charset=utf-8");
    include_once(__DIR__ . '/../../../../config/conexao.php');

    if (!isset($_SESSION['id'])) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário não autenticado.']);
        exit;
    }

    if (!isset($conexao)) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Falha na conexão com o banco.']);
        exit;
    }

    try {
        $sql = "
            SELECT 
                u.id AS maker_id,
                u.nome,
                u.cidade,
                u.estado,
                u.foto_perfil,
                u.disponivel_para_pedidos,

                ROUND(AVG(a.nota), 1) AS media_nota,
                COUNT(DISTINCT a.id) AS total_avaliacoes,
                COUNT(DISTINCT pm.id) AS total_fotos

            FROM usuarios u

            LEFT JOIN avaliacoes a ON a.maker_id = u.id
            LEFT JOIN portfolio_maker pm ON pm.maker_id = u.id

            WHERE u.tipo_perfil = 'MAKER'
            AND u.status = 'ATIVO'
            AND u.status_fabricante = 'APROVADO'

            GROUP BY 
                u.id,
                u.nome,
                u.cidade,
                u.estado,
                u.foto_perfil,
                u.disponivel_para_pedidos

            ORDER BY total_avaliacoes DESC, media_nota DESC
        ";

        $result = $conexao->query($sql);
        if (!$result) throw new Exception($conexao->error);

        $makers = [];
        while ($row = $result->fetch_assoc()) {
            $makers[] = $row;
        }

        foreach ($makers as &$maker) {
            // Fotos do portfólio
            $stmt = $conexao->prepare("
                SELECT id, titulo, caminho_imagem
                FROM portfolio_maker
                WHERE maker_id = ?
                ORDER BY data_upload DESC
                LIMIT 4
            ");
            $stmt->bind_param('i', $maker['maker_id']);
            $stmt->execute();
            $maker['fotos'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();

            // Materiais
            $stmt2 = $conexao->prepare("
                SELECT tipo_material
                FROM materiais_maker
                WHERE maker_id = ?
                LIMIT 5
            ");
            $stmt2->bind_param('i', $maker['maker_id']);
            $stmt2->execute();
            $rows = $stmt2->get_result()->fetch_all(MYSQLI_ASSOC);
            $maker['materiais'] = array_column($rows, 'tipo_material');
            $stmt2->close();
        }

        echo json_encode(['sucesso' => true, 'makers' => $makers]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => $e->getMessage()]);
    }

?>