document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    // se o token gerado não tiver na url do site ele bloqueia o formulário
    if (!token) {
        mostrarMensagem("Link inválido. Solicite uma nova recuperação de senha.", "danger");
        document.getElementById("formulario-nova-senha").style.display = "none";
        return;
    }

    // valida o token no servidor antes de liberar o acesso ao formulário
    validarToken(token);

    document.getElementById("btn-salvar").addEventListener("click", () => {
        salvarNovaSenha(token);
    });
});

async function validarToken(token) {
    try {
        const fd = new FormData();
        fd.append("token", token);
        fd.append("acao", "validar");

        const retorno = await fetch("../app/controllers/usuario/php/redefinir_senha.php", {
            method: "POST",
            body: fd
        });

        const resposta = await retorno.json();

        if (resposta.status !== "ok") {
            mostrarMensagem(
                resposta.mensagem + ' — <a href="index.php?rota=esqueci-senha">Solicitar novo link</a>',
                "danger", true
            );
            document.getElementById("formulario-nova-senha").style.display = "none";
        }

    } catch (error) {
        console.error("Erro ao validar token:", error);
        mostrarMensagem("Erro ao conectar com o servidor.", "danger");
    }
}

async function salvarNovaSenha(token) {
    const novaSenha      = document.getElementById("nova-senha").value;
    const confirmarSenha = document.getElementById("confirmar-senha").value;

    if (!novaSenha || !confirmarSenha) {
        mostrarMensagem("Preencha todos os campos.", "danger");
        return;
    }
    if (novaSenha.length < 6) {
        mostrarMensagem("A senha deve ter pelo menos 6 caracteres.", "danger");
        return;
    }
    if (novaSenha !== confirmarSenha) {
        mostrarMensagem("As senhas não coincidem.", "danger");
        return;
    }

    const btn = document.getElementById("btn-salvar");
    btn.disabled = true;
    btn.textContent = "Salvando...";

    const fd = new FormData();
    fd.append("token", token);
    fd.append("nova_senha", novaSenha);
    fd.append("acao", "redefinir");

    try {
        const retorno = await fetch("../app/controllers/usuario/php/redefinir_senha.php", {
            method: "POST",
            body: fd
        });

        const resposta = await retorno.json();

        if (resposta.status === "ok") {
            mostrarMensagem(
                'Senha alterada com sucesso! <a href="index.php?rota=login">Clique aqui para fazer login</a>',
                "success", true
            );
            document.getElementById("formulario-nova-senha").style.display = "none";
        } else {
            mostrarMensagem(resposta.mensagem || "Erro ao salvar nova senha.", "danger");
            btn.disabled = false;
            btn.textContent = "Salvar nova senha";
        }

    } catch (error) {
        console.error("Erro:", error);
        mostrarMensagem("Erro ao conectar com o servidor.", "danger");
        btn.disabled = false;
        btn.textContent = "Salvar nova senha";
    }
}

function mostrarMensagem(texto, tipo, temHTML = false) {
    const div = document.getElementById("mensagem");
    div.style.display = "block";
    div.className = `alert alert-${tipo}`;
    if (temHTML) { div.innerHTML = texto; } else { div.textContent = texto; }
}