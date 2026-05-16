<?php
    session_start();
    header("Content-Type: application/json; charset=utf-8");

    include_once(__DIR__ . '/../../../../config/conexao.php');

    if (!isset($_SESSION['id'])) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Usuário não está logado.",
            "data" => []
        ]);
        exit;
    }

    $makerId = (int) $_SESSION['id'];

    $sqlMaker = "SELECT 
                    u.id,
                    u.nome,
                    u.email,
                    u.telefone,
                    u.cidade,
                    u.estado,
                    u.foto_perfil,
                    u.tipo_perfil,
                    u.status_fabricante,
                    f.nome_empresa,
                    f.email_comercial,  
                    f.foto_empresa,
                    f.cnpj,
                    f.telefone_comercial,
                    f.endereco_empresa
                FROM usuarios u
                LEFT JOIN fabricantes f ON f.usuario_id = u.id
                WHERE u.id = ?";

    $stmt = $conexao->prepare($sqlMaker);

    if (!$stmt) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Erro no prepare maker: " . $conexao->error,
            "data" => []
        ]);
        exit;
    }

    $stmt->bind_param("i", $makerId);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows === 0) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Maker não encontrado.",
            "data" => []
        ]);
        exit;
    }

    $maker = $resultado->fetch_assoc();
    $stmt->close();

    $sqlImpressoras = "SELECT 
                            id,
                            modelo,
                            tipo_impressora,
                            volume_maximo_cm3,
                            quantidade,
                            status
                    FROM impressoras
                    WHERE maker_id = ?";

    $stmtImp = $conexao->prepare($sqlImpressoras);

    if (!$stmtImp) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Erro no prepare impressoras: " . $conexao->error,
            "data" => []
        ]);
        exit;
    }

    $stmtImp->bind_param("i", $makerId);
    $stmtImp->execute();
    $resImp = $stmtImp->get_result();

    $impressoras = [];

    while ($row = $resImp->fetch_assoc()) {
        $impressoras[] = $row;
    }

    $stmtImp->close();

    $sqlMateriais = "SELECT 
                        id,
                        tipo_material,
                        preco_por_grama
                    FROM materiais_maker
                    WHERE maker_id = ?";

    $stmtMat = $conexao->prepare($sqlMateriais);

    if (!$stmtMat) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Erro no prepare materiais: " . $conexao->error,
            "data" => []
        ]);
        exit;
    }

    $stmtMat->bind_param("i", $makerId);
    $stmtMat->execute();
    $resMat = $stmtMat->get_result();

    $materiais = [];

    while ($row = $resMat->fetch_assoc()) {
        $materiais[] = $row;
    }

    $stmtMat->close();

    $sqlPortfolio = "SELECT 
                        id,
                        titulo,
                        descricao,
                        caminho_imagem,
                        data_upload
                    FROM portfolio_maker
                    WHERE maker_id = ?
                    ORDER BY data_upload DESC";

    $stmtPort = $conexao->prepare($sqlPortfolio);

    if (!$stmtPort) {
        echo json_encode([
            "status" => "nok",
            "mensagem" => "Erro no prepare portfolio: " . $conexao->error,
            "data" => []
        ]);
        exit;
    }

    $stmtPort->bind_param("i", $makerId);
    $stmtPort->execute();
    $resPort = $stmtPort->get_result();

    $fotos = [];

    while ($row = $resPort->fetch_assoc()) {
        $fotos[] = $row;
    }

    $stmtPort->close();

    echo json_encode([
        "status" => "ok",
        "mensagem" => "Portfólio carregado com sucesso.",
        "data" => [
            "maker" => $maker,
            "impressoras" => $impressoras,
            "materiais" => $materiais,
            "fotos" => $fotos
        ]
    ]);

    $conexao->close();
?>