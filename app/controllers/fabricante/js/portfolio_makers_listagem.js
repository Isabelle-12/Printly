// Base aponta para a raiz do projeto (um nível acima de public/)
const BASE_URL = '/Printly/';

function montarUrl(caminho) {
    if (!caminho) return null;
    if (caminho.startsWith('http') || caminho.startsWith('/Printly')) return caminho;
    return BASE_URL + caminho;
}

function montarUrlPerfil(caminho) {
    if (!caminho) return null;
    if (caminho.startsWith('http') || caminho.startsWith('/Printly')) return caminho;
    return BASE_URL + caminho;
}

document.addEventListener('DOMContentLoaded', () => {
    carregarPortfolios();
    const inputBusca = document.getElementById('input-busca');
    if (inputBusca) inputBusca.addEventListener('input', () => filtrarCards(inputBusca.value));

    // PBI 25 - inicializa filtro de localização se os campos existirem
    inicializarFiltroLocalizacao();
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

function avatarFallback(inicial) {
    return `<div class="maker-avatar avatar-inicial">${inicial}</div>`;
}

function criarCardHTML(maker) {
    const fotos = maker.fotos && maker.fotos.length > 0 ? maker.fotos : [];
    const inicial = maker.nome.charAt(0).toUpperCase();

    const galeriaHTML = fotos.length > 0
        ? `<div class="card-galeria" data-total="${Math.min(fotos.length, 4)}">
            ${fotos.slice(0, 4).map((f, i) => `
                <div class="galeria-item ${i === 0 ? 'galeria-destaque' : ''}">
                    <img src="${montarUrl(f.caminho_imagem)}" alt="${f.titulo}" loading="lazy"
                         onerror="this.parentElement.style.background='var(--rosa-claro)'">
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

    const urlPerfil = montarUrlPerfil(maker.foto_empresa);
    const fotoHTML  = urlPerfil
        ? `<img src="${urlPerfil}" alt="${maker.nome}" class="maker-avatar"
               onerror="this.replaceWith((() => { const d = document.createElement('div'); d.className='maker-avatar avatar-inicial'; d.textContent='${inicial}'; return d; })()">`
        : avatarFallback(inicial);

    // PBI 25 - exibe distância se disponível
    const distanciaHTML = (maker.distancia_km !== null && maker.distancia_km !== undefined)
        ? `<span class="badge-distancia"><i class="bi bi-geo-fill"></i> ${Number(maker.distancia_km).toFixed(1)} km</span>`
        : '';

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
                        ${distanciaHTML}
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
        if (i < n)             return '<span class="estrela meia">★</span>';
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
        carregarAvaliacoesNoModal(makerId); // PBI 20
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
    const maker       = data.maker;
    const fotos       = data.fotos       || [];
    const materiais   = data.materiais   || [];
    const impressoras = data.impressoras || [];

    const inicial    = (maker.nome_empresa || maker.nome)?.charAt(0) || 'M';
    const urlPerfil  = montarUrlPerfil(maker.foto_empresa);
    const avatarHTML = urlPerfil
        ? `<img src="${urlPerfil}" class="maker-avatar" style="width:72px;height:72px;"
               onerror="this.replaceWith((() => { const d=document.createElement('div'); d.className='maker-avatar avatar-inicial'; d.style.cssText='width:72px;height:72px;font-size:1.6rem;'; d.textContent='${inicial}'; return d; })()">`
        : `<div class="maker-avatar avatar-inicial" style="width:72px;height:72px;font-size:1.6rem;">${inicial}</div>`;

    const galeriaHTML = fotos.length > 0
        ? `<div class="modal-galeria">
            ${fotos.map(f => `
                <div class="modal-galeria-item">
                    <img src="${montarUrl(f.caminho_imagem)}" alt="${f.titulo}" loading="lazy"
                         onerror="this.parentElement.style.display='none'">
                    ${f.titulo    ? `<p class="mg-titulo">${f.titulo}</p>`  : ''}
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

    const materiaisHTML = materiais.length > 0
        ? `<div class="modal-tabela">
            ${materiais.map(m => `
                <div class="modal-tabela-row">
                    <span class="mt-nome"><i class="bi bi-circle-fill" style="font-size:.5rem;color:var(--roxo-claro)"></i> ${m.tipo_material}</span>
                    <span class="mt-preco">R$ ${parseFloat(m.preco_por_grama).toFixed(2)}<small>/g</small></span>
                </div>`).join('')}
           </div>`
        : `<p class="sem-material">Nenhum material cadastrado.</p>`;

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
                        <span><i class="bi bi-stack"></i> Qtd.: <strong>${imp.quantidade || 1}</strong></span>
                    </div>
                </div>`).join('')}
           </div>`
        : `<p class="sem-material">Nenhuma impressora cadastrada.</p>`;

    const infoHTML = `
        <div class="modal-info-grid">
            ${maker.nome_empresa       ? `<div class="mig-item"><span class="mig-label">Empresa</span><span>${maker.nome_empresa}</span></div>`            : ''}
            ${maker.email_comercial    ? `<div class="mig-item"><span class="mig-label">E-mail comercial</span><span>${maker.email_comercial}</span></div>` : ''}
            ${maker.telefone_comercial ? `<div class="mig-item"><span class="mig-label">Telefone</span><span>${maker.telefone_comercial}</span></div>`       : ''}
            ${maker.endereco_empresa   ? `<div class="mig-item"><span class="mig-label">Endereço</span><span>${maker.endereco_empresa}</span></div>`         : ''}
        </div>`;

    document.getElementById('conteudoPortfolio').innerHTML = `
        <style>
            .perfil-topo{display:flex;align-items:center;gap:16px;margin-bottom:1.25rem}
            .perfil-topo h2{font-size:1.3rem;font-weight:700;color:var(--roxo-escuro);margin:0}
            .perfil-topo p{font-size:.85rem;color:var(--cinza-texto);margin:2px 0 0}
            .estrelas-modal{font-size:1rem}
            .modal-secao{margin-bottom:1.75rem}
            .modal-secao h4{font-size:.8rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--roxo-medio);margin-bottom:.75rem;padding-bottom:.4rem;border-bottom:1px solid var(--cinza-borda)}
            .modal-galeria{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}
            .modal-galeria-item{border-radius:10px;overflow:hidden;background:var(--rosa-claro)}
            .modal-galeria-item img{width:100%;height:150px;object-fit:cover;display:block}
            .mg-titulo{font-size:.8rem;font-weight:600;color:var(--roxo-escuro);padding:6px 8px 2px}
            .mg-desc{font-size:.75rem;color:var(--cinza-texto);padding:0 8px 8px}
            .modal-tabela{display:flex;flex-direction:column;gap:6px}
            .modal-tabela-row{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--rosa-claro);border-radius:8px;border:1px solid var(--cinza-borda)}
            .mt-nome{font-size:.88rem;font-weight:500;color:var(--roxo-escuro);display:flex;align-items:center;gap:8px}
            .mt-preco{font-size:.88rem;font-weight:700;color:var(--roxo-medio)}
            .mt-preco small{font-weight:400;color:var(--cinza-texto);font-size:.75rem}
            .modal-impressoras{display:flex;flex-direction:column;gap:10px}
            .imp-card{border:1px solid var(--cinza-borda);border-radius:10px;overflow:hidden}
            .imp-topo{display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--rosa-claro)}
            .imp-icone{font-size:1.5rem;flex-shrink:0}
            .imp-modelo{font-size:.9rem;font-weight:600;color:var(--roxo-escuro);margin:0}
            .imp-tipo{font-size:.75rem;color:var(--cinza-texto);margin:0}
            .imp-status{margin-left:auto;font-size:.7rem;font-weight:600;padding:3px 10px;border-radius:20px;white-space:nowrap}
            .imp-status.disp{background:#dcfce7;color:#16a34a}
            .imp-status.manut{background:#fee2e2;color:#dc2626}
            .imp-detalhes{display:flex;gap:1.5rem;padding:8px 14px;font-size:.8rem;color:var(--cinza-texto)}
            .imp-detalhes strong{color:var(--roxo-escuro)}
            .modal-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
            .mig-item{display:flex;flex-direction:column;gap:2px}
            .mig-label{font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--roxo-claro)}
            .mig-item span:last-child{font-size:.88rem;color:var(--roxo-escuro)}
            @media(max-width:600px){.modal-info-grid{grid-template-columns:1fr}}
        </style>

        <div style="padding:24px;">
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

            ${(maker.nome_empresa || maker.email_comercial || maker.telefone_comercial || maker.endereco_empresa) ? `
            <div class="modal-secao">
                <h4><i class="bi bi-building"></i> Informações da Empresa</h4>
                ${infoHTML}
            </div>` : ''}

            <div class="modal-secao">
                <h4><i class="bi bi-images"></i> Galeria (${fotos.length} foto${fotos.length !== 1 ? 's' : ''})</h4>
                ${galeriaHTML}
            </div>

            <div class="modal-secao">
                <h4><i class="bi bi-layers"></i> Materiais que Imprime</h4>
                ${materiaisHTML}
            </div>

            <div class="modal-secao">
                <h4><i class="bi bi-printer"></i> Impressoras (${impressoras.length})</h4>
                ${impressorasHTML}
            </div>

            <div style="display:flex;justify-content:flex-end;margin-top:.5rem;">
                <a href="index.php?rota=realizar-pedido&maker_id=${maker.maker_id}" class="btn-ver-perfil" style="width:auto;padding:10px 28px;">
                    <i class="bi bi-send"></i> Realizar Pedido
                </a>
            </div>
        </div>`;
}

/* ───── PBI 20 - AVALIAÇÕES ───── */

async function carregarAvaliacoesNoModal(makerId) {
    const conteudo = document.getElementById('conteudoPortfolio');
    if (!conteudo) return;

    let wrapper = document.getElementById('secao-avaliacoes-wrapper');
    if (wrapper) wrapper.remove();

    wrapper = document.createElement('div');
    wrapper.id = 'secao-avaliacoes-wrapper';
    wrapper.style.padding = '0 24px 24px';
    wrapper.dataset.makerId = makerId;
    conteudo.appendChild(wrapper);

    try {
        const res  = await fetch(`../app/controllers/usuario/php/listar_avaliacoes_maker.php?maker_id=${makerId}`);
        const data = await res.json();
        const avaliacoes = (data.status === 'ok') ? data.data.avaliacoes : [];
        renderSecaoAvaliacoes(wrapper, makerId, avaliacoes);
    } catch (err) {
        renderSecaoAvaliacoes(wrapper, makerId, []);
    }
}

function renderSecaoAvaliacoes(wrapper, makerId, avaliacoes) {
    const listaHTML = avaliacoes.length > 0
        ? avaliacoes.map(a => `
            <div class="aval-card">
                <div class="aval-topo">
                    <strong>${escapeAval(a.cliente_nome)}</strong>
                    <span class="aval-data">${formatarDataAval(a.data_avaliacao)}</span>
                </div>
                <div class="aval-estrelas">${gerarEstrelas(a.nota)}</div>
                ${a.comentario ? `<p class="aval-comentario">${escapeAval(a.comentario)}</p>` : ''}
                ${a.resposta_maker ? `
                    <div class="aval-resposta">
                        <strong><i class="bi bi-reply"></i> Resposta do fabricante:</strong>
                        <p>${escapeAval(a.resposta_maker)}</p>
                    </div>` : ''}
            </div>`).join('')
        : `<p class="sem-material">Este fabricante ainda não recebeu avaliações.</p>`;

    wrapper.innerHTML = `
        <style>
            .aval-card{background:var(--rosa-claro);border:1px solid var(--cinza-borda);border-radius:10px;padding:12px 14px;margin-bottom:10px}
            .aval-topo{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
            .aval-topo strong{color:var(--roxo-escuro);font-size:.9rem}
            .aval-data{font-size:.75rem;color:var(--cinza-texto)}
            .aval-estrelas{font-size:.95rem;color:#f59e0b;margin-bottom:6px}
            .aval-comentario{font-size:.85rem;color:var(--roxo-escuro);margin:0}
            .aval-resposta{background:#fff;border-left:3px solid var(--roxo-medio);padding:8px 12px;margin-top:8px;border-radius:6px}
            .aval-resposta strong{font-size:.78rem;color:var(--roxo-medio)}
            .aval-resposta p{font-size:.82rem;color:var(--roxo-escuro);margin:4px 0 0}
            .form-feedback{background:#fff;border:1px solid var(--cinza-borda);border-radius:10px;padding:16px;margin-top:12px}
            .form-feedback label{font-size:.8rem;font-weight:600;color:var(--roxo-medio);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:6px}
            .form-feedback textarea{width:100%;border:1px solid var(--cinza-borda);border-radius:8px;padding:8px 10px;font-size:.88rem;resize:vertical;min-height:70px;font-family:inherit}
            .form-feedback textarea:focus{outline:none;border-color:var(--roxo-medio)}
            .rating-input{display:flex;gap:4px;font-size:1.4rem;cursor:pointer;color:#d1d5db;margin-bottom:12px}
            .rating-input i.ativa{color:#f59e0b}
            .form-feedback-msg{font-size:.82rem;margin-top:8px;padding:6px 10px;border-radius:6px}
            .form-feedback-msg.ok{background:#dcfce7;color:#16a34a}
            .form-feedback-msg.erro{background:#fee2e2;color:#dc2626}
            .btn-enviar-feedback{background:var(--roxo-medio);color:#fff;border:none;border-radius:30px;padding:8px 20px;font-size:.85rem;font-weight:600;cursor:pointer;margin-top:10px}
            .btn-enviar-feedback:hover{background:var(--roxo-escuro)}
            .btn-enviar-feedback:disabled{opacity:.6;cursor:not-allowed}
        </style>

        <div class="modal-secao">
            <h4><i class="bi bi-star"></i> Avaliações (${avaliacoes.length})</h4>
            <div id="lista-avaliacoes">${listaHTML}</div>
        </div>

        <div class="modal-secao">
            <h4><i class="bi bi-pencil-square"></i> Deixar feedback</h4>
            <form class="form-feedback" id="form-feedback" data-maker-id="${makerId}">
                <label>Sua nota</label>
                <div class="rating-input" id="rating-input">
                    <i class="bi bi-star" data-nota="1"></i>
                    <i class="bi bi-star" data-nota="2"></i>
                    <i class="bi bi-star" data-nota="3"></i>
                    <i class="bi bi-star" data-nota="4"></i>
                    <i class="bi bi-star" data-nota="5"></i>
                </div>
                <input type="hidden" id="nota-selecionada" value="0">

                <label>Comentário</label>
                <textarea id="comentario-feedback" placeholder="Conte como foi sua experiência..."></textarea>

                <button type="submit" class="btn-enviar-feedback">
                    <i class="bi bi-send"></i> Enviar feedback
                </button>
                <div id="form-feedback-msg"></div>
            </form>
        </div>
    `;

    ativarRating();
    document.getElementById('form-feedback').addEventListener('submit', enviarFeedback);
}

function ativarRating() {
    const estrelas = document.querySelectorAll('#rating-input i');
    estrelas.forEach(estrela => {
        estrela.addEventListener('click', () => {
            const nota = parseInt(estrela.dataset.nota);
            document.getElementById('nota-selecionada').value = nota;
            estrelas.forEach(e => {
                const en = parseInt(e.dataset.nota);
                e.classList.toggle('ativa', en <= nota);
                e.classList.toggle('bi-star-fill', en <= nota);
                e.classList.toggle('bi-star', en > nota);
            });
        });
    });
}

async function enviarFeedback(e) {
    e.preventDefault();
    const form = e.target;
    const makerId = form.dataset.makerId;
    const nota = parseInt(document.getElementById('nota-selecionada').value);
    const comentario = document.getElementById('comentario-feedback').value.trim();
    const msgBox = document.getElementById('form-feedback-msg');
    const btn = form.querySelector('.btn-enviar-feedback');

    msgBox.innerHTML = '';

    if (nota < 1 || nota > 5) {
        msgBox.innerHTML = `<div class="form-feedback-msg erro">Selecione uma nota de 1 a 5 estrelas.</div>`;
        return;
    }

    btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('maker_id', makerId);
        formData.append('nota', nota);
        formData.append('comentario', comentario);

        const res = await fetch('../app/controllers/usuario/php/criar_avaliacao.php', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.status === 'ok') {
            msgBox.innerHTML = `<div class="form-feedback-msg ok">${data.mensagem}</div>`;
            carregarAvaliacoesNoModal(makerId);
        } else {
            msgBox.innerHTML = `<div class="form-feedback-msg erro">${data.mensagem}</div>`;
            btn.disabled = false;
        }
    } catch (err) {
        msgBox.innerHTML = `<div class="form-feedback-msg erro">Erro ao enviar. Tente novamente.</div>`;
        btn.disabled = false;
    }
}

function escapeAval(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function formatarDataAval(str) {
    const d = new Date(str);
    return d.toLocaleDateString('pt-BR');
}

/* ───── PBI 25 - FILTRO POR LOCALIZAÇÃO ───── */

function inicializarFiltroLocalizacao() {
    const form = document.getElementById('form-filtro-local');
    const btnLocal = document.getElementById('btn-usar-local');
    const btnLimpar = document.getElementById('btn-limpar-filtro');
    if (!form) return;

    form.addEventListener('submit', e => {
        e.preventDefault();
        const cep    = document.getElementById('filtro-cep').value.trim();
        const cidade = document.getElementById('filtro-cidade').value.trim();
        const estado = document.getElementById('filtro-estado').value.trim();
        const raio   = document.getElementById('filtro-raio').value.trim();

        if (!cep && !cidade && !estado) {
            mostrarMensagemFiltro('Informe ao menos CEP, cidade ou estado.', 'erro');
            return;
        }

        const params = new URLSearchParams();
        if (cep)    params.append('cep', cep);
        if (cidade) params.append('cidade', cidade);
        if (estado) params.append('estado', estado);
        if (raio)   params.append('raio', raio);
        buscarComLocalizacao(params);
    });

    if (btnLocal) {
        btnLocal.addEventListener('click', usarMinhaLocalizacao);
    }

    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            document.getElementById('filtro-cep').value = '';
            document.getElementById('filtro-cidade').value = '';
            document.getElementById('filtro-estado').value = '';
            document.getElementById('filtro-raio').value = '50';
            mostrarMensagemFiltro('', '');
            carregarPortfolios();
        });
    }
}

