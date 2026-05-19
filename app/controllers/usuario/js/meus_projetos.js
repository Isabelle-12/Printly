const BASE_URL = '/Printly/';

function montarUrlCapa(caminho) {
    if (!caminho) return null;
    if (caminho.startsWith('http') || caminho.startsWith('/')) return caminho;
    return BASE_URL + caminho;
}

/* ── STATUS CONFIG ── */
const STATUS_CONFIG = {
    AGUARDANDO_CONFIRMACAO: { texto: 'Em análise',   classe: 'analise',   icone: 'bi-hourglass-split' },
    ARQUIVO_VALIDADO:       { texto: 'Em análise',   classe: 'analise',   icone: 'bi-hourglass-split' },
    ACEITO:                 { texto: 'Aceito',       classe: 'aceito',    icone: 'bi-check-circle'    },
    EM_PRODUCAO:            { texto: 'Em produção',  classe: 'producao',  icone: 'bi-gear'            },
    CONCLUIDO:              { texto: 'Concluído',    classe: 'concluido', icone: 'bi-trophy'          },
    NEGADO:                 { texto: 'Negado',       classe: 'negado',    icone: 'bi-x-circle'        },
    CANCELADO:              { texto: 'Cancelado',    classe: 'bloqueado', icone: 'bi-slash-circle'    },
};
function getStatus(s) {
    return STATUS_CONFIG[s] || { texto: 'Aguardando', classe: 'analise', icone: 'bi-clock' };
}

/* ── BOTÕES POR STATUS (conforme especificação HU24) ── */
function getBotoes(p) {
    const id  = p.id;
    const pId = p.projeto_id;
    const s   = p.status;

    const Ver     = `<button class="btn-acao btn-ver"      onclick="verDetalhes(${id})"><i class="bi bi-eye"></i> Ver</button>`;
    const Chat    = `<button class="btn-acao btn-chat"     onclick="abrirChat(${id})"><i class="bi bi-chat"></i> Chat</button>`;
    const Editar  = `<button class="btn-acao btn-editar"   onclick="abrirEditar(${id})"><i class="bi bi-pencil"></i> Editar</button>`;
    const Excluir = `<button class="btn-acao btn-excluir"  onclick="excluirProjeto(${id})"><i class="bi bi-trash"></i> Excluir</button>`;
    const Avaliar = `<button class="btn-acao btn-feedback" onclick="abrirFeedback(${id})"><i class="bi bi-star"></i> Avaliar</button>`;

    const mapa = {
        AGUARDANDO_CONFIRMACAO: [Chat, Ver, Editar, Excluir],
        ARQUIVO_VALIDADO:       [Chat, Ver, Editar, Excluir],
        ACEITO:                 [Chat, Ver, Editar],
        EM_PRODUCAO:            [Ver],
        CONCLUIDO:              [Chat, Ver, Avaliar],
        NEGADO:                 [Chat, Ver, Editar, Excluir],
        CANCELADO:              [Chat, Ver, Editar, Excluir],
    };
    return (mapa[s] || [Ver]).join('');
}

