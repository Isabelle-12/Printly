document.addEventListener("DOMContentLoaded", async () => {
    function setTexto(id, valor, padrao = "Não informado") {
        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.textContent = valor || padrao;
        } else {
            console.warn(`Elemento com id="${id}" não encontrado no HTML.`);
        }
    }

    try {
        const retorno = await fetch("/Printly/app/controllers/usuario/php/buscar_perfil_f.php");

        const texto = await retorno.text();
        console.log("RESPOSTA PERFIL:", texto);

        const resposta = JSON.parse(texto);

        if (resposta.status !== "ok") {
            alert(resposta.mensagem);
            window.location.href = "index.php?rota=login";
            return;
        }

        const usuario = resposta.data;

        const fotoPerfil = document.querySelector(".foto-perfil");

        if (fotoPerfil) {
            fotoPerfil.src = usuario.foto_perfil
                ? "/Printly/" + usuario.foto_perfil
                : "/Printly/assets/img/perfil-padrao.png";
        }

        setTexto("perfilNome", usuario.nome, "Nome não informado");
        setTexto("perfilTipo", usuario.tipo_perfil, "Perfil não informado");

        const localizacao = `${usuario.cidade || "Cidade"} - ${usuario.estado || "UF"}`;
        setTexto("perfilLocalizacao", localizacao);

        setTexto("perfilStatus", usuario.status, "Status não informado");

        setTexto("nome", usuario.nome);
        setTexto("email", usuario.email);
        setTexto("telefone", usuario.telefone);
        setTexto("documento", usuario.documento);

        setTexto("tipoPerfil", usuario.tipo_perfil);
        setTexto("statusConta", usuario.status);
        setTexto("statusFabricante", usuario.status_fabricante);

        const disponivel = usuario.disponivel_para_pedidos == 1 ? "Sim" : "Não";
        setTexto("disponivelPedidos", disponivel);

        setTexto("cep", usuario.cep);
        setTexto("cidade", usuario.cidade);
        setTexto("estado", usuario.estado);
        setTexto("endereco", usuario.endereco);

    } catch (erro) {
        console.error("Erro ao carregar perfil:", erro);
        alert("Erro ao carregar dados do perfil. Veja o console.");
    }
});