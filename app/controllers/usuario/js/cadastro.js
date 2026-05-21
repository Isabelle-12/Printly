document.addEventListener("DOMContentLoaded", () => {
    const btnEnviar = document.getElementById("enviar");
    // const btnTeste = document.getElementById("teste");
    // btnTeste.addEventListener("click", teste);

    btnEnviar.addEventListener("click", async (e) => {
        e.preventDefault();

        const dados = {
            nome:           document.getElementById("nome").value,
            email:          document.getElementById("email").value,
            senha:          document.getElementById("senha").value,
            telefone:       document.getElementById("telefone").value,
            documento:      document.getElementById("documento").value,
            cep:            document.getElementById("cep").value,
            cidade:         document.getElementById("cidade").value,
            estado:         document.getElementById("estado").value,
            endereco:       document.getElementById("endereco").value,
            nome_cachorro:  document.getElementById("nome_cachorro").value,
            perfil:         "CLIENTE"
        };

        const senha           = document.getElementById("senha").value;
        const senhaErro       = document.getElementById("senha-erro");
        const confirmar_senha = document.getElementById("confirmar_senha").value;
        const telefone        = document.getElementById("telefone").value;
        const cep             = document.getElementById("cep").value;
        const documento       = document.getElementById("documento").value;
        const aceitouTermos   = document.getElementById("termos_uso").checked;

        // -- CAMPOS OBRIGATORIOS -- bloqueia envio se qualquer campo estiver vazio --
        if (!dados.nome || !dados.email || !dados.senha || !dados.telefone || !dados.documento || !dados.cep || !dados.cidade || !dados.estado || !dados.endereco) {
            alert("Por favor, preencha os campos obrigatórios.");
            return;
        }

        // ============================================================
        // NOVO CAMPO -- colar o bloco correspondente ao que foi pedido
        // ============================================================

        // -- CPF: valida formato 000.000.000-00 e exibe o valor digitado em caso de sucesso --
        // const cpf      = document.getElementById("cpf").value;
        // const cpfErro  = document.getElementById("cpf-erro");
        // const cpfOk    = document.getElementById("cpf-sucesso");
        // const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
        // if (!cpfRegex.test(cpf)) {
        //     cpfErro.textContent = "CPF inválido. Use o formato 000.000.000-00.";
        //     cpfErro.style.display = "block";
        //     cpfOk.style.display = "none";
        //     document.getElementById("cpf").focus();
        //     return;
        // } else {
        //     cpfErro.style.display = "none";
        //     cpfOk.textContent = "CPF válido: " + cpf;
        //     cpfOk.style.display = "block";
        //     console.log("CPF válido:", cpf);
        // }

        // -- TEXTO SIMPLES: campo nao pode estar vazio --
        // const apelido     = document.getElementById("apelido").value;
        // const apelidoErro = document.getElementById("apelido-erro");
        // if (apelido.trim() === "") {
        //     apelidoErro.textContent = "O campo nao pode estar vazio.";
        //     apelidoErro.style.display = "block";
        //     document.getElementById("apelido").focus();
        //     return;
        // } else {
        //     apelidoErro.style.display = "none";
        //     console.log("Apelido valido:", apelido);
        // }

        // -- TEXTO SIMPLES: apenas letras (sem numeros ou simbolos) --
        // const regsApenasLetras = /^[a-zA-ZA-y\s]+$/;
        // if (!regsApenasLetras.test(apelido)) {
        //     apelidoErro.textContent = "Apenas letras sao permitidas.";
        //     apelidoErro.style.display = "block";
        //     return;
        // }

        // -- TEXTO SIMPLES: tamanho minimo de caracteres --
        // if (apelido.length < 3) {
        //     apelidoErro.textContent = "Minimo de 3 caracteres.";
        //     apelidoErro.style.display = "block";
        //     return;
        // }

        // -- DATA: prazo minimo de 3 dias a partir de hoje --
        // const diffDias = Math.ceil((new Date(valorData) - new Date()) / (1000 * 60 * 60 * 24));
        // if (diffDias < 3) {
        //     dataErro.textContent = "Prazo minimo de 3 dias. Faltam apenas " + diffDias + " dia(s).";
        //     dataErro.style.display = "block";
        //     return;
        // } else {
        //     console.log("Prazo aprovado. Dias restantes:", diffDias);
        // }

        // -- NUMERO: verificar maioridade (>= 18) --
        // const idade     = Number(document.getElementById("idade").value);
        // const idadeErro = document.getElementById("idade-erro");
        // if (!idade) {
        //     idadeErro.textContent = "Informe sua idade.";
        //     idadeErro.style.display = "block";
        //     return;
        // }
        // if (idade < 18) {
        //     idadeErro.textContent = "Acesso negado: menor de idade (" + idade + " anos).";
        //     idadeErro.style.display = "block";
        //     return;
        // } else {
        //     idadeErro.style.display = "none";
        //     console.log("Idade valida:", idade);
        // }

        // -- NUMERO: valor dentro de intervalo (ex: entre 1 e 100) --
        // if (idade < 1 || idade > 100) {
        //     idadeErro.textContent = "O valor deve estar entre 1 e 100.";
        //     idadeErro.style.display = "block";
        //     return;
        // }

        // -- SELECT: opcao obrigatoria --
        // const tipoCliente = document.getElementById("tipo_cliente").value;
        // const tipoErro    = document.getElementById("tipo-erro");
        // if (!tipoCliente) {
        //     tipoErro.textContent = "Selecione um tipo de cliente.";
        //     tipoErro.style.display = "block";
        //     return;
        // } else {
        //     tipoErro.style.display = "none";
        //     console.log("Tipo selecionado:", tipoCliente);
        // }

        // -- TEXTAREA: nao pode estar vazia + exibe contagem no console --
        // const observacoes = document.getElementById("observacoes").value;
        // const obsErro     = document.getElementById("obs-erro");
        // if (observacoes.trim() === "") {
        //     obsErro.textContent = "O campo de observacoes nao pode estar vazio.";
        //     obsErro.style.display = "block";
        //     return;
        // } else {
        //     obsErro.style.display = "none";
        //     console.log("Observacoes (" + observacoes.length + " caracteres):", observacoes);
        // }

        // -- CHECKBOX SIMPLES: captura se foi marcado (sem obrigatoriedade) --
        // const newsletter = document.getElementById("newsletter").checked;
        // console.log("Newsletter:", newsletter ? "Sim" : "Nao");

        // -- CHECKBOX SIMPLES: obrigatorio marcar --
        // if (!document.getElementById("newsletter").checked) {
        //     alert("Voce precisa aceitar para continuar.");
        //     return;
        // }

        // -- RADIO: captura a opcao marcada (obrigatorio selecionar uma) --
        // const tipoPessoa     = document.querySelector('input[name="tipo_pessoa"]:checked');
        // const radioErro      = document.getElementById("radio-erro");
        // if (!tipoPessoa) {
        //     radioErro.textContent = "Selecione uma opcao.";
        //     radioErro.style.display = "block";
        //     return;
        // } else {
        //     radioErro.style.display = "none";
        //     console.log("Tipo de pessoa:", tipoPessoa.value);
        // }

        // -- CHECKBOXES MULTIPLOS: captura quais foram marcados --
        // const servicos = [
        //     { id: "serv-cartao",  nome: "Cartao de Visita" },
        //     { id: "serv-banner",  nome: "Banner"           },
        //     { id: "serv-flyer",   nome: "Flyer"            },
        //     { id: "serv-adesivo", nome: "Adesivo"          }
        // ];
        // const selecionados = servicos
        //     .filter(s => document.getElementById(s.id).checked)
        //     .map(s => "- " + s.nome);
        // if (selecionados.length === 0) {
        //     alert("Nenhum servico selecionado!");
        //     return;
        // }
        // console.log("Servicos:\n" + selecionados.join("\n"));
        // alert("Servicos selecionados:\n\n" + selecionados.join("\n"));

        // ============================================================

        // -- SENHA: tamanho minimo com erro inline --
        // if (senha.length < 8) {
        //     senhaErro.style.display = "block";
        //     document.getElementById("senha").focus();
        //     return;
        // } else {
        //     senhaErro.style.display = "none";
        // }

        // -- SENHA: caractere especial obrigatorio --
        // const regesEspecial = /[!@#$%^&*(),.?:]/;
        // if (!regesEspecial.test(senha)) {
        //     alert("A senha deve conter pelo menos um caractere especial.");
        //     document.getElementById("senha").focus();
        //     return;
        // }

        // -- SENHA: letra maiuscula obrigatoria --
        // const regsMaiuscula = /[A-Z]/;
        // if (!regsMaiuscula.test(senha)) {
        //     alert("A senha deve ter pelo menos uma letra maiuscula.");
        //     document.getElementById("senha").focus();
        //     return;
        // }

        // -- SENHA: confirmacao deve ser igual --
        if (senha !== confirmar_senha) {
            alert("As senhas nao coincidem!");
            document.getElementById("confirmar_senha").focus();
            return;
        }

        // -- SO NUMEROS: telefone, CEP e documento --
        const regsApenasNumeros = /^[0-9]+$/;

        if (!regsApenasNumeros.test(telefone)) {
            alert("Em telefone so pode numeros.");
            document.getElementById("telefone").focus();
            return;
        }
        if (!regsApenasNumeros.test(cep)) {
            alert("Em CEP so pode numeros.");
            document.getElementById("cep").focus();
            return;
        }
        if (!regsApenasNumeros.test(documento)) {
            alert("Em Documento (CPF/CNPJ) so pode numeros.");
            document.getElementById("documento").focus();
            return;
        }

        // -- TERMOS: checkbox de aceite obrigatorio --
        if (!aceitouTermos) {
            alert("Por favor, aceite os termos.");
            return;
        }

        // -- EMAIL: checa apenas se existe o @ (validacao simples) --
        if (!dados.email.includes("@")) {
            alert("Por favor, insira um e-mail valido com @");
            return;
        }

        // -- EMAIL: regex completo (formato user@dominio.ext) --
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(dados.email)) {
            alert("O formato do e-mail esta incorreto!");
            return;
        }

        // -- EMAIL: com erro inline (precisa de <span id="email-erro"> no HTML) --
        // const emailErro = document.getElementById("email-erro");
        // if (!emailRegex.test(dados.email)) {
        //     emailErro.textContent = "E-mail invalido.";
        //     emailErro.style.display = "block";
        //     return;
        // } else {
        //     emailErro.style.display = "none";
        // }

        // -- ENVIO: monta FormData e envia para o PHP via fetch --
        const fd = new FormData();
        for (const chave in dados) {
            fd.append(chave, dados[chave]);
        }

        try {
            const retorno  = await fetch("../app/controllers/usuario/php/cadastro.php", {
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