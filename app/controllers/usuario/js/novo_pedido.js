document.addEventListener('DOMContentLoaded', () => {
    carregarDadosMaker();
    configurarUpload();
    configurarFormulario();
});

let contadorPartes = 0;
let materiaisMaker = [];

/* ── CARREGAR MAKER ── */

async function carregarDadosMaker() {
    const params  = new URLSearchParams(window.location.search);
    const makerId = params.get('maker_id');

    if (!makerId) {
        alert('Fabricante não encontrado.');
        window.location.href = 'index.php?rota=listagem-maker';
        return;
    }

    document.getElementById('maker_id').value = makerId;

    try {
        const res  = await fetch(`../app/controllers/fabricante/php/detalhes_portfolio_get.php?id=${makerId}`);
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { console.error(text); throw new Error('Resposta inválida do servidor'); }
        if (!data.sucesso) throw new Error(data.mensagem);
        preencherMaker(data);
    } catch (err) {
        console.error(err);
        mostrarAlerta('Erro ao carregar dados do fabricante: ' + err.message, 'danger');
    }
}

function preencherMaker(data) {
    const maker = data.maker;
    materiaisMaker = data.materiais || [];

    document.getElementById('makerNome').textContent    = maker.nome_empresa || maker.nome || 'Maker';
    document.getElementById('makerCidade').textContent  = `${maker.cidade || '—'}${maker.estado ? ' - ' + maker.estado : ''}`;
    document.getElementById('makerAvaliacoes').innerHTML = gerarEstrelas(maker.media_nota);

    const foto = document.getElementById('makerFoto');
    foto.src = maker.foto_perfil
        ? maker.foto_perfil
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(maker.nome || 'Maker')}&background=6b3fa0&color=fff&size=128`;

    const container = document.getElementById('makerMateriais');
    container.innerHTML = '';

    if (materiaisMaker.length === 0) {
        container.innerHTML = `<span class="badge-material">Nenhum material cadastrado</span>`;
    } else {
        materiaisMaker.forEach(m => {
            container.innerHTML += `
                <div class="material-item">
                    <span class="material-nome">${m.tipo_material}</span>
                    <span class="material-preco">R$ ${parseFloat(m.preco_por_grama).toFixed(2)}<small>/g</small></span>
                </div>`;
        });
    }

    configurarPartes();
    atualizarResumo();
}

function gerarEstrelas(nota) {
    const n = parseFloat(nota) || 0;
    return Array.from({ length: 5 }, (_, i) => {
        if (i < Math.floor(n)) return '<span class="estrela cheia">★</span>';
        if (i < n)             return '<span class="estrela meia">★</span>';
        return '<span class="estrela vazia">☆</span>';
    }).join('');
}

/* ── UPLOAD ── */

function configurarUpload() {
    const input     = document.getElementById('arquivo_3d');
    const dropzone  = document.getElementById('dropzone');
    const listaEl   = document.getElementById('listaArquivos');

    // Drag & drop
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', ()  => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        input.files = e.dataTransfer.files;
        processarArquivo(input.files[0]);
    });

    input.addEventListener('change', () => {
        if (input.files[0]) processarArquivo(input.files[0]);
    });

    function processarArquivo(arquivo) {
        if (!arquivo) return;
        const ext = arquivo.name.split('.').pop().toLowerCase();

        if (!['stl', 'obj'].includes(ext)) {
            mostrarAlerta('Formato inválido. Use STL ou OBJ para o arquivo 3D.', 'danger');
            input.value = '';
            listaEl.innerHTML = '';
            return;
        }

        const tamanhoMB = (arquivo.size / 1024 / 1024).toFixed(1);
        listaEl.innerHTML = `
            <div class="arquivo-item">
                <div class="arquivo-info">
                    <i class="bi bi-file-earmark-code arquivo-icone"></i>
                    <div>
                        <span class="arquivo-nome">${arquivo.name}</span>
                        <span class="arquivo-tamanho">${tamanhoMB} MB</span>
                    </div>
                </div>
                <button type="button" class="btn-remover-arquivo" onclick="removerArquivo()">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>`;

        dropzone.querySelector('.dropzone-texto p').textContent = 'Arquivo selecionado ✓';
    }
}

window.removerArquivo = function () {
    document.getElementById('arquivo_3d').value = '';
    document.getElementById('listaArquivos').innerHTML = '';
    document.querySelector('.dropzone-texto p').textContent = 'Arraste o arquivo ou clique para selecionar';
};

/* ── PARTES ── */

function configurarPartes() {
    document.getElementById('btnAdicionarParte').addEventListener('click', adicionarParte);
    adicionarParte(); // já começa com 1 parte
}

function adicionarParte() {
    contadorPartes++;

    const template = document.getElementById('templateParte');
    const clone    = template.content.cloneNode(true);
    const card     = clone.querySelector('.parte-card');

    card.dataset.index = contadorPartes;
    card.querySelector('h5').textContent = `Parte ${contadorPartes}`;

    // Número da parte no badge
    const badge = card.querySelector('.parte-numero');
    if (badge) badge.textContent = contadorPartes;

    const select = card.querySelector('.material-parte');
    select.innerHTML = '';

    if (materiaisMaker.length > 0) {
        materiaisMaker.forEach(m => {
            select.innerHTML += `<option value="${m.tipo_material}">${m.tipo_material} — R$ ${parseFloat(m.preco_por_grama).toFixed(2)}/g</option>`;
        });
    } else {
        select.innerHTML = `<option value="">Nenhum material disponível</option>`;
    }

    configurarRemocaoParte(card);
    configurarAtualizacaoResumo(card);

    document.getElementById('containerPartes').appendChild(clone);

    // Animação de entrada
    requestAnimationFrame(() => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(12px)';
        requestAnimationFrame(() => {
            card.style.transition = 'opacity .25s ease, transform .25s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    });

    atualizarResumo();
}

function configurarRemocaoParte(card) {
    card.querySelector('.btn-remover-parte').addEventListener('click', () => {
        card.style.transition = 'opacity .2s, transform .2s';
        card.style.opacity    = '0';
        card.style.transform  = 'translateY(-8px)';
        setTimeout(() => { card.remove(); atualizarResumo(); renumerarPartes(); }, 200);
    });
}

function configurarAtualizacaoResumo(card) {
    card.querySelectorAll('input, select').forEach(c => c.addEventListener('input', atualizarResumo));
}

function renumerarPartes() {
    document.querySelectorAll('.parte-card').forEach((card, i) => {
        card.querySelector('h5').textContent = `Parte ${i + 1}`;
        const badge = card.querySelector('.parte-numero');
        if (badge) badge.textContent = i + 1;
    });
}

/* ── RESUMO ── */

function atualizarResumo() {
    const partes = document.querySelectorAll('.parte-card');
    let qtdTotal = 0;
    partes.forEach(p => { qtdTotal += parseInt(p.querySelector('.quantidade-parte').value) || 0; });

    document.getElementById('resumoPartes').textContent    = partes.length;
    document.getElementById('resumoQuantidade').textContent = qtdTotal;

    // Atualiza contador no botão de partes
    const btnAdd = document.getElementById('btnAdicionarParte');
    if (partes.length > 0) {
        btnAdd.innerHTML = `<i class="bi bi-plus-circle me-1"></i> Adicionar Parte <span class="badge bg-light text-dark ms-1">${partes.length}</span>`;
    } else {
        btnAdd.innerHTML = `<i class="bi bi-plus-circle me-1"></i> Adicionar Parte`;
    }
}

/* ── FORMULÁRIO ── */

function configurarFormulario() {
    document.getElementById('formPedido').addEventListener('submit', enviarFormulario);
}

async function enviarFormulario(e) {
    e.preventDefault();
    if (!validarFormulario()) return;

    const botao = document.getElementById('btnEnviarPedido');
    const textoOriginal = botao.innerHTML;
    botao.disabled  = true;
    botao.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Enviando...`;

    try {
        const res  = await fetch('../app/controllers/usuario/php/criar_pedido_post.php', { method: 'POST', body: montarFormData() });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { console.error(text); throw new Error('Resposta inválida do servidor'); }
        if (!data.sucesso) throw new Error(data.mensagem);

        mostrarAlerta('Pedido enviado com sucesso! Redirecionando...', 'success');
        setTimeout(() => window.location.href = 'index.php?rota=meus_projetos', 1800);

    } catch (err) {
        console.error(err);
        mostrarAlerta('Erro: ' + err.message, 'danger');
    } finally {
        botao.disabled  = false;
        botao.innerHTML = textoOriginal;
    }
}

