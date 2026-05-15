document.addEventListener('DOMContentLoaded', () => {
    carregarPortfolios();


    const inputBusca = document.getElementById('input-busca');
    if (inputBusca) {
        inputBusca.addEventListener('input', () => filtrarCards(inputBusca.value));
    }
});

let todosOsMakers = [];

async function carregarPortfolios() {
    const grid = document.getElementById('grid-makers');
    grid.innerHTML = `
        <div class="loading-state">
            <div class="spinner-custom"></div>
            <p>Carregando portfólios...</p>
        </div>
    `;

    try {
        const res = await fetch('../app/controllers/fabricante/php/listar_portfolios_get.php');

        // Se não veio 200, loga o status e lança erro
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text = await res.text();

        // Tenta parsear — se o PHP retornou HTML de erro, vai cair no catch
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            console.error('Resposta do PHP não é JSON:', text);
            throw new Error('Resposta inválida do servidor.');
        }

        if (!data.sucesso) throw new Error(data.mensagem);

        todosOsMakers = data.makers;
        renderizarCards(todosOsMakers);

    } catch (err) {
        console.error('Erro ao carregar portfólios:', err.message);
        grid.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⚠️</span>
                <p>Erro ao carregar portfólios: <strong>${err.message}</strong></p>
            </div>
        `;
    }
}

function filtrarCards(termo) {
    const filtrados = todosOsMakers.filter(m => {
        const busca = termo.toLowerCase();
        return (
            m.nome.toLowerCase().includes(busca) ||
            (m.nome_empresa && m.nome_empresa.toLowerCase().includes(busca)) ||
            (m.cidade && m.cidade.toLowerCase().includes(busca)) ||
            m.materiais.some(mat => mat.toLowerCase().includes(busca))
        );
    });
    renderizarCards(filtrados);
}

function renderizarCards(makers) {
    const grid = document.getElementById('grid-makers');

    if (makers.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🔍</span>
                <p>Nenhum fabricante encontrado.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = makers.map(maker => criarCardHTML(maker)).join('');
}

function criarCardHTML(maker) {
    const estrelas = gerarEstrelas(maker.media_nota);
    const disponivel = maker.disponivel_para_pedidos;

    const fotos = maker.fotos && maker.fotos.length > 0 ? maker.fotos : [];

    const galeriaHTML = fotos.length > 0
        ? `<div class="card-galeria" data-total="${Math.min(fotos.length, 4)}">
            ${fotos.slice(0, 4).map((f, i) => `
                <div class="galeria-item ${i === 0 ? 'galeria-destaque' : ''}">
                    <img src="../${f.caminho_imagem}" alt="${f.titulo}" loading="lazy"
                         onerror="this.parentElement.classList.add('img-erro')">
                    ${fotos.length > 4 && i === 3
                        ? `<div class="galeria-mais">+${fotos.length - 4}</div>`
                        : ''}
                </div>
            `).join('')}
           </div>`
        : `<div class="galeria-vazia">
               <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                   <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                   <path d="m21 15-5-5L5 21"/>
               </svg>
               <span>Sem fotos no portfólio</span>
           </div>`;

    const materiaisHTML = maker.materiais && maker.materiais.length > 0
        ? maker.materiais.map(m => `<span class="badge-material">${m}</span>`).join('')
        : '<span class="sem-material">Nenhum material cadastrado</span>';

    const fotoHTML = maker.foto_perfil
        ? `<img src="../${maker.foto_perfil}" alt="${maker.nome}" class="maker-avatar">`
        : `<div class="maker-avatar avatar-inicial">${maker.nome.charAt(0).toUpperCase()}</div>`;

    return `
        <div class="maker-card" data-id="${maker.maker_id}">
            <div class="card-header">
                ${fotoHTML}
                <div class="maker-info">
                    <h3 class="maker-nome">${maker.nome_empresa || maker.nome}</h3>
                    <span class="maker-local">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                            <circle cx="12" cy="9" r="2.5"/>
                        </svg>
                        ${maker.cidade || '—'}, ${maker.estado || ''}
                    </span>
                    <div class="maker-avaliacao">
                        <span class="estrelas">${estrelas}</span>
                        <span class="nota-texto">
                            ${maker.media_nota ? Number(maker.media_nota).toFixed(1) : 'Sem avaliações'}
                            ${maker.total_avaliacoes > 0 ? `<span class="total-aval">(${maker.total_avaliacoes})</span>` : ''}
                        </span>
                    </div>
                </div>
                <span class="badge-disponivel ${disponivel ? 'disponivel' : 'indisponivel'}">
                    ${disponivel ? 'Disponível' : 'Indisponível'}
                </span>
            </div>

            ${galeriaHTML}

            <div class="card-footer">
                <div class="materiais-lista">${materiaisHTML}</div>
                <button 
                    class="btn-ver-perfil"
                    onclick="abrirPortfolio(${maker.maker_id})">
                    Ver portfólio
                </button>
            </div>
        </div>
    `;
}

function gerarEstrelas(nota) {
    const n = parseFloat(nota) || 0;
    return Array.from({ length: 5 }, (_, i) => {
        if (i < Math.floor(n)) return '<span class="estrela cheia">★</span>';
        if (i < n) return '<span class="estrela meia">★</span>';
        return '<span class="estrela vazia">☆</span>';
    }).join('');
}

async function abrirPortfolio(makerId){

    const modal = document.getElementById('modalPortfolio');
    const conteudo = document.getElementById('conteudoPortfolio');

    modal.classList.remove('hidden');

    conteudo.innerHTML = `
        <div class="loading-modal">
            <div class="spinner-custom"></div>
            <p>Carregando portfólio...</p>
        </div>
    `;

    try{

        const response = await fetch(
            `../app/controllers/fabricante/php/detalhes_portfolio_get.php?id=${makerId}`
        );

        const text = await response.text();

        let data;

        try{
            data = JSON.parse(text);
        }catch{
            console.error(text);
            throw new Error('Resposta inválida do servidor');
        }

        if(!data.sucesso){
            throw new Error(data.mensagem);
        }

        renderizarModalPortfolio(data);

    }catch(err){

        conteudo.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⚠️</span>
                <p>${err.message}</p>
            </div>
        `;
    }
}

