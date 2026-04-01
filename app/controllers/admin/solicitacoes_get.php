<?php
header('Content-Type: application/json; charset=utf-8');

// Caminho exato para o seu arquivo de conexão
require_once __DIR__ . "/../../../config/conexao.php";

try {
    // SQL para buscar os dados das tabelas relacionadas
    $sql = "SELECT u.id, u.nome, u.cidade, f.cnpj, 
            (SELECT GROUP_CONCAT(modelo SEPARATOR ', ') FROM impressoras WHERE maker_id = u.id) as impressora,
            (SELECT GROUP_CONCAT(tipo_material SEPARATOR ', ') FROM materiais_maker WHERE maker_id = u.id) as materiais
            FROM usuarios u
            JOIN fabricantes f ON u.id = f.usuario_id
            WHERE u.status_fabricante = 'PENDENTE'";

    $resultado = $conexao->query($sql);

    $dados = [];
    if ($resultado && $resultado->num_rows > 0) {
        while ($linha = $resultado->fetch_assoc()) {
            $dados[] = $linha;
        }
        echo json_encode(["status" => "ok", "data" => $dados]);
    } else {
        echo json_encode(["status" => "vazio", "data" => []]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "erro", "mensagem" => $e->getMessage()]);
}

$conexao->close();