/* ── VALIDAÇÃO ── */

function validarFormulario() {
    limparErros();
    let valido = true;
    const erros = [];

    // Campos obrigatórios (prazo é opcional)
    const obrigatorios = [
        { id: 'nome_projeto', label: 'Nome do Projeto' },
        { id: 'descricao',    label: 'Descrição' },
        { id: 'quantidade',   label: 'Quantidade' },
        { id: 'endereco',     label: 'Endereço de entrega' },
    ];

    obrigatorios.forEach(({ id, label }) => {
        const campo = document.getElementById(id);
        if (!campo.value.trim()) {
            marcarErro(campo);
            erros.push(label);
            valido = false;
        }
    });

    

    // Partes
    const partes = document.querySelectorAll('.parte-card');
    if (partes.length === 0) {
        erros.push('Adicione ao menos uma parte personalizada');
        valido = false;
    }

    partes.forEach((parte, i) => {
        const nome     = parte.querySelector('.nome-parte');
        const descricao = parte.querySelector('.descricao-parte');
        const material = parte.querySelector('.material-parte');
        const cor      = parte.querySelector('.cor-parte');

        if (!nome.value.trim())     { marcarErro(nome);     erros.push(`Parte ${i+1}: Nome`);     valido = false; }
        if (!descricao.value.trim()){ marcarErro(descricao);erros.push(`Parte ${i+1}: Descrição`); valido = false; }
        if (!material.value)        { marcarErro(material); erros.push(`Parte ${i+1}: Material`);  valido = false; }
        if (!cor.value.trim())      { marcarErro(cor);      erros.push(`Parte ${i+1}: Cor`);       valido = false; }
    });

    if (!valido) {
        mostrarAlerta(`Corrija os campos obrigatórios:<br>• ${erros.join('<br>• ')}`, 'danger');
        document.querySelector('.is-invalid, .dropzone-erro')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return valido;
}

function marcarErro(campo)  { campo.classList.add('is-invalid'); }
function limparErros() {
    document.querySelectorAll('.is-invalid').forEach(c => c.classList.remove('is-invalid'));
    document.getElementById('dropzone')?.classList.remove('dropzone-erro');
}

/* ── MONTAR FORMDATA ── */

function montarFormData() {
    const fd = new FormData();

    fd.append('maker_id',     document.getElementById('maker_id').value);
    fd.append('nome_projeto', document.getElementById('nome_projeto').value);
    fd.append('descricao',    document.getElementById('descricao').value);
    fd.append('quantidade',   document.getElementById('quantidade').value);
    fd.append('prazo',        document.getElementById('prazo').value);
    fd.append('endereco',     document.getElementById('endereco').value);
    fd.append('observacoes',  document.getElementById('observacoes').value);
    fd.append('arquivo_3d',   document.getElementById('arquivo_3d').files[0]);

    // Imagem de capa (opcional)
    const capa = document.getElementById('imagem_capa')?.files[0];
    if (capa) fd.append('imagem_capa', capa);

    // Partes
    const partes = [];
    document.querySelectorAll('.parte-card').forEach(parte => {
        partes.push({
            nome:       parte.querySelector('.nome-parte').value,
            descricao:  parte.querySelector('.descricao-parte').value,
            material:   parte.querySelector('.material-parte').value,
            cor:        parte.querySelector('.cor-parte').value,
            quantidade: parte.querySelector('.quantidade-parte').value,
        });
    });
    fd.append('partes', JSON.stringify(partes));

    return fd;
}

/* ── ALERTA ── */

function mostrarAlerta(msg, tipo) {
    const el = document.getElementById('mensagensFormulario');
    el.className = `alert alert-${tipo} mb-4`;
    el.innerHTML = msg;
    el.classList.remove('d-none');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (tipo === 'success') setTimeout(() => el.classList.add('d-none'), 4000);
}