<?php
include_once(__DIR__ . '/../../../config/conexao.php');

$retorno = [
    'status' => '',
    'mensagem' => '',
    'data' => []
];

if (isset($_GET['id'])) {
    $id = $_GET['id']; 


    $stmt = $conexao->prepare("SELECT usuario_id FROM fabricantes WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($result) {
        
        $usuario_id = $result['usuario_id'];

    
        $stmt = $conexao->prepare("SELECT status_fabricante FROM usuarios WHERE id = ?");
        $stmt->bind_param("i", $usuario_id);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$user) {
            $retorno = [
                'status' => 'No',
                'mensagem' => 'Usuário associado ao fabricante não encontrado.',
                'data' => []
            ];
        } else {
        
            $stmtCheck = $conexao->prepare("
                SELECT 
                    (SELECT COUNT(*) FROM pedidos WHERE maker_id = ?) AS total_pedidos,
                    (SELECT COUNT(*) FROM impressoras WHERE maker_id = ?) AS total_impressoras,
                    (SELECT COUNT(*) FROM materiais_maker WHERE maker_id = ?) AS total_materiais
            ");
            $stmtCheck->bind_param("iii", $usuario_id, $usuario_id, $usuario_id);
            $stmtCheck->execute();
            $check = $stmtCheck->get_result()->fetch_assoc();
            $stmtCheck->close();

            if ($check['total_pedidos'] > 0 || $check['total_impressoras'] > 0 || $check['total_materiais'] > 0) {
            
                $stmtUpdate = $conexao->prepare("
                    UPDATE usuarios 
                    SET status = 'BANIDO', status_fabricante = 'REJEITADO' 
                    WHERE id = ?
                ");
                $stmtUpdate->bind_param("i", $usuario_id);
                $stmtUpdate->execute();
                $stmtUpdate->close();

                $retorno = [
                    'status' => 'Ok',
                    'mensagem' => 'Fabricante desativado, pois possui registros vinculados.',
                    'data' => []
                ];
            } else {
            
                $stmtDel = $conexao->prepare("DELETE FROM usuarios WHERE id = ?");
                $stmtDel->bind_param("i", $usuario_id);
                $stmtDel->execute();
                $stmtDel->close();

                $stmtDelFab = $conexao->prepare("DELETE FROM fabricantes WHERE id = ?");
                $stmtDelFab->bind_param("i", $id);
                $stmtDelFab->execute();
                $stmtDelFab->close();

                $retorno = [
                    'status' => 'Ok',
                    'mensagem' => 'Fabricante excluído com sucesso.',
                    'data' => []
                ];
            }
        }
    } else {
        
        $stmtDel = $conexao->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmtDel->bind_param("i", $id);
        $stmtDel->execute();

        if ($stmtDel->affected_rows > 0) {
            $retorno = [
                'status' => 'Ok',
                'mensagem' => 'Usuário excluído com sucesso.',
                'data' => []
            ];
        } else {
            $retorno = [
                'status' => 'No',
                'mensagem' => 'Usuário não encontrado.',
                'data' => []
            ];
        }

        $stmtDel->close();
    }

} else {
    $retorno = [
        'status' => 'No',
        'mensagem' => 'É necessário informar um ID para excluir.',
        'data' => []
    ];
}

$conexao->close();
header("Content-Type: application/json; charset=utf-8");
echo json_encode($retorno);
?>