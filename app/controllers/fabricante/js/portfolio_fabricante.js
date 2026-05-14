document.addEventListener("DOMContentLoaded", carregarPortfolioMaker);

function setTexto(id, valor, padrao = "Não informado") {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor || padrao;
    } else {
        console.warn(`Elemento com id="${id}" não encontrado no HTML.`);
    }
}

async function carregarPortfolioMaker() {
    try {
        const resposta = await fetch("../app/controllers/fabricante/php/buscar_portfolio.php");

        const texto = await resposta.text();
        console.log("RESPOSTA PORTFÓLIO MAKER:", texto);

        const dados = JSON.parse(texto);

        if (dados.status !== "ok") {
            console.warn(dados.mensagem);
            return;
        }

        const maker = dados.data.maker;
        const impressoras = dados.data.impressoras;
        const materiais = dados.data.materiais;
        const fotos = dados.data.fotos;

        preencherDadosMaker(maker);
        preencherImpressoras(impressoras);
        preencherMateriais(materiais);
        preencherCarousel(fotos);

    } catch (erro) {
        console.error("Erro ao carregar portfólio do maker:", erro);
    }
}

function preencherDadosMaker(maker) {
    const fotoPortfolio = document.getElementById("portfolioFoto");

    if (fotoPortfolio) {
        fotoPortfolio.src = maker.foto_empresa
            ? "../" + maker.foto_empresa
            : "/img/perfil-padrao.jpg";
    }

    document.getElementById("nome_empresa").textContent = maker.nome_empresa || "Nome não informado";
    document.getElementById("portfolioLocalizacao").textContent = `${maker.cidade || "Cidade"} - ${maker.estado || "UF"}`;

    document.getElementById("portfolioCnpj").textContent = maker.cnpj || "Não informado";

    document.getElementById("email_comercial").textContent = maker.email_comercial || "Nome não informado";
    
    document.getElementById("portfolioTelefoneComercial").textContent = maker.telefone_comercial || "Não informado";
    document.getElementById("portfolioEnderecoEmpresa").textContent = maker.endereco_empresa || "Não informado";
}

function preencherPortfolioMaker(fotos) {
    if (!fotos || fotos.length === 0) {
        setTexto("portfolioTitulo", "", "Nenhum projeto cadastrado");
        setTexto("portfolioDescricao", "", "Nenhuma descrição cadastrada");
        return;
    }

    const primeiraFoto = fotos[0];

    setTexto("portfolioTitulo", primeiraFoto.titulo, "Projeto sem título");
    setTexto("portfolioDescricao", primeiraFoto.descricao, "Sem descrição cadastrada");
}

function preencherImpressoras(impressoras) {
    const area = document.getElementById("portfolioImpressoras");

    if (!area) return;

    if (!impressoras || impressoras.length === 0) {
        area.innerHTML = `<p class="text-muted mb-0">Nenhuma impressora cadastrada.</p>`;
        return;
    }

    area.innerHTML = "";

    impressoras.forEach((imp) => {
        area.innerHTML += `
            <div class="portfolio-item">
                <strong>${imp.modelo || "Modelo não informado"}</strong><br>
                <small>Volume máximo: ${imp.volume_maximo_cm3 || "Não informado"} cm³</small><br>
                <small>Status: ${imp.status || "Não informado"}</small>
            </div>
        `;
    });
}

function preencherMateriais(materiais) {
    const area = document.getElementById("portfolioMateriais");

    if (!area) return;

    if (!materiais || materiais.length === 0) {
        area.innerHTML = `<p class="text-muted mb-0">Nenhum material cadastrado.</p>`;
        return;
    }

    area.innerHTML = "";

    materiais.forEach((mat) => {
        area.innerHTML += `
            <div class="portfolio-item">
                <strong>${mat.tipo_material || "Material não informado"}</strong><br>
                <small>Preço por grama: R$ ${mat.preco_por_grama || "0,00"}</small>
            </div>
        `;
    });
}

function preencherCarousel(fotos) {
    const carouselInner = document.getElementById("portfolioCarouselInner");

    if (!carouselInner) return;

    if (!fotos || fotos.length === 0) {
        carouselInner.innerHTML = `
            <div class="carousel-item active">
                <div class="portfolio-sem-foto">
                    <i class="bi bi-image"></i>
                    <p>Nenhuma foto adicionada ao portfólio ainda.</p>
                </div>
            </div>
        `;
        return;
    }

    carouselInner.innerHTML = "";

    fotos.forEach((foto, index) => {
        carouselInner.innerHTML += `
            <div class="carousel-item ${index === 0 ? "active" : ""}">
                <img 
                    src="../${foto.caminho_imagem}" 
                    class="d-block w-100 portfolio-img-carousel" 
                    alt="${foto.titulo || "Foto do portfólio"}"
                >

                <div class="carousel-caption d-none d-md-block bg-dark bg-opacity-50 rounded-3 p-2">
                    <h6>${foto.titulo || "Projeto sem título"}</h6>
                    <p>${foto.descricao || "Sem descrição cadastrada."}</p>
                </div>
            </div>
        `;
    });
}