function usarMinhaLocalizacao() {
    if (!navigator.geolocation) {
        mostrarMensagemFiltro('Seu navegador não suporta geolocalização.', 'erro');
        return;
    }

    mostrarMensagemFiltro('Obtendo sua localização...', 'info');

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const params = new URLSearchParams();
            params.append('lat', pos.coords.latitude);
            params.append('lng', pos.coords.longitude);
            const raio = document.getElementById('filtro-raio').value.trim();
            if (raio) params.append('raio', raio);
            buscarComLocalizacao(params);
        },
        (err) => {
            mostrarMensagemFiltro('Não foi possível acessar sua localização. Permita o acesso ou use CEP/cidade.', 'erro');
        },
        { timeout: 10000 }
    );
}

async function buscarComLocalizacao(params) {
    const grid = document.getElementById('grid-makers');
    grid.innerHTML = `<div class="loading-state"><div class="spinner-custom"></div><p>Buscando fabricantes na região...</p></div>`;

    try {
        const res = await fetch(`../app/controllers/fabricante/php/buscar_makers_localizacao.php?${params.toString()}`);
        const data = await res.json();

        if (data.status !== 'ok') {
            mostrarMensagemFiltro(data.mensagem, 'erro');
            grid.innerHTML = '';
            return;
        }

        if (data.data.vazio) {
            mostrarMensagemFiltro(data.mensagem, 'info');
            grid.innerHTML = `<div class="empty-state"><span class="empty-icon">📍</span><p>${data.mensagem}</p></div>`;
            todosOsMakers = [];
            return;
        }

        mostrarMensagemFiltro(data.mensagem, 'ok');
        todosOsMakers = data.data.makers;
        renderizarCards(todosOsMakers);
    } catch (err) {
        mostrarMensagemFiltro('Erro ao buscar. Tente novamente.', 'erro');
        grid.innerHTML = '';
    }
}

function mostrarMensagemFiltro(texto, tipo) {
    const box = document.getElementById('mensagem-filtro');
    if (!box) return;
    if (!texto) {
        box.style.display = 'none';
        box.innerHTML = '';
        return;
    }
    box.style.display = 'block';
    box.className = 'mensagem-filtro mensagem-' + tipo;
    box.textContent = texto;
}