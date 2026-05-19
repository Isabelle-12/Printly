let todosPedidos  = [];
let filtroAtual   = 'TODOS';
let pedidoAtualId = null;

const STATUS_LABEL = {
    AGUARDANDO_CONFIRMACAO: 'Aguardando',
    ACEITO:    'Aceito',
    EM_PRODUCAO: 'Em Produção',
    CONCLUIDO: 'Concluído',
    ENTREGUE:  'Entregue',
    CANCELADO: 'Cancelado',
    NEGADO:    'Negado'
};

const STATUS_CLASS = {
    AGUARDANDO_CONFIRMACAO: 'st-aguardando',
    ACEITO:    'st-aceito',
    EM_PRODUCAO: 'st-producao',
    CONCLUIDO: 'st-concluido',
    ENTREGUE:  'st-entregue',
    CANCELADO: 'st-cancelado',
    NEGADO:    'st-negado'
};

// ── Filtros ──────────────────────────────────────────────────────────────────
document.querySelectorAll('.btn-filtro').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelector('.btn-filtro.ativo')?.classList.remove('ativo');
        this.classList.add('ativo');
        filtroAtual = this.dataset.status;
        renderCards();
    });
});

// ── Carrega todos os pedidos do fabricante ───────────────────────────────────
async function carregarPedidos() {
    const container = document.getElementById('cardsGerenciar');
    container.innerHTML = `<div class="estado-loading"><div class="spinner-custom"></div><span>Carregando pedidos...</span></div>`;

    try {
        const resp  = await fetch('../app/controllers/fabricante/php/listar_todos_pedidos.php');
        const dados = await resp.json();

        if (dados.status === 'nok') {
            container.innerHTML = `<div class="estado-vazio"><i class="bi bi-exclamation-circle"></i><span>${dados.mensagem}</span></div>`;
            return;
        }

        todosPedidos = dados.data || [];
        renderCards();

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="estado-vazio"><i class="bi bi-wifi-off"></i><span>Erro de conexão ao carregar os pedidos.</span></div>`;
    }
}

// ── Renderiza os cards de acordo com o filtro ────────────────────────────────
function renderCards() {
    const container = document.getElementById('cardsGerenciar');
    const lista = filtroAtual === 'TODOS'
        ? todosPedidos
        : todosPedidos.filter(p => p.status === filtroAtual);

    if (lista.length === 0) {
        container.innerHTML = `
            <div class="estado-vazio">
                <i class="bi bi-inbox"></i>
                <span>Nenhum pedido encontrado para este filtro.</span>
            </div>`;
        return;
    }

    container.innerHTML = lista.map(pedido => {
        const valor    = parseFloat(pedido.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const data     = new Date(pedido.data_solicitacao).toLocaleDateString('pt-BR');
        const stLabel  = STATUS_LABEL[pedido.status] || pedido.status;
        const stClass  = STATUS_CLASS[pedido.status] || '';

        return `
        <div class="projeto-card">
            <div class="card-topo">
                <span class="card-id">Pedido #${pedido.id}</span>
                <span class="badge-status ${stClass}">${stLabel}</span>
            </div>
            <div class="card-conteudo">
                <div class="card-titulo">${pedido.nome_projeto}</div>
                <div class="info-item"><i class="bi bi-person"></i><span><strong>Cliente:</strong> ${pedido.cliente_nome}</span></div>
                <div class="info-item"><i class="bi bi-palette"></i><span><strong>Material:</strong> ${pedido.material_escolhido || '—'}</span></div>
                <div class="info-item"><i class="bi bi-currency-dollar"></i><span><strong>Valor:</strong> ${valor}</span></div>
                <div class="info-item"><i class="bi bi-calendar3"></i><span><strong>Solicitado em:</strong> ${data}</span></div>
            </div>
            <div class="card-acoes">
                <button class="btn-acao btn-ver" onclick="abrirModal(${pedido.id})">
                    <i class="bi bi-eye"></i> Ver / Atualizar
                </button>
            </div>
        </div>`;
    }).join('');
}

// ── Abre o modal com detalhes e histórico ────────────────────────────────────
async function abrirModal(id) {
    pedidoAtualId = id;

    const pedido = todosPedidos.find(p => p.id == id);
    if (!pedido) return;

    // Preenche campos básicos
    document.getElementById('mg-id').textContent          = `#${pedido.id}`;
    document.getElementById('mg-nome-projeto').textContent = pedido.nome_projeto;
    document.getElementById('mg-cliente').textContent      = pedido.cliente_nome;
    document.getElementById('mg-cliente-email').textContent = pedido.cliente_email || '';
    document.getElementById('mg-material').textContent     = pedido.material_escolhido || '—';
    document.getElementById('mg-qtd').textContent          = pedido.quantidade || '1';
    document.getElementById('mg-valor').textContent        = parseFloat(pedido.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('mg-endereco').textContent     = pedido.endereco_entrega || '—';
    document.getElementById('mg-observacao').value         = '';

    // Prazo
    const prazoEl = document.getElementById('mg-prazo');
    if (pedido.prazo_pedido) {
        const d = new Date(pedido.prazo_pedido);
        prazoEl.textContent = d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else {
        prazoEl.textContent = 'Não definido';
    }

    // Seleciona o status atual no select
    document.getElementById('mg-novo-status').value = pedido.status;

    // Carrega histórico
    carregarHistorico(id);

    new bootstrap.Modal(document.getElementById('modalGerenciar')).show();
}

// ── Carrega histórico de status do pedido ────────────────────────────────────
async function carregarHistorico(id) {
    const el = document.getElementById('mg-historico');
    el.innerHTML = '<p class="text-muted" style="font-size:.85rem">Carregando...</p>';

    try {
        const resp  = await fetch(`../app/controllers/fabricante/php/historico_pedido.php?id=${id}`);
        const dados = await resp.json();

        if (!dados.data || dados.data.length === 0) {
            el.innerHTML = '<p class="text-muted" style="font-size:.85rem">Nenhuma atualização registrada ainda.</p>';
            return;
        }

        el.innerHTML = dados.data.map(h => {
            const anterior = h.status_anterior ? `${STATUS_LABEL[h.status_anterior] || h.status_anterior} → ` : '';
            const novo     = STATUS_LABEL[h.status_novo] || h.status_novo;
            const data     = new Date(h.data_hora).toLocaleString('pt-BR');
            const obs      = h.observacao ? `<br><span style="color:var(--pm)">${h.observacao}</span>` : '';
            return `
            <div class="historico-item">
                <div class="hist-dot"></div>
                <div>
                    <div class="hist-info">${anterior}<strong>${novo}</strong>${obs}</div>
                    <div class="hist-data">${data}</div>
                </div>
            </div>`;
        }).join('');

    } catch (e) {
        el.innerHTML = '<p class="text-muted" style="font-size:.85rem">Erro ao carregar histórico.</p>';
    }
}

// ── Salva o novo status ──────────────────────────────────────────────────────
async function salvarStatus() {
    const novoStatus  = document.getElementById('mg-novo-status').value;
    const observacao  = document.getElementById('mg-observacao').value.trim();
    const btnSalvar   = document.getElementById('btn-salvar-status');

    if (!pedidoAtualId || !novoStatus) return;

    btnSalvar.disabled = true;
    btnSalvar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Salvando...';

    try {
        const resp  = await fetch('../app/controllers/fabricante/php/atualizar_status_pedido.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: pedidoAtualId, status: novoStatus, observacao })
        });
        const dados = await resp.json();

        if (dados.status === 'ok') {
            // Atualiza o pedido localmente
            const idx = todosPedidos.findIndex(p => p.id == pedidoAtualId);
            if (idx >= 0) todosPedidos[idx].status = novoStatus;

            bootstrap.Modal.getInstance(document.getElementById('modalGerenciar')).hide();
            renderCards();
            mostrarToast('Status atualizado com sucesso!', false);
        } else {
            mostrarToast(dados.mensagem || 'Erro ao atualizar.', true);
        }

    } catch (e) {
        mostrarToast('Erro de conexão.', true);
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar Status';
    }
}

// ── Toast de feedback ────────────────────────────────────────────────────────
function mostrarToast(msg, erro = false) {
    const toast = document.getElementById('toastGerenciar');
    const icon  = document.getElementById('toast-icon');
    document.getElementById('toast-msg').textContent = msg;
    toast.classList.toggle('erro', erro);
    icon.className = erro ? 'bi bi-x-circle-fill' : 'bi bi-check-circle-fill';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', carregarPedidos);