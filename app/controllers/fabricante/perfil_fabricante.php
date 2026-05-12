<?php
    session_start();

    if (!isset($_SESSION['id'])) {
        header("Location: ../login.html");
        exit;
    }

    include_once "../config/conexao.php";

    $id = $_SESSION['id'];

    $sql = "SELECT nome, email, telefone, documento, cep, cidade, estado, endereco 
            FROM usuarios 
            WHERE id = :id";

    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(":id", $id);
    $stmt->execute();

    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        echo "Usuário não encontrado.";
        exit;
    }
    ?>

    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Meu Perfil - Printly</title>
    </head>
    <body>

        <main class="perfil-container">
            <section class="perfil-card">
                <h1>Meu Perfil</h1>

                <div class="info">
                    <p><strong>Nome:</strong> <?= htmlspecialchars($usuario['nome']) ?></p>
                    <p><strong>E-mail:</strong> <?= htmlspecialchars($usuario['email']) ?></p>
                    <p><strong>Telefone:</strong> <?= htmlspecialchars($usuario['telefone']) ?></p>
                    <p><strong>Documento:</strong> <?= htmlspecialchars($usuario['documento']) ?></p>
                    <p><strong>CEP:</strong> <?= htmlspecialchars($usuario['cep']) ?></p>
                    <p><strong>Cidade:</strong> <?= htmlspecialchars($usuario['cidade']) ?></p>
                    <p><strong>Estado:</strong> <?= htmlspecialchars($usuario['estado']) ?></p>
                    <p><strong>Endereço:</strong> <?= htmlspecialchars($usuario['endereco']) ?></p>
                </div>

                <a href="editar_perfil_f.php" class="btn-editar">Editar Perfil</a>
            </section>
        </main>

    </body>
    </html>