document.addEventListener('DOMContentLoaded', () => {
    carregarPortfolios();
    
    const inputBusca = document.getElementById('input-busca');
    if (inputBusca) inputBusca.addEventListener('input', () => filtrarCards(inputBusca.value));
});

let todosOsMakers = [];

async function carregarPortfolios() {
    const grid = document.getElementById('grid-makers');
    grid.innerHTML = `<div class="loading-state"><div class="spinner-custom"></div><p>Carregando portfólios...</p></div>`;
    try {
        const res = await fetch('../app/controllers/fabricante/php/listar_portfolios_get.php');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { console.error(text); throw new Error('Resposta inválida do servidor.'); }
        if (!data.sucesso) throw new Error(data.mensagem);
        todosOsMakers = data.makers;
        renderizarCards(todosOsMakers);
    } catch (err) {
        console.error('Erro ao carregar portfólios:', err.message);
        grid.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Erro: <strong>${err.message}</strong></p></div>`;
    }
}

function filtrarCards(termo) {
    const filtrados = todosOsMakers.filter(m => {
        const b = termo.toLowerCase();
        return m.nome.toLowerCase().includes(b)
            || (m.nome_empresa && m.nome_empresa.toLowerCase().includes(b))
            || (m.cidade && m.cidade.toLowerCase().includes(b))
            || m.materiais.some(mat => mat.toLowerCase().includes(b));
    });
    renderizarCards(filtrados);
}

function renderizarCards(makers) {
    const grid = document.getElementById('grid-makers');
    if (makers.length === 0) {
        grid.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><p>Nenhum fabricante encontrado.</p></div>`;
        return;
    }
    grid.innerHTML = makers.map(criarCardHTML).join('');
}

function criarCardHTML(maker) {
    const fotos = maker.fotos && maker.fotos.length > 0 ? maker.fotos : [];
    const galeriaHTML = fotos.length > 0
        ? `<div class="card-galeria" data-total="${Math.min(fotos.length, 4)}">
            ${fotos.slice(0, 4).map((f, i) => `
                <div class="galeria-item ${i === 0 ? 'galeria-destaque' : ''}">
                    <img src="${f.caminho_imagem}" alt="${f.titulo}" loading="lazy"
                         onerror="this.parentElement.classList.add('img-erro')">
                    ${fotos.length > 4 && i === 3 ? `<div class="galeria-mais">+${fotos.length - 4}</div>` : ''}
                </div>`).join('')}
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
        ? `<img src="${maker.foto_perfil}" alt="${maker.nome}" class="maker-avatar">`
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
                        <span class="estrelas">${gerarEstrelas(maker.media_nota)}</span>
                        <span class="nota-texto">
                            ${maker.media_nota ? Number(maker.media_nota).toFixed(1) : 'Sem avaliações'}
                            ${maker.total_avaliacoes > 0 ? `<span class="total-aval">(${maker.total_avaliacoes})</span>` : ''}
                        </span>
                    </div>
                </div>
                <span class="badge-disponivel ${maker.disponivel_para_pedidos ? 'disponivel' : 'indisponivel'}">
                    ${maker.disponivel_para_pedidos ? 'Disponível' : 'Indisponível'}
                </span>
            </div>
            ${galeriaHTML}
            <div class="card-footer">
                <div class="materiais-lista">${materiaisHTML}</div>
                <button class="btn-ver-perfil" onclick="abrirPortfolio(${maker.maker_id})">
                    Ver portfólio
                </button>
            </div>
        </div>`;
}

function gerarEstrelas(nota) {
    const n = parseFloat(nota) || 0;
    return Array.from({ length: 5 }, (_, i) => {
        if (i < Math.floor(n)) return '<span class="estrela cheia">★</span>';
        if (i < n) return '<span class="estrela meia">★</span>';
        return '<span class="estrela vazia">☆</span>';
    }).join('');
}

/* ── MODAL ── */

