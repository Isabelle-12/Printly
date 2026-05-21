document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const pedidoId = params.get('pedido_id');
    if (!pedidoId) return;

    inicializarValidacao(pedidoId);
});

let pedidoValidacaoId = null;

async function inicializarValidacao(pedidoId) {
    pedidoValidacaoId = pedidoId;

    try {
        const res = await fetch(`../app/controllers/fabricante/php/buscar_dados_validacao.php?pedido_id=${pedidoId}`);
        const data = await res.json();

        if (data.status !== 'ok') {
            mostrarErroValidacao(data.mensagem);
            return;
        }

        const dados = data.data;
        renderizarCardValidacao(dados);

        carregarArquivoDoPedido(dados.pedido.arquivo_caminho, dados.pedido.formato);

    } catch (err) {
        mostrarErroValidacao('Erro ao carregar dados do pedido.');
    }
}

function mostrarErroValidacao(msg) {
    const container = document.getElementById('cardValidacaoContainer');
    if (container) {
        container.innerHTML = `<div class="alert alert-danger">${escapeVal(msg)}</div>`;
    }
}

function renderizarCardValidacao(dados) {
    const container = document.getElementById('cardValidacaoContainer');
    if (!container) return;

    const { pedido, impressoras, volume_maximo, volume_projeto, incompatibilidade, ajuste_pendente, ja_validado } = dados;

    const alertaIncompat = incompatibilidade
        ? `<div class="alert alert-warning d-flex align-items-start gap-2 mt-2">
               <i class="bi bi-exclamation-triangle-fill fs-5"></i>
               <div>
                   <strong>Incompatibilidade técnica detectada</strong><br>
                   O volume do projeto (<strong>${volume_projeto} cm³</strong>) excede a capacidade máxima das suas impressoras (<strong>${volume_maximo} cm³</strong>). Recomenda-se recusar o pedido ou solicitar redimensionamento ao cliente.
               </div>
           </div>`
        : '';

    const statusBadge = ja_validado
        ? `<span class="badge bg-success ms-2"><i class="bi bi-check-circle"></i> Arquivo Validado</span>`
        : (ajuste_pendente
            ? `<span class="badge bg-warning text-dark ms-2"><i class="bi bi-pencil-square"></i> Ajustes Solicitados</span>`
            : `<span class="badge bg-secondary ms-2"><i class="bi bi-hourglass"></i> Aguardando Análise</span>`);

    const ajusteBox = ajuste_pendente
        ? `<div class="alert alert-info mt-2">
               <strong><i class="bi bi-info-circle"></i> Última solicitação de ajuste</strong><br>
               <small class="text-muted">${formatarDataVal(ajuste_pendente.data_hora)}</small>
               <p class="mb-0 mt-1">${escapeVal(ajuste_pendente.observacao)}</p>
           </div>`
        : '';

    const acoes = ja_validado
        ? `<p class="text-muted mb-0"><i class="bi bi-check-circle text-success"></i> Este arquivo já foi validado por você. Aguardando aceite final do pedido.</p>`
        : `<div class="d-flex gap-2 flex-wrap">
               <button class="btn btn-success" id="btnValidarArquivo">
                   <i class="bi bi-check-lg"></i> Validar Arquivo
               </button>
               <button class="btn btn-outline-warning" id="btnSolicitarAjustes">
                   <i class="bi bi-pencil-square"></i> Solicitar Ajustes
               </button>
           </div>
           <div id="formAjustes" style="display:none;" class="mt-3">
               <label class="form-label fw-bold">Descreva o problema técnico:</label>
               <textarea id="descricaoAjuste" class="form-control" rows="3" placeholder="Ex: malhas abertas, paredes muito finas, geometria não-manifold..."></textarea>
               <div class="d-flex gap-2 mt-2">
                   <button class="btn btn-warning" id="btnConfirmarAjuste">
                       <i class="bi bi-send"></i> Enviar solicitação
                   </button>
                   <button class="btn btn-link" id="btnCancelarAjuste">Cancelar</button>
               </div>
           </div>
           <div id="msgValidacao" class="mt-2"></div>`;

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-icon"><i class="bi bi-shield-check"></i></div>
                <h5>Validação Técnica do Pedido #${pedido.id} ${statusBadge}</h5>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6"><strong>Projeto:</strong> ${escapeVal(pedido.nome_projeto)}</div>
                    <div class="col-md-6"><strong>Cliente:</strong> ${escapeVal(pedido.cliente_nome)}</div>
                    <div class="col-md-6"><strong>Material:</strong> ${escapeVal(pedido.material_escolhido)}</div>
                    <div class="col-md-6"><strong>Volume estimado:</strong> ${volume_projeto} cm³</div>
                </div>
                ${alertaIncompat}
                ${ajusteBox}
                <hr>
                ${acoes}
            </div>
        </div>
    `;

    if (!ja_validado) {
        document.getElementById('btnValidarArquivo').addEventListener('click', validarArquivo);
        document.getElementById('btnSolicitarAjustes').addEventListener('click', () => {
            document.getElementById('formAjustes').style.display = 'block';
        });
        document.getElementById('btnCancelarAjuste').addEventListener('click', () => {
            document.getElementById('formAjustes').style.display = 'none';
            document.getElementById('descricaoAjuste').value = '';
        });
        document.getElementById('btnConfirmarAjuste').addEventListener('click', enviarSolicitacaoAjuste);
    }
}

async function validarArquivo() {
    if (!confirm('Confirmar validação? O cliente será notificado de que o arquivo é viável para impressão.')) return;

    const msgBox = document.getElementById('msgValidacao');
    const btn = document.getElementById('btnValidarArquivo');
    btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('pedido_id', pedidoValidacaoId);

        const res = await fetch('../app/controllers/fabricante/php/validar_arquivo.php', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.status === 'ok') {
            msgBox.innerHTML = `<div class="alert alert-success">${data.mensagem}</div>`;
            setTimeout(() => inicializarValidacao(pedidoValidacaoId), 1500);
        } else {
            msgBox.innerHTML = `<div class="alert alert-danger">${data.mensagem}</div>`;
            btn.disabled = false;
        }
    } catch (err) {
        msgBox.innerHTML = `<div class="alert alert-danger">Erro ao validar. Tente novamente.</div>`;
        btn.disabled = false;
    }
}

async function enviarSolicitacaoAjuste() {
    const descricao = document.getElementById('descricaoAjuste').value.trim();
    const msgBox = document.getElementById('msgValidacao');

    if (descricao === '') {
        msgBox.innerHTML = `<div class="alert alert-warning">Descreva o problema técnico antes de enviar.</div>`;
        return;
    }

    const btn = document.getElementById('btnConfirmarAjuste');
    btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('pedido_id', pedidoValidacaoId);
        formData.append('descricao', descricao);

        const res = await fetch('../app/controllers/fabricante/php/solicitar_ajustes.php', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.status === 'ok') {
            msgBox.innerHTML = `<div class="alert alert-success">${data.mensagem}</div>`;
            setTimeout(() => inicializarValidacao(pedidoValidacaoId), 1500);
        } else {
            msgBox.innerHTML = `<div class="alert alert-danger">${data.mensagem}</div>`;
            btn.disabled = false;
        }
    } catch (err) {
        msgBox.innerHTML = `<div class="alert alert-danger">Erro ao enviar. Tente novamente.</div>`;
        btn.disabled = false;
    }
}

async function carregarArquivoDoPedido(caminho, formato) {
    if (!caminho) return;

    const url = '/Printly/' + caminho;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Arquivo não encontrado');

        const blob = await res.blob();
        const nomeArquivo = caminho.split('/').pop();
        const arquivo = new File([blob], nomeArquivo, { type: blob.type });

        if (typeof processarArquivo === 'function') {
            processarArquivo(arquivo);
        }
    } catch (err) {
        console.warn('Não foi possível carregar o arquivo do pedido automaticamente:', err);
    }
}

function escapeVal(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function formatarDataVal(str) {
    return new Date(str).toLocaleString('pt-BR');
}