<?php
//leitura da tabela de usuarios então ele seleciona a tabela e mostra os usuarios cadastrados
include_once(__DIR__ . '/../../../config/conexao.php');
    $retorno = [
        'status'    => '', 
        'mensagem'  => '', 
        'data'      => []
    ];

    $stmt = $conexao->prepare("SELECT * FROM usuarios WHERE tipo_perfil = 'ADMIN' ORDER BY nome");
    $stmt->execute();
    $resultado = $stmt->get_result();


    $tabela = [];
    if($resultado -> num_rows >0){
        while($linha = $resultado ->fetch_assoc()){
            $tabela[] = $linha;
        }
        $retorno = [
            'status'    => 'ok', 
            'mensagem'  => 'Sucesso, usuario encontrado.', 
            'data'      => $tabela
        ];
    }else{
            $retorno = [
                'status'    => 'No', 
                'mensagem'  => 'Não há usuarios cadastrados.', 
                'data'      => []
            ];
        }
    

    $stmt -> close();
    $conexao -> close();
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode($retorno);