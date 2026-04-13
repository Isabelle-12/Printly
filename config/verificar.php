<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

include_once(__DIR__ . '/conexao.php');

if (!isset($_SESSION['id'])) {
    echo json_encode([
        "logado" => false
    ]);
    exit;
}

// mudança: agora a sessão é validada no banco para saber se o usuário ainda existe e se não foi banido
$id = (int) $_SESSION['id'];

$stmt = $conexao->prepare("SELECT id, email, tipo_perfil, status, status_fabricante FROM usuarios WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 0) {
    // mudança: se o usuário foi excluído, derruba a sessão
    session_unset();
    session_destroy();

    echo json_encode([
        "logado" => false
    ]);
    $stmt->close();
    $conexao->close();
    exit;
}

$usuario = $resultado->fetch_assoc();

if ($usuario['status'] === 'BANIDO') {
    // mudança: se o usuário foi banido, derruba a sessão
    session_unset();
    session_destroy();

    echo json_encode([
        "logado" => false
    ]);
    $stmt->close();
    $conexao->close();
    exit;
}

// mudança: atualiza a sessão com os dados mais recentes do banco
$_SESSION['email'] = $usuario['email'];
$_SESSION['tipo'] = $usuario['tipo_perfil'];
$_SESSION['status_fabricante'] = $usuario['status_fabricante'];

echo json_encode([
    "logado" => true,
    "email" => $usuario['email'],
    "tipos" => $usuario['tipo_perfil'],
    "status_fabricante" => $usuario['status_fabricante'] ?? 'NAO_SOLICITADO'
]);

$stmt->close();
$conexao->close();