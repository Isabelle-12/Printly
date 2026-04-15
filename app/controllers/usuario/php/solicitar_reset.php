<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json');

include_once(__DIR__ . '/../../../../config/conexao.php');

// ta importando as classes da biblioteca phpmailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/../../../../vendor/PHPMailer/src/Exception.php';
require __DIR__ . '/../../../../vendor/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/../../../../vendor/PHPMailer/src/SMTP.php';

$retorno = ['status' => 'nok', 'mensagem' => 'Erro interno', 'data' => []];

if (!$conexao) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => "Erro na conexão com o banco"
    ]);
    exit;
}

if (!isset($_POST['email'])) {
    $retorno['mensagem'] = 'E-mail não informado.';
    echo json_encode($retorno);
    exit;
}

$email = trim($_POST['email']);

// verifica se o email esta no banco de dados
$stmt = $conexao->prepare("SELECT id FROM usuarios WHERE email = ? AND status != 'BANIDO'");
if (!$stmt) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Erro no prepare']);
    exit;
}
$stmt->bind_param("s", $email);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 0) {
    echo json_encode(['status' => 'ok', 'mensagem' => 'Solicitação recebida.']);
    $stmt->close();
    $conexao->close();
    exit;
}

$usuario = $resultado->fetch_assoc();
$usuario_id = $usuario['id'];
$stmt->close();

//gera o token
$token = bin2hex(random_bytes(32));
$data_expiracao = date('Y-m-d H:i:s', strtotime('+1 hour'));

// apaga token antigo que esse usuario possa ter
$stmt_del = $conexao->prepare("DELETE FROM tokens_reset_senha WHERE usuario_id = ?");
$stmt_del->bind_param("i", $usuario_id);
$stmt_del->execute();
$stmt_del->close();

// salva o token no banco
$stmt_ins = $conexao->prepare(
    "INSERT INTO tokens_reset_senha (usuario_id, token, data_expiracao) VALUES (?, ?, ?)"
);
$stmt_ins->bind_param("iss", $usuario_id, $token, $data_expiracao);

if (!$stmt_ins->execute()) {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Erro ao salvar token.']);
    $stmt_ins->close();
    $conexao->close();
    exit;
}
$stmt_ins->close();

// monta o link automaticamente
$protocolo = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host      = $_SERVER['HTTP_HOST'];
$script    = $_SERVER['SCRIPT_NAME'];
$base_url  = $protocolo . '://' . $host . preg_replace('/\/app\/.*/', '/public', $script);

$link = $base_url . "/index.php?rota=redefinir-senha&token=" . $token;

// envia o email de recuperação pela biblioteca phpmailer utilizando o gmail

try {
    $mail = new PHPMailer(true); // o true ativa exceções para capturar erros

    // configuração do servidor SMTP do gmail
    $mail->isSMTP();
    $mail->SMTPOptions = [
    'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true,
        ],
    ];
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'printlyi3d@gmail.com';   // - email que vai enviar link para recuperação da senha
    $mail->Password   = 'tgzrauenhftrlamo';       // - senha de app 
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    $mail->CharSet    = 'UTF-8';

    
    $mail->setFrom('printlyi3d@gmail.com', 'Printly'); // - isso é de onde ta saindo 
    $mail->addAddress($email); // isso é pra quem ta indo

    // texto do email
    $mail->Subject = 'Printly - Recuperação de senha';
    $mail->isHTML(true);
    $mail->Body = "
        <div style='font-family: DM Sans, sans-serif; max-width: 480px; margin: auto;'>
            <h2 style='font-family: Syne, sans-serif; color: #212529;'>Printly</h2>
            <p>Olá! Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <a href='{$link}'
               style='display:inline-block; background:#212529; color:#fff; padding:10px 24px;
                      border-radius:6px; text-decoration:none; font-weight:600;'>
                Redefinir minha senha
            </a>
            <p style='margin-top:20px; color:#6c757d; font-size:0.85rem;'>
                Este link é válido por <strong>1 hora</strong>.<br>
                Se você não solicitou a recuperação, ignore este e-mail.
            </p>
        </div>
    ";
    // versão em texto para clientes de e-mail que não tem suporte para o html
    $mail->AltBody = "Acesse o link para redefinir sua senha: {$link}\n\nVálido por 1 hora.";

    $mail->send();
    $conexao->close();

    echo json_encode([
        'status' => 'ok',
        'mensagem' => 'Solicitação recebida.'
    ]);
    exit;

} catch (Exception $e) {
    // se o envio falhar, loga o erro mas não expõe detalhes ao usuário
    $conexao->close();
    echo json_encode([
    'status'  => 'nok', 
    'mensagem' => 'Erro ao enviar e-mail: ' . $mail->ErrorInfo
    ]);
    exit;
}