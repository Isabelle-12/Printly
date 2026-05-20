
<?php
session_start();
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(0);

require_once(__DIR__ . '/../../../../config/conexao.php');

$retorno = ['status' => 'erro', 'mensagem' => ''];

if (!isset($_SESSION['email']) || !isset($_SESSION['id'])) {
    $retorno['mensagem'] = 'Usuário não autenticado';
    echo json_encode($retorno);
    exit;
}

if (!isset($_SESSION['usuario_email'])) {
    $_SESSION['usuario_email'] = $_SESSION['email'];
}

try {
    $usuarioId = (int)$_SESSION['id'];

    // ── A view_pedidos_completos usa pr.arquivo_caminho (do projeto = arquivo 3D)
    // ── p.arquivo_caminho é a IMAGEM DE CAPA salva em uploads/capas/ pelo criar_pedido_post.php
    // ── Por isso buscamos os dois separadamente aqui
    $sql = "
        SELECT
            p.id,
            p.projeto_id,
            p.status                AS status_solicitacao,
            p.valor_total,
            p.quantidade,
            p.data_solicitacao,
            p.prazo_pedido,
            p.motivo_recusa,
            p.maker_id,
            p.arquivo_caminho       AS imagem_capa,
            p.endereco_entrega AS endereco_entrega,

            pr.nome_projeto,
            pr.descricao,
            pr.formato,
            pr.arquivo_caminho      AS arquivo_3d,

            m.nome                  AS maker_nome,

            (SELECT COUNT(*) FROM partes_pedido pp WHERE pp.pedido_id = p.id) AS total_partes

        FROM pedidos p
        JOIN projetos pr ON pr.id = p.projeto_id
        JOIN usuarios c  ON c.id  = pr.cliente_id
        JOIN usuarios m  ON m.id  = p.maker_id
        WHERE c.id = ?
        ORDER BY p.data_solicitacao DESC
    ";

    $stmt = $conexao->prepare($sql);
    if (!$stmt) throw new Exception("Erro no prepare: " . $conexao->error);

    $stmt->bind_param("i", $usuarioId);
    $stmt->execute();

    $projetos = [];
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) {
        $projetos[] = $row;
    }
    $stmt->close();

    $retorno['status']   = 'sucesso';
    $retorno['mensagem'] = 'Projetos listados com sucesso';
    $retorno['projetos'] = $projetos;

} catch (Exception $e) {
    error_log("Erro em meus_projetos_get.php: " . $e->getMessage());
    $retorno['status']   = 'erro';
    $retorno['mensagem'] = 'Erro interno no servidor ao carregar listagem.';
}

echo json_encode($retorno);
