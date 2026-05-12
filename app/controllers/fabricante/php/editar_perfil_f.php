<?php
session_start();

if (!isset($_SESSION['id'])) {
    header("index.php?rota=login");
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
    <title>Editar Perfil - Printly</title>
    <link rel="stylesheet" href="perfil.css">
</head>
<body>

    <main class="perfil-container">
        <section class="perfil-card">
            <h1>Editar Perfil</h1>

            <form action="atualizar_perfil_fabricante.php" method="POST" class="form-perfil">

                <label>Nome</label>
                <input type="text" name="nome" value="<?= htmlspecialchars($usuario['nome']) ?>" required>

                <label>E-mail</label>
                <input type="email" name="email" value="<?= htmlspecialchars($usuario['email']) ?>" required>

                <label>Nova senha</label>
                <input type="password" name="senha" placeholder="Deixe em branco para manter a senha atual">

                <label>Telefone</label>
                <input type="text" name="telefone" id="telefone" value="<?= htmlspecialchars($usuario['telefone']) ?>">

                <label>Documento</label>
                <input type="text" name="documento" id="documento" value="<?= htmlspecialchars($usuario['documento']) ?>">

                <label>CEP</label>
                <input type="text" name="cep" id="cep" value="<?= htmlspecialchars($usuario['cep']) ?>">

                <label>Cidade</label>
                <input type="text" name="cidade" value="<?= htmlspecialchars($usuario['cidade']) ?>">

                <label>Estado</label>
                <input type="text" name="estado" maxlength="2" value="<?= htmlspecialchars($usuario['estado']) ?>">

                <label>Endereço</label>
                <textarea name="endereco"><?= htmlspecialchars($usuario['endereco']) ?></textarea>

                <div class="botoes">
                    <button type="submit" class="btn-salvar">Salvar Alterações</button>
                    <a href="perfil_fabricante.php" class="btn-cancelar">Cancelar</a>
                </div>

            </form>
        </section>
    </main>

    <script src="perfil.js"></script>
</body>
</html>