async function abrirPortfolio(makerId) {
    const modal    = document.getElementById('modalPortfolio');
    const conteudo = document.getElementById('conteudoPortfolio');
    modal.classList.remove('hidden');
    conteudo.innerHTML = `<div class="loading-modal"><div class="spinner-custom"></div><p>Carregando portfólio...</p></div>`;

    try {
        const res  = await fetch(`../app/controllers/fabricante/php/detalhes_portfolio_get.php?id=${makerId}`);
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { console.error(text); throw new Error('Resposta inválida do servidor'); }
        if (!data.sucesso) throw new Error(data.mensagem);
        renderizarModalPortfolio(data);
    } catch (err) {
        conteudo.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>${err.message}</p></div>`;
    }
}

document.getElementById('fecharModal').addEventListener('click', () => {
    document.getElementById('modalPortfolio').classList.add('hidden');
});
document.getElementById('modalPortfolio').addEventListener('click', e => {
    if (e.target.id === 'modalPortfolio') e.currentTarget.classList.add('hidden');
});

function renderizarModalPortfolio(data) {
    const maker      = data.maker;
    const fotos      = data.fotos      || [];
    const materiais  = data.materiais  || [];
    const impressoras = data.impressoras || [];

    const avatarHTML = maker.foto_perfil
        ? `<img src="${maker.foto_perfil}" class="maker-avatar" style="width:72px;height:72px;">`
        : `<div class="maker-avatar avatar-inicial" style="width:72px;height:72px;font-size:1.6rem;">${(maker.nome_empresa || maker.nome)?.charAt(0) || 'M'}</div>`;

    /* Galeria */
    const galeriaHTML = fotos.length > 0
        ? `<div class="modal-galeria">
            ${fotos.map(f => `
                <div class="modal-galeria-item">
                    <img src="${f.caminho_imagem}" alt="${f.titulo}" loading="lazy"
                         onerror="this.src=''">
                    ${f.titulo    ? `<p class="mg-titulo">${f.titulo}</p>` : ''}
                    ${f.descricao ? `<p class="mg-desc">${f.descricao}</p>` : ''}
                </div>`).join('')}
           </div>`
        : `<div class="galeria-vazia" style="height:120px;">
               <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                   <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                   <path d="m21 15-5-5L5 21"/>
               </svg>
               <span>Sem fotos cadastradas</span>
           </div>`;

    /* Materiais */
    const materiaisHTML = materiais.length > 0
        ? `<div class="modal-tabela">
            ${materiais.map(m => `
                <div class="modal-tabela-row">
                    <span class="mt-nome"><i class="bi bi-circle-fill" style="font-size:.5rem;color:var(--roxo-claro)"></i> ${m.tipo_material}</span>
                    <span class="mt-preco">R$ ${parseFloat(m.preco_por_grama).toFixed(2)}<small>/g</small></span>
                </div>`).join('')}
           </div>`
        : `<p class="sem-material">Nenhum material cadastrado.</p>`;

    /* Impressoras */
    const tipoIcone = { FDM: '🖨️', SLS: '🔬', SLA: '💡', DLP: '📽️' };
    const impressorasHTML = impressoras.length > 0
        ? `<div class="modal-impressoras">
            ${impressoras.map(imp => `
                <div class="imp-card">
                    <div class="imp-topo">
                        <span class="imp-icone">${tipoIcone[imp.tipo_impressora] || '🖨️'}</span>
                        <div>
                            <p class="imp-modelo">${imp.modelo}</p>
                            <p class="imp-tipo">${imp.tipo_impressora || 'Tipo não informado'}</p>
                        </div>
                        <span class="imp-status ${imp.status === 'DISPONIVEL' ? 'disp' : 'manut'}">
                            ${imp.status === 'DISPONIVEL' ? 'Disponível' : 'Manutenção'}
                        </span>
                    </div>
                    <div class="imp-detalhes">
                        <span><i class="bi bi-box"></i> Vol. máx.: <strong>${imp.volume_maximo_cm3 ? Number(imp.volume_maximo_cm3).toLocaleString('pt-BR') + ' cm³' : '—'}</strong></span>
                        <span><i class="bi bi-stack"></i> Quantidade: <strong>${imp.quantidade || 1}</strong></span>
                    </div>
                </div>`).join('')}
           </div>`
        : `<p class="sem-material">Nenhuma impressora cadastrada.</p>`;

    /* Info empresa */
    const infoHTML = `
        <div class="modal-info-grid">
            ${maker.nome_empresa    ? `<div class="mig-item"><span class="mig-label">Empresa</span><span>${maker.nome_empresa}</span></div>` : ''}
            ${maker.email_comercial ? `<div class="mig-item"><span class="mig-label">E-mail comercial</span><span>${maker.email_comercial}</span></div>` : ''}
            ${maker.telefone_comercial ? `<div class="mig-item"><span class="mig-label">Telefone</span><span>${maker.telefone_comercial}</span></div>` : ''}
            ${maker.endereco_empresa ? `<div class="mig-item"><span class="mig-label">Endereço</span><span>${maker.endereco_empresa}</span></div>` : ''}
        </div>`;

    document.getElementById('conteudoPortfolio').innerHTML = `
        <style>
            /* ── estilos internos do modal ── */
            .perfil-topo { display:flex; align-items:center; gap:16px; margin-bottom:1.25rem; }
            .perfil-topo h2 { font-size:1.3rem; font-weight:700; color:var(--roxo-escuro); margin:0; }
            .perfil-topo p  { font-size:.85rem; color:var(--cinza-texto); margin:2px 0 0; }
            .estrelas-modal { font-size:1rem; }
            .modal-secao { margin-bottom:1.75rem; }
            .modal-secao h4 {
                font-size:.8rem; font-weight:700; letter-spacing:.08em;
                text-transform:uppercase; color:var(--roxo-medio);
                margin-bottom:.75rem; padding-bottom:.4rem;
                border-bottom:1px solid var(--cinza-borda);
            }
            /* galeria */
            .modal-galeria {
                display:grid;
                grid-template-columns:repeat(auto-fill, minmax(180px,1fr));
                gap:10px;
            }
            .modal-galeria-item { border-radius:10px; overflow:hidden; background:var(--rosa-claro); }
            .modal-galeria-item img { width:100%; height:150px; object-fit:cover; display:block; }
            .mg-titulo { font-size:.8rem; font-weight:600; color:var(--roxo-escuro); padding:6px 8px 2px; }
            .mg-desc   { font-size:.75rem; color:var(--cinza-texto); padding:0 8px 8px; }
            /* tabela materiais */
            .modal-tabela { display:flex; flex-direction:column; gap:6px; }
            .modal-tabela-row {
                display:flex; align-items:center; justify-content:space-between;
                padding:8px 12px; background:var(--rosa-claro);
                border-radius:8px; border:1px solid var(--cinza-borda);
            }
            .mt-nome  { font-size:.88rem; font-weight:500; color:var(--roxo-escuro); display:flex; align-items:center; gap:8px; }
            .mt-preco { font-size:.88rem; font-weight:700; color:var(--roxo-medio); }
            .mt-preco small { font-weight:400; color:var(--cinza-texto); font-size:.75rem; }
            /* impressoras */
            .modal-impressoras { display:flex; flex-direction:column; gap:10px; }
            .imp-card {
                border:1px solid var(--cinza-borda); border-radius:10px;
                overflow:hidden;
            }
            .imp-topo {
                display:flex; align-items:center; gap:12px;
                padding:10px 14px; background:var(--rosa-claro);
            }
            .imp-icone { font-size:1.5rem; flex-shrink:0; }
            .imp-modelo { font-size:.9rem; font-weight:600; color:var(--roxo-escuro); margin:0; }
            .imp-tipo   { font-size:.75rem; color:var(--cinza-texto); margin:0; }
            .imp-status {
                margin-left:auto; font-size:.7rem; font-weight:600;
                padding:3px 10px; border-radius:20px; white-space:nowrap;
            }
            .imp-status.disp  { background:#dcfce7; color:#16a34a; }
            .imp-status.manut { background:#fee2e2; color:#dc2626; }
            .imp-detalhes {
                display:flex; gap:1.5rem; padding:8px 14px;
                font-size:.8rem; color:var(--cinza-texto);
            }
            .imp-detalhes strong { color:var(--roxo-escuro); }
            /* info grid */
            .modal-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
            .mig-item { display:flex; flex-direction:column; gap:2px; }
            .mig-label { font-size:.72rem; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--roxo-claro); }
            .mig-item span:last-child { font-size:.88rem; color:var(--roxo-escuro); }
            @media(max-width:600px){ .modal-info-grid{ grid-template-columns:1fr; } }
        </style>

        <div style="padding:24px;">

            <!-- TOPO -->
            <div class="perfil-topo">
                ${avatarHTML}
                <div>
                    <h2>${maker.nome_empresa || maker.nome}</h2>
                    <p><i class="bi bi-geo-alt"></i> ${maker.cidade || '—'} - ${maker.estado || ''}</p>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
                        <span class="estrelas-modal">${gerarEstrelas(maker.media_nota)}</span>
                        <span style="font-size:.8rem;color:var(--cinza-texto);">
                            ${maker.media_nota ? Number(maker.media_nota).toFixed(1) : 'Sem avaliações'}
                            ${maker.total_avaliacoes > 0 ? `(${maker.total_avaliacoes} avaliações)` : ''}
                        </span>
                    </div>
                </div>
                <span class="badge-disponivel ${maker.disponivel_para_pedidos ? 'disponivel' : 'indisponivel'}" style="margin-left:auto;">
                    ${maker.disponivel_para_pedidos ? 'Disponível' : 'Indisponível'}
                </span>
            </div>

            <hr style="margin-bottom:1.5rem;border-color:var(--cinza-borda);">

            <!-- INFORMAÇÕES DA EMPRESA -->
            ${(maker.nome_empresa || maker.email_comercial || maker.telefone_comercial || maker.endereco_empresa) ? `
            <div class="modal-secao">
                <h4><i class="bi bi-building"></i> Informações da Empresa</h4>
                ${infoHTML}
            </div>` : ''}

            <!-- GALERIA -->
            <div class="modal-secao">
                <h4><i class="bi bi-images"></i> Galeria (${fotos.length} foto${fotos.length !== 1 ? 's' : ''})</h4>
                ${galeriaHTML}
            </div>

            <!-- MATERIAIS -->
            <div class="modal-secao">
                <h4><i class="bi bi-layers"></i> Materiais que Imprime</h4>
                ${materiaisHTML}
            </div>

            <!-- IMPRESSORAS -->
            <div class="modal-secao">
                <h4><i class="bi bi-printer"></i> Impressoras (${impressoras.length})</h4>
                ${impressorasHTML}
            </div>

            <!-- BOTÃO PEDIDO -->
            <div style="display:flex;justify-content:flex-end;margin-top:.5rem;">
                <a href="index.php?rota=realizar-pedido&maker_id=${maker.maker_id}" class="btn-ver-perfil" style="width:auto;padding:10px 28px;">
                    <i class="bi bi-send"></i> Realizar Pedido
                </a>
            </div>

        </div>`;
}