<?php

function getPedidosExpirados($conexao) {
    $query = 'SELECT p.id, p.projeto_id, p.maker_id, p.data_solicitacao, p.status, u.nome AS cliente, u.email
              FROM pedidos p
              JOIN usuarios u ON u.id = p.maker_id
              WHERE p.status != "CONCLUIDO" AND p.prazo_pedido IS NOT NULL AND p.prazo_pedido < NOW()';
    $result = $conexao->query($query);
    return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
}

function getAllPedidos($conexao) {
    $stmt = $conexao->prepare('SELECT * FROM pedidos');
    $stmt->execute();
    $res = $stmt->get_result();
    $data = $res->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    return $data;
}

function getPedidoById($conexao, $id) {
    $stmt = $conexao->prepare('SELECT * FROM pedidos WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $res = $stmt->get_result();
    $data = $res->fetch_assoc();
    $stmt->close();
    return $data;
}

?>