/* ── CRIAR CARD ── */
function criarCard(p) {
    const cfg  = getStatus(p.status);
    const data = p.data_solicitacao
        ? new Date(p.data_solicitacao).toLocaleDateString('pt-BR') : '—';
    const urlCapa = montarUrlCapa(p.arquivo_caminho);

    const imgHTML = urlCapa
        ? `<img src="${urlCapa}" alt="${p.nome_projeto}" onerror="this.parentElement.classList.add('sem-capa');this.remove();">`
        : '';

    let extras = '';
    if (p.prazo_pedido) {
        const pr = new Date(p.prazo_pedido).toLocaleDateString('pt-BR');
        extras += `<div class="info-item"><i class="bi bi-calendar-check"></i> Prazo: <strong>${pr}</strong></div>`;
    }
    if (p.valor_total && parseFloat(p.valor_total) > 0) {
        const vl = parseFloat(p.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        extras += `<div class="info-item"><i class="bi bi-currency-dollar"></i> Valor: <strong>R$ ${vl}</strong></div>`;
    }
    if (p.maker_nome) {
        extras += `<div class="info-item"><i class="bi bi-person-gear"></i> Maker: <strong>${p.maker_nome}</strong></div>`;
    }
    extras += `<div class="info-item"><i class="bi bi-calendar3"></i> Enviado: <strong>${data}</strong></div>`;

    const feedbackHTML = p.motivo_recusa
        ? `<div class="feedback-maker"><i class="bi bi-chat-left-text me-1"></i><strong>Feedback do maker:</strong> ${p.motivo_recusa}</div>`
        : '';

    return `
        <div class="projeto-card" data-status="${p.status}">
            <div class="card-capa ${!urlCapa ? 'sem-capa' : ''}">
                ${imgHTML}
                <span class="badge-status st-${cfg.classe}">
                    <i class="bi ${cfg.icone}"></i> ${cfg.texto}
                </span>
            </div>
            <div class="card-conteudo">
                <h5 class="card-titulo">${p.nome_projeto}</h5>
                <p class="card-desc">${p.descricao ? p.descricao.substring(0,100) + (p.descricao.length > 100 ? '…' : '') : 'Sem descrição'}</p>
                <div class="card-infos">${extras}</div>
                ${feedbackHTML}
                <div class="card-acoes">${getBotoes(p)}</div>
            </div>
        </div>`;
}

/* ── CARREGAR PROJETOS ── */
let todosProjetos = [];
let modalDetalhes, modalEditar;

document.addEventListener('DOMContentLoaded', () => {
    modalDetalhes = new bootstrap.Modal(document.getElementById('modalProjeto'));
    modalEditar   = new bootstrap.Modal(document.getElementById('modalEditarProjeto'));

    carregarProjetos();

    document.getElementById('formEditarProjeto')
        ?.addEventListener('submit', salvarAlteracoesProjeto);
});

async function carregarProjetos() {
    const container = document.getElementById('cardsProjetos');
    container.innerHTML = `
        <div class="estado-loading">
            <div class="spinner-custom"></div>
            <p>Carregando seus projetos...</p>
        </div>`;

    try {
        const res     = await fetch('../app/controllers/usuario/php/meus_projetos_get.php');
        const retorno = await res.json();

        if (retorno.status === 'erro') throw new Error(retorno.mensagem);

        if (!retorno.projetos || retorno.projetos.length === 0) {
            container.innerHTML = `
                <div class="estado-vazio">
                    <i class="bi bi-folder2-open"></i>
                    <p>Você ainda não tem projetos.</p>
                    <a href="index.php?rota=listagem-maker" class="btn-novo-projeto">
                        <i class="bi bi-plus-circle me-1"></i> Solicitar Impressão
                    </a>
                </div>`;
            return;
        }

        todosProjetos = retorno.projetos;
        renderizarCards(todosProjetos);

    } catch (err) {
        console.error(err);
        container.innerHTML = `
            <div class="estado-vazio">
                <i class="bi bi-exclamation-triangle"></i>
                <p>Erro ao carregar: <strong>${err.message}</strong></p>
            </div>`;
    }
}

function renderizarCards(lista) {
    const container = document.getElementById('cardsProjetos');
    if (lista.length === 0) {
        container.innerHTML = `
            <div class="estado-vazio">
                <i class="bi bi-filter-circle"></i>
                <p>Nenhum projeto com esse status.</p>
            </div>`;
        return;
    }
    container.innerHTML = lista.map(criarCard).join('');
}

/* ── FILTROS ── */
function filtrarProjetos(status) {
    const filtrados = status === 'TODOS'
        ? todosProjetos
        : todosProjetos.filter(p => p.status === status);
    renderizarCards(filtrados);
}

/* ── DETALHES (HU24 - Critério 2) ── */
async function verDetalhes(pedidoId) {
    document.getElementById('conteudoModalProjeto').innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-3">Carregando detalhes...</p>
        </div>`;
    modalDetalhes.show();

    try {
        const res     = await fetch(`../app/controllers/usuario/php/obter_detalhes_projeto.php?id=${pedidoId}`);
        const retorno = await res.json();

        if (retorno.status !== 'sucesso') throw new Error(retorno.mensagem);

        const p       = retorno.projeto;
        const cfg     = getStatus(p.status_solicitacao);
        const urlCapa = montarUrlCapa(p.arquivo_caminho || p.imagem_capa);

        /* ── PARTES ── */
        const partesHTML = (p.partes && p.partes.length > 0)
            ? p.partes.map(pt => `
                <div class="detalhe-parte">
                    <div class="dp-header">
                        <span class="dp-nome"><i class="bi bi-layers me-1"></i>${pt.nome_parte || pt.nome}</span>
                        <span class="dp-mat">${pt.material}</span>
                    </div>
                    <div class="dp-body">
                        ${pt.descricao ? `<p>${pt.descricao}</p>` : ''}
                        <div class="dp-tags">
                            <span><i class="bi bi-palette"></i> ${pt.cor}</span>
                            <span><i class="bi bi-stack"></i> Qtd: ${pt.quantidade || pt.infill || 1}</span>
                        </div>
                    </div>
                </div>`).join('')
            : '<p class="text-muted small">Nenhuma parte personalizada cadastrada.</p>';

        /* ── HISTÓRICO REAL ── */
        const historicoHTML = (p.historico_real && p.historico_real.length > 0)
            ? `<div class="timeline-real">
                ${p.historico_real.map((h, i) => {
                    const cfg2 = getStatus(h.status_novo);
                    const dt   = new Date(h.data_hora).toLocaleString('pt-BR');
                    return `
                        <div class="tr-item ${i === p.historico_real.length - 1 ? 'tr-atual' : 'tr-ok'}">
                            <div class="tr-icon st-${cfg2.classe}"><i class="bi ${cfg2.icone}"></i></div>
                            <div class="tr-content">
                                <span class="tr-label">${cfg2.texto}</span>
                                <span class="tr-data">${dt}</span>
                                ${h.mensagem_publica ? `<p class="tr-msg">${h.mensagem_publica}</p>` : ''}
                            </div>
                        </div>`;
                }).join('')}
               </div>`
            : '<p class="text-muted small">Nenhum histórico registrado ainda.</p>';

        /* ── TIMELINE VISUAL DE ETAPAS ── */
        const etapas = [
            { chave: 'AGUARDANDO_CONFIRMACAO', label: 'Pedido enviado'     },
            { chave: 'ACEITO',                 label: 'Pedido aceito'      },
            { chave: 'EM_PRODUCAO',            label: 'Em produção'        },
            { chave: 'CONCLUIDO',              label: 'Concluído'          },
        ];
        const idxAtual  = etapas.findIndex(e => e.chave === p.status_solicitacao);
        const progresso = p.status_solicitacao === 'NEGADO' || p.status_solicitacao === 'CANCELADO'
            ? 0
            : Math.max(0, Math.round(((idxAtual + 1) / etapas.length) * 100));

        const timelineHTML = (p.status_solicitacao === 'NEGADO' || p.status_solicitacao === 'CANCELADO')
            ? `<div class="alert alert-danger d-flex align-items-center gap-2">
                <i class="bi bi-x-octagon fs-4"></i>
                <div><strong>Pedido ${cfg.texto}</strong>${p.feedback_maker ? `<br><small>${p.feedback_maker}</small>` : ''}</div>
               </div>`
            : `<div class="mb-2 d-flex justify-content-between align-items-center">
                   <small class="fw-bold" style="color:var(--printly-primary)">Progresso</small>
                   <small>${progresso}%</small>
               </div>
               <div class="progress mb-3" style="height:8px;border-radius:999px;">
                   <div class="progress-bar" style="width:${progresso}%;background:linear-gradient(90deg,#412746,#7a3077);border-radius:999px;"></div>
               </div>
               <div class="etapas-visuais">
                   ${etapas.map((e, i) => `
                       <div class="etapa-item ${i < idxAtual ? 'etapa-ok' : i === idxAtual ? 'etapa-atual' : ''}">
                           <div class="etapa-circulo"><i class="bi ${i <= idxAtual ? 'bi-check-lg' : 'bi-circle'}"></i></div>
                           <span>${e.label}</span>
                       </div>`).join('')}
               </div>`;

        /* ── RENDER FINAL ── */
        document.getElementById('conteudoModalProjeto').innerHTML = `
            <style>
                .detalhe-parte{border:1px solid #e5d9f2;border-radius:10px;overflow:hidden;margin-bottom:10px}
                .dp-header{display:flex;justify-content:space-between;align-items:center;padding:8px 14px;background:#f3e8ff}
                .dp-nome{font-weight:700;font-size:.88rem;color:#412746}
                .dp-mat{font-size:.78rem;background:#412746;color:#fff;padding:2px 10px;border-radius:20px}
                .dp-body{padding:10px 14px;font-size:.83rem;color:#6b7280}
                .dp-tags{display:flex;gap:12px;margin-top:6px;font-size:.8rem;color:#6b3fa0}
                .dp-tags span{display:flex;align-items:center;gap:4px}
                .timeline-real{display:flex;flex-direction:column;gap:0}
                .tr-item{display:flex;gap:14px;align-items:flex-start;padding:12px 0;border-left:2px solid #e5d9f2;margin-left:14px;padding-left:20px;position:relative}
                .tr-item:last-child{border-left-color:transparent}
                .tr-icon{position:absolute;left:-14px;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;color:#fff;flex-shrink:0}
                .tr-item.tr-ok .tr-icon{background:#10b981}
                .tr-item.tr-atual .tr-icon{background:#3b82f6}
                .tr-item:not(.tr-ok):not(.tr-atual) .tr-icon{background:#d1d5db}
                .tr-content{display:flex;flex-direction:column;gap:2px}
                .tr-label{font-weight:700;font-size:.88rem;color:#412746}
                .tr-data{font-size:.75rem;color:#9e939e}
                .tr-msg{font-size:.82rem;color:#6b7280;margin:4px 0 0;background:#f9f0ff;padding:6px 10px;border-radius:8px}
                .etapas-visuais{display:flex;justify-content:space-between;gap:4px;margin-top:4px}
                .etapa-item{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;text-align:center;font-size:.72rem;color:#9e939e}
                .etapa-circulo{width:32px;height:32px;border-radius:50%;border:2px solid #e5d9f2;display:flex;align-items:center;justify-content:center;font-size:.8rem}
                .etapa-item.etapa-ok .etapa-circulo{background:#10b981;border-color:#10b981;color:#fff}
                .etapa-item.etapa-atual .etapa-circulo{background:#3b82f6;border-color:#3b82f6;color:#fff}
                .etapa-item.etapa-ok span,.etapa-item.etapa-atual span{color:#412746;font-weight:600}
                .secao-detalhe{margin-bottom:1.5rem}
                .secao-detalhe h6{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#a66dd4;margin-bottom:.75rem;padding-bottom:.4rem;border-bottom:1px solid #e5d9f2}
                .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
                .info-grid-item{display:flex;flex-direction:column;gap:2px}
                .ig-label{font-size:.72rem;color:#9e939e;text-transform:uppercase;letter-spacing:.05em}
                .ig-valor{font-size:.88rem;font-weight:600;color:#412746}
                @media(max-width:576px){.info-grid{grid-template-columns:1fr}.etapas-visuais{flex-wrap:wrap}}
            </style>

            <div class="row g-4">
                <!-- COLUNA ESQUERDA -->
                <div class="col-md-5">
                    <div class="secao-detalhe">
                        <div style="height:200px;background:#f3e8ff;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
                            ${urlCapa
                                ? `<img src="${urlCapa}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<i class=\'bi bi-box\' style=\'font-size:3rem;color:#a66dd4;opacity:.4\'></i>'">`
                                : `<i class="bi bi-box" style="font-size:3rem;color:#a66dd4;opacity:.4"></i>`}
                        </div>
                    </div>

                    <div class="secao-detalhe">
                        <h6><i class="bi bi-info-circle me-1"></i>Informações</h6>
                        <div class="info-grid">
                            <div class="info-grid-item"><span class="ig-label">Formato</span><span class="ig-valor">${p.formato || '—'}</span></div>
                            <div class="info-grid-item"><span class="ig-label">Quantidade</span><span class="ig-valor">${p.quantidade || '—'}</span></div>
                            ${p.volume_estimado_cm3 ? `<div class="info-grid-item"><span class="ig-label">Volume</span><span class="ig-valor">${parseFloat(p.volume_estimado_cm3).toFixed(1)} cm³</span></div>` : ''}
                            ${p.peso_estimado_gramas ? `<div class="info-grid-item"><span class="ig-label">Peso est.</span><span class="ig-valor">${parseFloat(p.peso_estimado_gramas).toFixed(1)} g</span></div>` : ''}
                        </div>
                    </div>

                    ${p.arquivo_caminho ? `
                    <a href="${BASE_URL}${p.arquivo_caminho}" download class="btn btn-outline-secondary btn-sm w-100">
                        <i class="bi bi-download me-1"></i>Baixar Arquivo 3D
                    </a>` : ''}
                </div>

                <!-- COLUNA DIREITA -->
                <div class="col-md-7">
                    <div class="secao-detalhe">
                        <h6><i class="bi bi-file-text me-1"></i>Descrição</h6>
                        <p style="font-size:.88rem;color:#6b7280;line-height:1.6">${p.descricao || 'Sem descrição.'}</p>
                    </div>

                    <div class="secao-detalhe">
                        <h6><i class="bi bi-activity me-1"></i>Acompanhamento</h6>
                        ${timelineHTML}
                    </div>

                    <div class="secao-detalhe">
                        <h6><i class="bi bi-clock-history me-1"></i>Histórico de Atualizações</h6>
                        ${historicoHTML}
                    </div>

                    <div class="secao-detalhe">
                        <h6><i class="bi bi-layers me-1"></i>Partes Personalizadas</h6>
                        ${partesHTML}
                    </div>
                </div>
            </div>`;

    } catch (err) {
        document.getElementById('conteudoModalProjeto').innerHTML =
            `<div class="alert alert-danger">${err.message}</div>`;
    }
}

/* ── EDITAR ── */
function abrirEditar(pedidoId) {
    const p = todosProjetos.find(x => x.id == pedidoId);
    if (!p) return;

    // Bloquear edição se em produção
    if (p.status === 'EM_PRODUCAO' || p.status === 'CONCLUIDO') {
        alert('Este projeto está em produção e não pode ser editado.');
        return;
    }

    document.getElementById('editar_id').value        = p.id;
    document.getElementById('editar_nome').value      = p.nome_projeto;
    document.getElementById('editar_descricao').value = p.descricao || '';
    document.getElementById('editar_formato').value   = p.formato || 'STL';
    document.getElementById('editar_quantidade').value = p.quantidade || 1;
    document.getElementById('editarMensagem').innerHTML = '';
    document.getElementById('containerPartesProjeto').innerHTML = '';

    modalEditar.show();

    // Carrega partes existentes
    fetch(`../app/controllers/usuario/php/obter_detalhes_projeto.php?id=${pedidoId}`)
        .then(r => r.json())
        .then(d => {
            if (d.projeto?.partes) {
                d.projeto.partes.forEach(pt => adicionarParteProjeto(
                    pt.nome_parte || pt.nome, pt.cor, pt.material, pt.quantidade || pt.infill || 1
                ));
            }
        });
}

function adicionarParteProjeto(nome = '', cor = '', material = 'PLA', qtd = 1) {
    const container = document.getElementById('containerPartesProjeto');
    const idx = container.children.length;
    const div = document.createElement('div');
    div.className = 'parte-card-dinamico';
    div.innerHTML = `
        <div class="pcd-header">
            <span>Parte ${idx + 1}</span>
            <button type="button" onclick="this.closest('.parte-card-dinamico').remove()">
                <i class="bi bi-trash"></i>
            </button>
        </div>
        <div class="pcd-body row g-2">
            <div class="col-md-4">
                <label class="form-label">Nome</label>
                <input type="text" class="form-control form-control-sm" name="partes_nomes[]" value="${nome}" placeholder="Ex: Cabeça">
            </div>
            <div class="col-md-3">
                <label class="form-label">Material</label>
                <select class="form-select form-select-sm" name="partes_materiais[]">
                    ${['PLA','ABS','PETG','Nylon','Flexível'].map(m =>
                        `<option value="${m}" ${m===material?'selected':''}>${m}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label">Cor</label>
                <input type="text" class="form-control form-control-sm" name="partes_cores[]" value="${cor}" placeholder="Ex: Preto">
            </div>
            <div class="col-md-2">
                <label class="form-label">Qtd</label>
                <input type="number" class="form-control form-control-sm" name="partes_quantidades[]" value="${qtd}" min="1">
            </div>
        </div>`;
    container.appendChild(div);
}

async function salvarAlteracoesProjeto(e) {
    e.preventDefault();
    const form = document.getElementById('formEditarProjeto');
    const fd   = new FormData(form);
    fd.set('editar_id',       document.getElementById('editar_id').value);
    fd.set('editar_nome',     document.getElementById('editar_nome').value);
    fd.set('editar_descricao',document.getElementById('editar_descricao').value);

    try {
        const res     = await fetch('../app/controllers/usuario/php/editar_projeto.php', { method:'POST', body:fd });
        const retorno = await res.json();
        if (retorno.status === 'sucesso') {
            document.getElementById('editarMensagem').innerHTML =
                `<div class="alert alert-success mt-3">${retorno.mensagem}</div>`;
            setTimeout(() => { modalEditar.hide(); carregarProjetos(); }, 1200);
        } else {
            document.getElementById('editarMensagem').innerHTML =
                `<div class="alert alert-danger mt-3">${retorno.mensagem}</div>`;
        }
    } catch (err) {
        document.getElementById('editarMensagem').innerHTML =
            `<div class="alert alert-danger mt-3">Erro de conexão.</div>`;
    }
}

/* ── EXCLUIR ── */
async function excluirProjeto(pedidoId) {
    if (!confirm('Deseja excluir este projeto? Essa ação não pode ser desfeita.')) return;
    try {
        const res     = await fetch('../app/controllers/usuario/php/excluir_projeto.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: pedidoId })
        });
        const retorno = await res.json();
        if (retorno.status !== 'sucesso') throw new Error(retorno.mensagem);
        todosProjetos = todosProjetos.filter(p => p.id != pedidoId);
        renderizarCards(todosProjetos);
    } catch (err) {
        alert('Erro ao excluir: ' + err.message);
    }
}

/* ── AÇÕES ── */
function abrirChat(pedidoId)    { window.location.href = `index.php?rota=chat&pedido_id=${pedidoId}`; }
function abrirFeedback(pedidoId){ window.location.href = `index.php?rota=feedback&pedido_id=${pedidoId}`; }