document
    .getElementById('fecharModal')
    .addEventListener('click', () => {

        document
            .getElementById('modalPortfolio')
            .classList
            .add('hidden');
    });

document
    .getElementById('modalPortfolio')
    .addEventListener('click', (e) => {

        if(e.target.id === 'modalPortfolio'){

            e.currentTarget.classList.add('hidden');
        }
    });

function renderizarModalPortfolio(data){

    const maker = data.maker;

    const fotos = data.fotos || [];
    const materiais = data.materiais || [];
    const impressoras = data.impressoras || [];

    document.getElementById('conteudoPortfolio').innerHTML = `

        <div class="perfil-maker">

            <div class="d-flex align-items-center gap-3 mb-4">

                ${
                    maker.foto_perfil
                    ? `
                        <img 
                            src="../${maker.foto_perfil}"
                            class="maker-avatar"
                            style="width:80px;height:80px;"
                        >
                    `
                    : `
                        <div class="maker-avatar avatar-inicial"
                             style="width:80px;height:80px;">
                            ${maker.nome?.charAt(0) || 'M'}
                        </div>
                    `
                }

                <div>
                    <h2>${maker.nome}</h2>
                    <p>${maker.cidade || '—'} - ${maker.estado || ''}</p>
                </div>

            </div>

            <hr>

            <h4 class="mb-3">Galeria</h4>

            <div class="card-galeria mb-4">

                ${
                    fotos.length > 0
                    ? fotos.map(f => `
                        <div class="galeria-item">
                            <img src="../${f.caminho_imagem}">
                        </div>
                    `).join('')
                    : `
                        <div class="galeria-vazia">
                            Sem fotos cadastradas
                        </div>
                    `
                }

            </div>

            <h4 class="mb-3">Materiais</h4>

            <div class="materiais-lista mb-4">

                ${
                    materiais.length > 0
                    ? materiais.map(m => `
                        <span class="badge-material">
                            ${m.tipo_material}
                        </span>
                    `).join('')
                    : `<span class="sem-material">Nenhum material</span>`
                }

            </div>

            <h4 class="mb-3">Impressoras</h4>

            <div class="d-flex flex-wrap gap-2">

                ${
                    impressoras.length > 0
                    ? impressoras.map(i => `
                        <span class="badge-material">
                            ${i.modelo}
                        </span>
                    `).join('')
                    : `<span class="sem-material">Nenhuma impressora</span>`
                }

            </div>

            <div class="mt-4 d-flex justify-content-end">
                <a 
                    href="index.php?rota=realizar-pedido&maker_id=${maker.maker_id}"
                    class="btn btn-primary"
                >
                    Realizar Pedido
                </a>
            </div>

        </div>
    `;
}