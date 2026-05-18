<?php
session_set_cookie_params(0, '/Printly/'); 
session_start();

header('Content-Type: application/json');

// Usando a chave de sessão padronizada
if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'erro', 'mensagem' => 'Sessão expirada.']);
    exit;
}

require_once(__DIR__ . '/../../../../config/conexao.php');

$dados = $_POST;

try {
    $usuarioId = $_SESSION['id'];
    $id = intval($dados['editar_id']);
    $nome = trim($dados['editar_nome']);
    $descricao = trim($dados['editar_descricao'] ?? '');
    $formato = $dados['formato'] ?? 'STL';
    
    // 1. Validar se o projeto pertence ao usuário
    // AJUSTE: arquivo_caminho conforme seu SQL
    // Nota: Removi a coluna 'imagem_capa' pois ela não existe na sua tabela 'projetos' do SQL enviado
    $sqlBusca = "SELECT id, arquivo_caminho FROM projetos WHERE id = ? AND cliente_id = ? LIMIT 1";
    $stmtBusca = $conexao->prepare($sqlBusca);
    $stmtBusca->bind_param("ii", $id, $usuarioId);
    $stmtBusca->execute();
    $resultado = $stmtBusca->get_result();

    if ($resultado->num_rows <= 0) throw new Exception('Projeto não encontrado ou acesso negado.');
    $projetoAtual = $resultado->fetch_assoc();

    $conexao->begin_transaction();

    // 2. Lógica de Upload de Arquivo 3D
    $caminhoArquivo = $projetoAtual['arquivo_caminho'];
    $diretorio = "../../../../../assets/uploads/projetos/"; 

    if (!empty($_FILES['arquivo']['name'])) {
        $ext = pathinfo($_FILES['arquivo']['name'], PATHINFO_EXTENSION);
        $novoNomeArquivo = "projeto_" . $id . "_" . time() . "." . $ext;
        
        if(move_uploaded_file($_FILES['arquivo']['tmp_name'], $diretorio . $novoNomeArquivo)){
            $caminhoArquivo = $novoNomeArquivo;
        }
    }

    // 3. Update do Projeto Principal
    // AJUSTE: Colunas conforme sua tabela 'projetos'
    $sqlUpdate = "UPDATE projetos SET 
                    nome_projeto = ?, 
                    descricao = ?, 
                    formato = ?, 
                    arquivo_caminho = ?
                  WHERE id = ? AND cliente_id = ?";
    
    $stmtUpdate = $conexao->prepare($sqlUpdate);
    $stmtUpdate->bind_param("ssssii", $nome, $descricao, $formato, $caminhoArquivo, $id, $usuarioId);
    $stmtUpdate->execute();

    // 4. Lógica de Partes (Tabela: partes_pedido)
    // Note que seu SQL cria a tabela 'partes_pedido' vinculada a um PEDIDO e não ao PROJETO diretamente.
    // Se você quiser salvar partes ANTES de ter um pedido, precisaria de uma tabela 'partes_projeto'.
    // Vou assumir que você está salvando na 'partes_pedido' por enquanto:
    
    // Primeiro, precisamos descobrir se existe um pedido vinculado a esse projeto
    $resPedido = $conexao->query("SELECT id FROM pedidos WHERE projeto_id = $id LIMIT 1");
    if ($resPedido->num_rows > 0) {
        $pedidoId = $resPedido->fetch_assoc()['id'];

        // Limpa partes antigas do pedido
        $stmtDel = $conexao->prepare("DELETE FROM partes_pedido WHERE pedido_id = ?");
        $stmtDel->bind_param("i", $pedidoId);
        $stmtDel->execute();

        if (isset($dados['partes_nomes']) && is_array($dados['partes_nomes'])) {
            // Colunas: pedido_id, nome, material, cor, quantidade
            $sqlInsParte = "INSERT INTO partes_pedido (pedido_id, nome, material, cor, quantidade) VALUES (?, ?, ?, ?, ?)";
            $stmtIns = $conexao->prepare($sqlInsParte);
            
            foreach ($dados['partes_nomes'] as $index => $nomeParte) {
                $nomeParte = trim($nomeParte);
                if (empty($nomeParte)) continue;

                $material = $dados['partes_materiais'][$index] ?? 'PLA';
                $cor = $dados['partes_cores'][$index] ?? 'Branco';
                $qtdParte = intval($dados['partes_quantidades'][$index] ?? 1);
                
                $stmtIns->bind_param("isssi", $pedidoId, $nomeParte, $material, $cor, $qtdParte);
                $stmtIns->execute();
            }
        }
    }

    $conexao->commit();
    echo json_encode(['status' => 'sucesso', 'mensagem' => 'Projeto atualizado com sucesso!']);

} catch (Exception $e) {
    if (isset($conexao)) $conexao->rollback();
    echo json_encode(['status' => 'erro', 'mensagem' => $e->getMessage()]);
}