
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-enviar").addEventListener("click", solicitarRecuperacao);
});

async function solicitarRecuperacao() {
    const email = document.getElementById("email").value.trim();

    if (!email) {
        mostrarMensagem("Por favor, informe seu e-mail.", "danger");
        return;
    }

    const btn = document.getElementById("btn-enviar");
    btn.disabled = true;
    btn.textContent = "Enviando...";

    const fd = new FormData();
    fd.append("email", email);

    try {
        const retorno = await fetch("../app/controllers/usuario/php/solicitar_reset.php", {
            method: "POST",
            body: fd
        });

        const resposta = await retorno.json();
        console.log("RESPOSTA:", resposta);

        if (resposta.status === "ok") {
            mostrarMensagem(
                "Se este e-mail estiver cadastrado, você receberá as instruções em breve. Verifique sua caixa de entrada.",
                "success"
            );
            document.getElementById("email").style.display = "none";
            document.querySelector(".form-label").style.display = "none";
            document.querySelector(".info-text").style.display = "none";
            btn.style.display = "none";
        } else {
            mostrarMensagem(resposta.mensagem || "Erro ao processar a solicitação.", "danger");
            btn.disabled = false;
            btn.textContent = "Enviar link";
        }

    } catch (error) {
        console.error("Erro:", error);
        mostrarMensagem("Erro ao conectar com o servidor.", "danger");
        btn.disabled = false;
        btn.textContent = "Enviar link";
    }
}

function mostrarMensagem(texto, tipo) {
    const div = document.getElementById("mensagem");
    div.style.display = "block";
    div.className = `alert alert-${tipo}`;
    div.textContent = texto;
}