document.addEventListener("DOMContentLoaded", () => {
    const btnEnviar = document.getElementById("enviar");
//     const btnTeste = document.getElementById("teste");
//    btnTeste.addEventListener("click", teste);


    btnEnviar.addEventListener("click", async (e) => {
        e.preventDefault(); // Impede o recarregamento da página

        // Captura de todos os campos
        const dados = {
            nome: document.getElementById("nome").value,
            email: document.getElementById("email").value,
            senha: document.getElementById("senha").value,
            telefone: document.getElementById("telefone").value,
            documento: document.getElementById("documento").value,
            cep: document.getElementById("cep").value,
            cidade: document.getElementById("cidade").value,
            estado: document.getElementById("estado").value,
            endereco: document.getElementById("endereco").value,
            perfil: 'CLIENTE'// Definido fixo para este formulário
        };

        if (!dados.nome || !dados.email || !dados.senha || !dados.telefone || !dados.documento || !dados.cep || !dados.cidade || !dados.estado || !dados.endereco) {
            alert("Por favor, preencha os campos obrigatórios (Nome, E-mail e Senha).");
            return;
        }
        // Validação simples: apenas checa se existe o @
        if (!dados.email.includes("@")) {
            alert("Por favor, insira um e-mail válido com @");
            return; // Para a execução aqui e não envia para o PHP
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(dados.email)) {
            alert("O formato do e-mail está incorreto!");
            return;
        }

        const fd = new FormData();
        // Loop para preencher o FormData automaticamente
        for (const chave in dados) {
            fd.append(chave, dados[chave]);
        }

        try {
            const retorno = await fetch("../app/controllers/usuario/php/cadastro.php", {
                method: "POST",
                body: fd
            });

            const resposta = await retorno.json();

            if (resposta.status === "ok") {
                alert(resposta.mensagem);
                window.location.href = "index.php?rota=login";
            } else {
                alert("Erro: " + resposta.mensagem);
            }
        } catch (error) {
            console.error("Erro no cadastro:", error);
            alert("Erro ao conectar com o servidor.");
        }
    });

    // async function teste() {
    //     const senha2 = document.getElementById("senha2").value;
        
    //     if (senha2.length <= 8 ||!/[!@#$%^&*(),.?":{}|<>_\-\\[\];'/+=~`]/.test(senha2)) {
    //         alert("A senha deve ter pelo menos 8 caracteres e/ou caracteres especiais.");
    //         apc = document.getElementById("apc");
    //         apc.innerHTML = "A senha deve ter pelo menos 8 caracteres e/ou caracteres especiais.";
    //     }
    //     alert("foi");
        

    //   }     
    // }
});