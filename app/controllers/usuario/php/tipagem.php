<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

include_once(__DIR__ . '/../../../../config/conexao.php');

if (!isset($_SESSION['id'])) {
    echo json_encode([
        "tipo" => false
    ]);
    exit;
}

$id = (int) $_SESSION['id'];
// mudança: confere no banco se o usuário ainda existe e se não foi banido
$stmt = $conexao->prepare("SELECT tipo_perfil, status FROM usuarios WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 0) {
    session_unset();
    session_destroy();

    echo json_encode([
        "tipo" => false
    ]);
    $stmt->close();
    $conexao->close();
    exit;
}

$usuario = $resultado->fetch_assoc();

if ($usuario['status'] === 'BANIDO') {
    session_unset();
    session_destroy();

    echo json_encode([
        "tipo" => false
    ]);
    $stmt->close();
    $conexao->close();
    exit;
}

echo json_encode([
    "tipo" => true,
    "tipos" => $usuario['tipo_perfil']
]);

$stmt->close();
$conexao->close();