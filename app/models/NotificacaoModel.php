<?php

function getAnunciosAtivos($conexao) {
    $query = 'SELECT * FROM anuncios_globais WHERE data_inicio <= NOW() AND data_fim >= NOW() ORDER BY data_inicio DESC';
    $result = $conexao->query($query);
    return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
}

function insertAnuncio($conexao, $resposta) {
    $stmt = $conexao->prepare('INSERT INTO anuncios_globais (titulo, mensagem, data_inicio, data_fim) VALUES (?, ?, ?, ?)');
    $stmt->bind_param('ssss', $resposta['titulo'], $resposta['mensagem'], $resposta['data_inicio'], $resposta['data_fim']);
    $stmt->execute();
    $retorno = $stmt->affected_rows;
    $stmt->close();
    return $retorno;
}

function getNotificacoesEnviadas($conexao) {
    $query = 'SELECT * FROM notificacoes ORDER BY data_envio DESC';
    $result = $conexao->query($query);
    return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
}

function updateRetratarNotificacao($conexao, $id) {
    $stmt = $conexao->prepare('UPDATE notificacoes SET retratada = 1 WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $retorno = $stmt->affected_rows;
    $stmt->close();
    return $retorno;
}

function insertNotificacaoAtraso($conexao, $pedido_id, $titulo, $mensagem, $email_destino) {
    $stmt = $conexao->prepare('INSERT INTO notificacoes (tipo, pedido_id, titulo, mensagem, email_destino) VALUES ("ATRASO", ?, ?, ?, ?)');
    $stmt->bind_param('isss', $pedido_id, $titulo, $mensagem, $email_destino);
    $stmt->execute();
    $retorno = $stmt->affected_rows;
    $stmt->close();
    return $retorno;
}

?>