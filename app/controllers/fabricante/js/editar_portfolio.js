document.addEventListener("DOMContentLoaded", () => {
    carregarDadosPortfolio();

    const formPortfolio = document.getElementById("formPortfolioMaker");
    const formDadosFabricante = document.getElementById("formDadosFabricante");

    if (formPortfolio) {
        formPortfolio.addEventListener("submit", salvarFotoPortfolio);
    }

    if (formDadosFabricante) {
        formDadosFabricante.addEventListener("submit", salvarDadosFabricante);
    }
});

async function carregarDadosPortfolio() {
    try {
        const resposta = await fetch("../app/controllers/fabricante/php/buscar_portfolio.php");

        const texto = await resposta.text();
        console.log("RESPOSTA EDITAR PORTFÓLIO:", texto);

        const dados = JSON.parse(texto);

        if (dados.status !== "ok") {
            alert(dados.mensagem);
            return;
        }

        const maker = dados.data.maker;
        const fotos = dados.data.fotos;

        preencherDadosFabricante(maker);
        listarFotosPortfolio(fotos);

    } catch (erro) {
        console.error("Erro ao carregar dados do portfólio:", erro);
        alert("Erro ao carregar dados do portfólio. Veja o console.");
    }
}

function preencherDadosFabricante(maker) {
    setValor("nome_empresa", maker.nome_empresa);
    setValor("email_comercial", maker.email_comercial);
    setValor("cnpj", maker.cnpj);
    setValor("telefone_comercial", maker.telefone_comercial);
    setValor("endereco_empresa", maker.endereco_empresa);
}

function setValor(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.value = valor || "";
    } else {
        console.warn(`Campo com id="${id}" não encontrado.`);
    }
}

function listarFotosPortfolio(fotos) {
    const area = document.getElementById("listaPortfolioMaker");

    if (!area) return;

    if (!fotos || fotos.length === 0) {
        area.innerHTML = `<p class="text-muted">Nenhuma foto cadastrada ainda.</p>`;
        return;
    }

    area.innerHTML = "";

    fotos.forEach((foto) => {
        area.innerHTML += `
            <div class="portfolio-card">
                <img src="../${foto.caminho_imagem}" alt="${foto.titulo || "Foto do portfólio"}">

                <div class="portfolio-card-body">
                    <h6>${foto.titulo || "Sem título"}</h6>
                    <p>${foto.descricao || "Sem descrição"}</p>

                    <small class="text-muted">
                        Enviado em: ${foto.data_upload || "Data não informada"}
                    </small>

                    <div class="portfolio-actions">
                        <button 
                            type="button" 
                            class="btn-card-editar"
                            onclick="abrirModalEditarPortfolio(${foto.id}, '${escapeAspas(foto.titulo)}', '${escapeAspas(foto.descricao)}')">
                            <i class="bi bi-pencil-square me-1"></i>Editar
                        </button>

                        <button 
                            type="button" 
                            class="btn-card-excluir"
                            onclick="excluirItemPortfolio(${foto.id})">
                            <i class="bi bi-trash me-1"></i>Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

function escapeAspas(texto) {
    if (!texto) return "";
    return texto
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;")
        .replace(/\n/g, " ");
}

function abrirModalEditarPortfolio(id, titulo, descricao) {
    document.getElementById("editar_id").value = id;
    document.getElementById("editar_titulo").value = titulo || "";
    document.getElementById("editar_descricao").value = descricao || "";

    const modal = new bootstrap.Modal(document.getElementById("modalEditarPortfolio"));
    modal.show();
}

document.addEventListener("DOMContentLoaded", () => {
    const formEditar = document.getElementById("formEditarItemPortfolio");

    if (formEditar) {
        formEditar.addEventListener("submit", atualizarItemPortfolio);
    }
});

async function atualizarItemPortfolio(event) {
    event.preventDefault();

    const form = document.getElementById("formEditarItemPortfolio");
    const formData = new FormData(form);

    try {
        const resposta = await fetch("../app/controllers/fabricante/php/atualizar_item_portfolio.php", {
            method: "POST",
            body: formData
        });

        const texto = await resposta.text();
        console.log("RESPOSTA ATUALIZAR ITEM PORTFÓLIO:", texto);

        const dados = JSON.parse(texto);

        alert(dados.mensagem);

        if (dados.status === "ok") {
            const modalEl = document.getElementById("modalEditarPortfolio");
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            carregarDadosPortfolio();
        }

    } catch (erro) {
        console.error("Erro ao atualizar item do portfólio:", erro);
        alert("Erro ao atualizar item. Veja o console.");
    }
}

async function excluirItemPortfolio(id) {
    if (!confirm("Tem certeza que deseja excluir este item do portfólio?")) {
        return;
    }

    const formData = new FormData();
    formData.append("id", id);

    try {
        const resposta = await fetch("../app/controllers/fabricante/php/excluir_item_portfolio.php", {
            method: "POST",
            body: formData
        });

        const texto = await resposta.text();
        console.log("RESPOSTA EXCLUIR ITEM PORTFÓLIO:", texto);

        const dados = JSON.parse(texto);

        alert(dados.mensagem);

        if (dados.status === "ok") {
            carregarDadosPortfolio();
        }

    } catch (erro) {
        console.error("Erro ao excluir item do portfólio:", erro);
        alert("Erro ao excluir item. Veja o console.");
    }
}

async function salvarFotoPortfolio(event) {
    event.preventDefault();

    const form = document.getElementById("formPortfolioMaker");
    const formData = new FormData(form);

    try {
        const resposta = await fetch("../app/controllers/fabricante/php/salvar_portfolio_maker.php", {
            method: "POST",
            body: formData
        });

        const texto = await resposta.text();
        console.log("RESPOSTA SALVAR FOTO PORTFÓLIO:", texto);

        const dados = JSON.parse(texto);

        alert(dados.mensagem);

        if (dados.status === "ok") {
            form.reset();
            carregarDadosPortfolio();
        }

    } catch (erro) {
        console.error("Erro ao salvar foto no portfólio:", erro);
        alert("Erro ao salvar foto. Veja o console.");
    }
}

async function salvarDadosFabricante(event) {
    event.preventDefault();

    const form = document.getElementById("formDadosFabricante");
    const formData = new FormData(form);

    try {
        const resposta = await fetch("../app/controllers/fabricante/php/atualizar_dados_fabricante.php", {
            method: "POST",
            body: formData
        });

        const texto = await resposta.text();
        console.log("RESPOSTA ATUALIZAR DADOS FABRICANTE:", texto);

        const dados = JSON.parse(texto);

        alert(dados.mensagem);

        if (dados.status === "ok") {
            carregarDadosPortfolio();
        }

    } catch (erro) {
        console.error("Erro ao atualizar dados do fabricante:", erro);
        alert("Erro ao atualizar dados do fabricante. Veja o console.");
    }
}