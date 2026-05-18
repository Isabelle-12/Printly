<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

// Ajuste o caminho do seu arquivo de conexão se necessário
include_once(__DIR__ . '/../../../../config/conexao.php');

if (!isset($_SESSION['id'])) {
    echo json_encode(["status" => "nok", "mensagem" => "Usuário não está logado."]);
    exit;
}

$makerId = (int) $_SESSION['id'];

try {
    // Busca os pedidos que já saíram da fila de pendentes (Aceito, Em Produção ou Concluído)
    $sql = "SELECT id, nome_projeto, cliente_nome, status, valor_total, prazo_pedido 
            FROM view_pedidos_completos 
            WHERE maker_id = ? AND status IN ('ACEITO', 'EM_PRODUCAO', 'CONCLUIDO') 
            ORDER BY data_atualizacao DESC";
            
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("i", $makerId);
    $stmt->execute();
    $resultado = $stmt->get_result();

    $pedidos = [];
    while ($linha = $resultado->fetch_assoc()) {
        $pedidos[] = $linha;
    }

    echo json_encode(["status" => "ok", "data" => $pedidos]);

} catch (Exception $e) {
    echo json_encode(["status" => "nok", "mensagem" => "Erro no banco: " . $e->getMessage()]);
}

$stmt->close();
$conexao->close();
?>