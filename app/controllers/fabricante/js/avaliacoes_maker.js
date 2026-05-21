document.addEventListener('DOMContentLoaded', carregarAvaliacoesRecebidas);

async function carregarAvaliacoesRecebidas() {
    const container = document.getElementById('lista-avaliacoes-recebidas');
    const resumo    = document.getElementById('resumo-avaliacoes');
    if (!container) return;

    try {
        const res = await fetch('../app/controllers/fabricante/php/listar_avaliacoes_recebidas.php');
        const data = await res.json();

        if (data.status !== 'ok') {
            container.innerHTML = `<p class="text-muted mb-0">Não foi possível carregar as avaliações.</p>`;
            return;
        }

        const { avaliacoes, total_avaliacoes, media_nota } = data.data;

        if (resumo) {
            if (total_avaliacoes > 0) {
                resumo.innerHTML = `
                    <span class="aval-resumo-estrelas">${renderEstrelasAval(media_nota)}</span>
                    <strong>${Number(media_nota).toFixed(1)}</strong>
                    <span class="text-muted">(${total_avaliacoes} avalia${total_avaliacoes > 1 ? 'ções' : 'ção'})</span>
                `;
            } else {
                resumo.innerHTML = `<span class="text-muted">Sem avaliações ainda</span>`;
            }
        }

        if (avaliacoes.length === 0) {
            container.innerHTML = `<p class="text-muted mb-0">Você ainda não recebeu avaliações.</p>`;
            return;
        }

        container.innerHTML = avaliacoes.map(a => `
            <div class="aval-recebida" data-id="${a.id}">
                <div class="aval-recebida-topo">
                    <div>
                        <strong>${escapeAvalM(a.cliente_nome)}</strong>
                        <span class="aval-projeto">· ${escapeAvalM(a.nome_projeto)}</span>
                    </div>
                    <span class="aval-data">${formatarDataAvalM(a.data_avaliacao)}</span>
                </div>
                <div class="aval-recebida-estrelas">${renderEstrelasAval(a.nota)}</div>
                ${a.comentario ? `<p class="aval-recebida-comentario">${escapeAvalM(a.comentario)}</p>` : ''}

                ${a.resposta_maker ? `
                    <div class="aval-resposta-box">
                        <div class="aval-resposta-titulo">
                            <strong><i class="bi bi-reply"></i> Sua resposta</strong>
                            <button class="btn-editar-resposta" onclick="abrirFormResposta(${a.id})">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                        </div>
                        <p>${escapeAvalM(a.resposta_maker)}</p>
                    </div>
                ` : `
                    <button class="btn-responder" onclick="abrirFormResposta(${a.id})">
                        <i class="bi bi-reply"></i> Responder
                    </button>
                `}

                <div class="form-resposta-wrap" id="form-resposta-${a.id}" style="display:none;">
                    <textarea id="texto-resposta-${a.id}" placeholder="Escreva sua resposta...">${a.resposta_maker ? escapeAvalM(a.resposta_maker) : ''}</textarea>
                    <div class="form-resposta-acoes">
                        <button class="btn-cancelar-resposta" onclick="fecharFormResposta(${a.id})">Cancelar</button>
                        <button class="btn-salvar-resposta" onclick="salvarResposta(${a.id})">
                            <i class="bi bi-check-lg"></i> Salvar
                        </button>
                    </div>
                    <div class="msg-resposta" id="msg-resposta-${a.id}"></div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<p class="text-muted mb-0">Erro ao carregar avaliações.</p>`;
    }
}

function abrirFormResposta(id) {
    document.getElementById(`form-resposta-${id}`).style.display = 'block';
}

function fecharFormResposta(id) {
    document.getElementById(`form-resposta-${id}`).style.display = 'none';
    document.getElementById(`msg-resposta-${id}`).innerHTML = '';
}

async function salvarResposta(id) {
    const texto = document.getElementById(`texto-resposta-${id}`).value.trim();
    const msgBox = document.getElementById(`msg-resposta-${id}`);

    if (texto === '') {
        msgBox.innerHTML = `<span class="msg-erro">Escreva uma resposta antes de salvar.</span>`;
        return;
    }

    try {
        const formData = new FormData();
        formData.append('avaliacao_id', id);
        formData.append('resposta', texto);

        const res = await fetch('../app/controllers/fabricante/php/responder_avaliacao.php', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.status === 'ok') {
            carregarAvaliacoesRecebidas();
        } else {
            msgBox.innerHTML = `<span class="msg-erro">${data.mensagem}</span>`;
        }
    } catch (err) {
        msgBox.innerHTML = `<span class="msg-erro">Erro ao salvar. Tente novamente.</span>`;
    }
}

function renderEstrelasAval(nota) {
    const n = parseFloat(nota) || 0;
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= Math.round(n) ? '<i class="bi bi-star-fill"></i>' : '<i class="bi bi-star"></i>';
    }
    return html;
}

function formatarDataAvalM(str) {
    return new Date(str).toLocaleDateString('pt-BR');
}

function escapeAvalM(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}