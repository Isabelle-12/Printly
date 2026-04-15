<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json');

include_once(__DIR__ . '/../../../config/conexao.php');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/../../../vendor/PHPMailer/src/Exception.php';
require __DIR__ . '/../../../vendor/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/../../../vendor/PHPMailer/src/SMTP.php';

if (!$conexao) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Erro na conexão com o banco']);
    exit;
}

$id = isset($_POST['id']) ? (int)$_POST['id'] : 0;

if (!$id) {
    echo json_encode([
        "status"   => "nok",
        "mensagem" => "É necessário informar o ID da notificação",
        "data"     => []
    ]);
    exit;
}

$stmt = $conexao->prepare("SELECT pedido_id, retratada FROM notificacoes WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$res   = $stmt->get_result();
$notif = $res->fetch_assoc();
$stmt->close();

if (!$notif) {
    $conexao->close();
    echo json_encode([
        "status"   => "nok",
        "mensagem" => "Notificação #$id não encontrada",
        "data"     => []
    ]);
    exit;
}

if ($notif['retratada'] == 1) {
    $conexao->close();
    echo json_encode([
        "status"   => "nok",
        "mensagem" => "Notificação já foi retratada anteriormente",
        "data"     => []
    ]);
    exit;
}

$pedido_id = (int)$notif['pedido_id'];

$stmt = $conexao->prepare("UPDATE notificacoes SET retratada = 1 WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();

if ($stmt->affected_rows === 0) {
    $stmt->close();
    $conexao->close();
    echo json_encode([
        "status"   => "nok",
        "mensagem" => "Falha ao retratar notificação no banco",
        "data"     => []
    ]);
    exit;
}
$stmt->close();

if (!$pedido_id) {
    $conexao->close();
    echo json_encode([
        "status"   => "ok",
        "mensagem" => "Notificação retratada com sucesso (sem pedido vinculado para e-mail).",
        "data"     => []
    ]);
    exit;
}

$stmt = $conexao->prepare("
    SELECT
        c.email AS email_cliente,
        c.nome  AS nome_cliente,
        m.email AS email_maker,
        m.nome  AS nome_maker
    FROM pedidos p
    JOIN projetos pr ON pr.id = p.projeto_id
    JOIN usuarios c  ON c.id  = pr.cliente_id
    JOIN usuarios m  ON m.id  = p.maker_id
    WHERE p.id = ?
");
$stmt->bind_param("i", $pedido_id);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 0) {
    $stmt->close();
    $conexao->close();
    echo json_encode([
        "status"   => "ok",
        "mensagem" => "Notificação retratada, mas pedido #{$pedido_id} não encontrado para envio de e-mail.",
        "data"     => []
    ]);
    exit;
}

$partes = $resultado->fetch_assoc();
$stmt->close();

$email_cliente = $partes['email_cliente'];
$email_maker   = $partes['email_maker'];
$nome_cliente  = $partes['nome_cliente'];
$nome_maker    = $partes['nome_maker'];
//teste de commit

$protocolo = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host      = $_SERVER['HTTP_HOST'];
$script    = $_SERVER['SCRIPT_NAME'];
$base_url  = $protocolo . '://' . $host . preg_replace('/\/app\/.*/', '/public', $script);
$link      = $base_url . "/index.php?rota=home";

$titulo   = "Retratação da notificação do pedido #{$pedido_id}";
$mensagem = "A notificação de atraso referente ao pedido #{$pedido_id} foi retratada pela equipe Printly.";

function enviarEmailRetratacao($conexao, $pedido_id, $titulo, $mensagem, $email_destino, $nome_destino, $link) {
    $stmt = $conexao->prepare("
        INSERT INTO notificacoes (tipo, pedido_id, titulo, mensagem, email_destino)
        VALUES ('RETIFICACAO', ?, ?, ?, ?)
    ");
    $stmt->bind_param("isss", $pedido_id, $titulo, $mensagem, $email_destino);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        $stmt->close();
        return ['status' => 'nok', 'mensagem' => "Não foi possível registrar notificação de retratação para {$email_destino}"];
    }
    $stmt->close();

    try {
        $mail = new PHPMailer(true);

        $mail->isSMTP();
        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer'       => false,
                'verify_peer_name'  => false,
                'allow_self_signed' => true,
            ],
        ];
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'printlyi3d@gmail.com';
        $mail->Password   = 'tgzrauenhftrlamo';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom('printlyi3d@gmail.com', 'Printly');
        $mail->addAddress($email_destino, $nome_destino);

        $mail->Subject = 'Printly - Retratação de notificação de atraso';
        $mail->isHTML(true);
        $mail->Body = "
            <div style='font-family: DM Sans, sans-serif; max-width: 480px; margin: auto;'>
                <h2 style='font-family: Syne, sans-serif; color: #212529;'>Printly</h2>
                <p>Olá, <strong>{$nome_destino}</strong>!</p>
                <p>Gostaríamos de informar que a notificação de atraso referente ao pedido <strong>#{$pedido_id}</strong> foi <strong>retratada</strong> pela nossa equipe.</p>
                <p>Pedimos desculpas por qualquer inconveniente causado e agradecemos a sua compreensão.</p>
                <a href='{$link}'
                   style='display:inline-block; background:#212529; color:#fff; padding:10px 24px;
                          border-radius:6px; text-decoration:none; font-weight:600;'>
                    Cheque aqui seu pedido.
                </a>
                <p style='margin-top:20px; color:#6c757d; font-size:0.85rem;'>
                    Este e-mail foi enviado automaticamente pela plataforma Printly.
                </p>
            </div>
        ";
        $mail->AltBody = "Olá {$nome_destino}, a notificação de atraso do pedido #{$pedido_id} foi retratada. Acesse: {$link}";

        $mail->send();
        return ['status' => 'ok', 'mensagem' => "E-mail enviado para {$email_destino}"];

    } catch (Exception $e) {
        return ['status' => 'nok', 'mensagem' => 'Erro ao enviar e-mail: ' . $mail->ErrorInfo];
    }
}

$resultadoCliente = enviarEmailRetratacao($conexao, $pedido_id, $titulo, $mensagem, $email_cliente, $nome_cliente, $link);
$resultadoMaker   = enviarEmailRetratacao($conexao, $pedido_id, $titulo, $mensagem, $email_maker,   $nome_maker,   $link);

$conexao->close();

if ($resultadoCliente['status'] === 'ok' && $resultadoMaker['status'] === 'ok') {
    echo json_encode([
        'status'   => 'ok',
        'mensagem' => 'Notificação retratada e e-mails enviados para cliente e fabricante.'
    ]);
} else {
    echo json_encode([
        'status'   => 'nok',
        'mensagem' => 'Notificação retratada, mas houve falha no envio de e-mail.',
        'cliente'  => $resultadoCliente,
        'maker'    => $resultadoMaker
    ]);
}
exit;