// No arquivo ../app/controllers/admin/js/cadastro_administrador.js

document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. Pequeno atraso para garantir que o DOM (data-acesso) seja lido corretamente
    setTimeout(async () => {
        try {
           
        } catch (error) {
            console.error("Erro na verificação:", error);
        }

        // 2. Só configuramos o botão se a verificação passar (não redirecionar)
        const btnEnviar = document.getElementById("enviar");
        if (!btnEnviar) return;

        btnEnviar.addEventListener("click", async (e) => {
            e.preventDefault();

            // Captura de dados
            const dados = {
                nome: document.getElementById("nome").value.trim(),
                email: document.getElementById("email").value.trim(),
                senha: document.getElementById("senha").value,
                confirmar_senha: document.getElementById("confirmar_senha").value,
                telefone: document.getElementById("telefone").value.trim(),
                documento: document.getElementById("documento").value.trim(),
                cep: document.getElementById("cep").value.trim(),
                cidade: document.getElementById("cidade").value.trim(),
                estado: document.getElementById("estado").value.trim(),
                endereco: document.getElementById("endereco").value.trim(),
                perfil: 'ADMIN'
            };
            const senha = document.getElementById("senha").value;
            const senhaErro = document.getElementById("senha-erro");
            const confirmar_senha = document.getElementById("confirmar_senha").value;
            const telefone = document.getElementById("telefone").value;
            const cep = document.getElementById("cep").value;
            const documento = document.getElementById("documento").value;

            // Validação simples
            if (!dados.nome || !dados.email || !dados.senha) {
                alert("Preencha Nome, E-mail e Senha.");
                return;
            }
            
            if(senha.length < 8){
                senhaErro.style.display = "block";
                document.getElementById("senha").focus();
                return;
            }else{
                senhaErro.style.display = "none";
            }
            
            const regesEspecial = /[!@#$%^&(),..?:]/;
            if (!regesEspecial.test(senha)){
                alert ("A senha deve conter pela menos uma caractere especial");
                document.getElementById("senha").focus();
                return;
            }

            const regsMaiuscula = /[A-Z]/;
            if (!regsMaiuscula.test(senha)){
                alert("A senha deve ter pelo uma letra Maiuscula");
                document.getElementById(senha).focus();
                return;
            }
            
            if (senha !== confirmar_senha) {
                alert("As senhas não coincidem!");
                document.getElementById("confirmar_senha").focus();
                return;
            }
            const regsapenasNumeros = /^[0-9]+$/;
            if (!regsapenasNumeros.test(telefone)){
                alert("Em telefone só pode numeros");
                document.getElementById(telefone).focus;
                return;
            }
            const regsapenasNumerocep = /^[0-9]+$/;
            if (!regsapenasNumerocep.test(cep)){
                alert("Em CPE só pode numeros");
                document.getElementById(cep).focus;
                return;
            }

            const regsapenasNumerocpf = /^[0-9]+$/;
            if (!regsapenasNumerocpf.test(documento)){
                alert("Em CPF/CNPJ só pode numeros");
                document.getElementById(documento).focus;
                return;
            }

             if (!dados.email.includes("@")) {
                alert("Por favor, insira um e-mail válido com @");
                return; // Para a execução aqui e não envia para o PHP
            }

            const emailReges = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailReges.test(dados.email)) {
                alert("O formato do e-mail está incorreto!");
                return;
            }

            // Criar o FormData
            const fd = new FormData();
            for (const chave in dados) {
                fd.append(chave, dados[chave]);
            }

            try {
                const retorno = await fetch("../app/controllers/admin/cadastro_administrador.php", {
                    method: "POST",
                    body: fd
                });

                // Tenta ler como JSON
                const resposta = await retorno.json();

                if (resposta.status === "ok") {
                    alert(resposta.mensagem);
                    window.location.href = "index.php?rota=login"; 
                } else {
                    alert(resposta.mensagem);
                    if (resposta.mensagem && resposta.mensagem.includes("Acesso negado")) {
                        window.location.href = "index.php?rota=login";
                    }
                }
            } catch (error) {
                console.error("Erro no envio:", error);
                alert("Erro na conexão com o servidor.");
            }
        });
    }, 300); // 300ms de atraso
});