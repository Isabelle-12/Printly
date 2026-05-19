<?php
session_set_cookie_params(0, '/Printly/'); 
session_start();

header('Content-Type: application/json; charset=utf-8');

ini_set('display_errors', 0);
error_reporting(0);

$retorno = ['status' => 'erro', 'mensagem' => ''];

/*
=========================
VALIDAR E ADAPTAR SESSÃO
=========================
*/
if (!isset($_SESSION['email']) || !isset($_SESSION['id'])) {
    $retorno['mensagem'] = 'Sessão expirada ou usuário não autenticado.';
    echo json_encode($retorno, JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isset($_SESSION['usuario_email'])) {
    $_SESSION['usuario_email'] = $_SESSION['email'];
}

require_once(__DIR__ . '/../../../../config/conexao.php');

$dados = $_POST;

try {
    $usuarioId = (int)$_SESSION['id']; 
    $id = isset($dados['editar_id']) ? intval($dados['editar_id']) : 0;
    $nome = isset($dados['editar_nome']) ? trim($dados['editar_nome']) : '';
    $descricao = isset($dados['editar_descricao']) ? trim($dados['editar_descricao']) : '';
    $formato = $dados['formato'] ?? 'STL';
    
    // Captura a quantidade enviada pelo input do modal. 
    // O fallback tenta 'editar_quantidade', 'quantidade' ou assume 1.
    $quantidadeInformada = isset($dados['editar_quantidade']) ? intval($dados['editar_quantidade']) : (isset($dados['quantidade']) ? intval($dados['quantidade']) : 1);
    if ($quantidadeInformada < 1) $quantidadeInformada = 1;

    if ($id <= 0 || empty($nome)) {
        throw new Exception('Dados obrigatórios não preenchidos ou inválidos.');
    }
    
    /*
    ==================================================
    1. VALIDAR PROPRIEDADE E TRAVA DE STATUS DO BANCO
    ==================================================
    */
    $sqlBusca = "SELECT id, status, arquivo_caminho FROM projetos WHERE id = ? AND cliente_id = ? LIMIT 1";
    $stmtBusca = $conexao->prepare($sqlBusca);
    $stmtBusca->bind_param("ii", $id, $usuarioId);
    $stmtBusca->execute();
    $resultado = $stmtBusca->get_result();

    if ($resultado->num_rows <= 0) {
        throw new Exception('Projeto não encontrado ou acesso negado.');
    }
    
    $projetoAtual = $resultado->fetch_assoc();
    $stmtBusca->close();

    $statusAtual = strtoupper(trim($projetoAtual['status']));
    if ($statusAtual === 'EM_PRODUCAO' || $statusAtual === 'CONCLUIDO') {
        throw new Exception('Este projeto já está em produção ou concluído e não pode mais ser editado.');
    }

    $conexao->begin_transaction();

    /*
    ==================================================
    2. LÓGICA DE UPLOAD DE ARQUIVO 3D
    ==================================================
    */
    $caminhoArquivo = $projetoAtual['arquivo_caminho'];
    $diretorioFisico = __DIR__ . '/../../../../uploads/'; 

    if (!empty($_FILES['arquivo']['name'])) {
        $ext = strtolower(pathinfo($_FILES['arquivo']['name'], PATHINFO_EXTENSION));
        
        $extensoesPermitidas = ['stl', 'obj', '3mf', 'step', 'png', 'jpg', 'jpeg'];
        if (!in_array($ext, $extensoesPermitidas)) {
            throw new Exception('Extensão de arquivo não permitida para o projeto.');
        }

        $novoNomeArquivo = "projeto_" . $id . "_" . time() . "." . $ext;
        
        if (!is_dir($diretorioFisico)) {
            mkdir($diretorioFisico, 0755, true);
        }
        
        if (move_uploaded_file($_FILES['arquivo']['tmp_name'], $diretorioFisico . $novoNomeArquivo)) {
            if (!empty($projetoAtual['arquivo_caminho']) && file_exists($diretorioFisico . $projetoAtual['arquivo_caminho'])) {
                @unlink($diretorioFisico . $projetoAtual['arquivo_caminho']);
            }
            $caminhoArquivo = $novoNomeArquivo;
        } else {
            throw new Exception('Falha ao salvar o arquivo enviado na pasta uploads do servidor.');
        }
    }

    /*
    ==================================================
    3. UPDATE DO PROJETO PRINCIPAL
    ==================================================
    */
    $sqlUpdate = "UPDATE projetos SET 
                    nome_projeto = ?, 
                    descricao = ?, 
                    formato = ?, 
                    arquivo_caminho = ?
                  WHERE id = ? AND cliente_id = ?";
    
    $stmtUpdate = $conexao->prepare($sqlUpdate);
    $stmtUpdate->bind_param("ssssii", $nome, $descricao, $formato, $caminhoArquivo, $id, $usuarioId);
    $stmtUpdate->execute();
    $stmtUpdate->close();

    /*
    ==================================================
    4. LÓGICA DE QUANTIDADE NA TABELA DE PEDIDOS
    ==================================================
    Garante que a quantidade seja alterada diretamente na tabela que a View lê.
    */
    $sqlPedido = "SELECT id FROM pedidos WHERE projeto_id = ? LIMIT 1";
    $stmtPedido = $conexao->prepare($sqlPedido);
    $stmtPedido->bind_param("i", $id);
    $stmtPedido->execute();
    $resPedido = $stmtPedido->get_result();
    
    if ($resPedido->num_rows > 0) {
        $pedidoId = $resPedido->fetch_assoc()['id'];
        $stmtPedido->close();
        
        // Se o pedido já existe, atualizamos a quantidade dele
        $sqlUpdatePedido = "UPDATE pedidos SET quantidade = ? WHERE id = ?";
        $stmtUpPed = $conexao->prepare($sqlUpdatePedido);
        $stmtUpPed->bind_param("ii", $quantidadeInformada, $pedidoId);
        $stmtUpPed->execute();
        $stmtUpPed->close();
    } else {
        $stmtPedido->close();
        // Se for rascunho, cria o pedido já aplicando a quantidade correta informada
        $sqlInsPedido = "INSERT INTO pedidos (projeto_id, cliente_id, status, quantidade, data_solicitacao) VALUES (?, ?, 'RASCUNHO', ?, NOW())";
        $stmtInsPedido = $conexao->prepare($sqlInsPedido);
        $stmtInsPedido->bind_param("iii", $id, $usuarioId, $quantidadeInformada);
        $stmtInsPedido->execute();
        $pedidoId = $conexao->insert_id;
        $stmtInsPedido->close();
    }

    /*
    ==================================================
    5. LÓGICA DE PARTES DINÂMICAS (partes_pedido)
    ==================================================
    */
    // Limpa as partes antigas vinculadas ao pedidoId obtido/criado acima
    $stmtDel = $conexao->prepare("DELETE FROM partes_pedido WHERE pedido_id = ?");
    $stmtDel->bind_param("i", $pedidoId);
    $stmtDel->execute();
    $stmtDel->close();

    // Se houverem partes vindas do formulário, faz a inserção
    if (isset($dados['partes_nomes']) && is_array($dados['partes_nomes'])) {
        $sqlInsParte = "INSERT INTO partes_pedido (pedido_id, nome, material, cor, quantidade) VALUES (?, ?, ?, ?, ?)";
        $stmtIns = $conexao->prepare($sqlInsParte);
        
        foreach ($dados['partes_nomes'] as $index => $nomeParte) {
            $nomeParte = trim($nomeParte);
            if (empty($nomeParte)) continue;

            $material = $dados['partes_materiais'][$index] ?? 'PLA';
            $cor = $dados['partes_cores'][$index] ?? 'Branco';
            $qtdParte = intval($dados['partes_quantidades'][$index] ?? 1);
            if ($qtdParte < 1) $qtdParte = 1;
            
            $stmtIns->bind_param("isssi", $pedidoId, $nomeParte, $material, $cor, $qtdParte);
            $stmtIns->execute();
        }
        $stmtIns->close();
    }

    $conexao->commit();
    
    $retorno['status'] = 'sucesso';
    $retorno['mensagem'] = 'Projeto e especificações atualizados com sucesso!';

} catch (Exception $e) {
    if (isset($conexao) && $conexao->ping()) {
        $conexao->rollback();
    }
    error_log("Erro em editar_projeto.php: " . $e->getMessage());
    $retorno['status'] = 'erro';
    $retorno['mensagem'] = $e->getMessage();
}

echo json_encode($retorno, JSON_UNESCAPED_UNICODE);