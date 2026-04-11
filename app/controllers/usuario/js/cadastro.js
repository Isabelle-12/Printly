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

        //Validação simples da SENHA: apenas checa se a senha digitada tem 8 caracteres e heca se a senha tem no minimo uma caractere
        const senha = document.getElementById("senha").value;
        const senhaErro = document.getElementById("senha-erro");
        const confirmar_senha = document.getElementById("confirmar_senha").value;
        const telefone = document.getElementById("telefone").value;
        const cep = document.getElementById("cep").value;
        const documento = document.getElementById("documento").value;
        const aceitouTermos = document.getElementById("termos_uso").checked;
        const padraoEsperado = true;


        //REGRAS DA SENHA 
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

        //REGRAS DE NUMEROS
        
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

        //REGRAS DOS TERMOS DE CONDIÇÕES
        if (aceitouTermos !== padraoEsperado) {
            alert("Por favor, aceite os termos.");
            return;
        }

        //REGRAS DO EMAIL
        // Validação simples do EMAIL: apenas checa se existe o @
        if (!dados.email.includes("@")) {
            alert("Por favor, insira um e-mail válido com @");
            return; // Para a execução aqui e não envia para o PHP
        }

        const emailReges = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailReges.test(dados.email)) {
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


});