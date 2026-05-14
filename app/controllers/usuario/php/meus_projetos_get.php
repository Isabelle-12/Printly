<?php
    session_start();
    header("Content-Type: application/json; charset=utf-8");

    include_once(__DIR__ . '/../../../../config/conexao.php');

    $retorno = [
        'status'   => 'erro',
        'mensagem' => '',
        'data'     => []
    ];

    if (!isset($_SESSION['id'])) {
        echo json_encode([
            'status' => 'erro',
            'mensagem' => 'Usuário não autenticado.'
        ]);
        exit;
    }

    $id_usuario = $_SESSION['id'];

    try {

        $stmt = $conexao->prepare("
            SELECT *
            FROM view_pedidos_completos
            WHERE cliente_id = ?
            ORDER BY data_solicitacao DESC
        ");

        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();

        $resultado = $stmt->get_result();

        $tabela = [];

        while ($linha = $resultado->fetch_assoc()) {
            $tabela[] = $linha;
        }

        $retorno = [
            'status'   => count($tabela) > 0 ? 'ok' : 'no',
            'mensagem' => count($tabela) > 0 ? 'Pedidos encontrados.' : 'Nenhum pedido encontrado.',
            'data'     => $tabela
        ];

        $stmt->close();

    } catch (Exception $e) {
        $retorno['status'] = 'erro';
        $retorno['mensagem'] = 'Erro no banco: ' . $e->getMessage();
    }

    $conexao->close();
    echo json_encode($retorno);
?>