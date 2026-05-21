document.addEventListener('DOMContentLoaded', carregarMeusFeedbacks);

async function carregarMeusFeedbacks() {
    const lista = document.getElementById('lista-meus-feedbacks');
    if (!lista) return;

    try {
        const res = await fetch('../app/controllers/usuario/php/listar_minhas_avaliacoes.php');
        const data = await res.json();

        if (data.status !== 'ok') {
            lista.innerHTML = `<p class="text-muted mb-0">Não foi possível carregar os feedbacks.</p>`;
            return;
        }

        if (data.data.length === 0) {
            lista.innerHTML = `<p class="text-muted mb-0">Você ainda não enviou nenhum feedback.</p>`;
            return;
        }

        lista.innerHTML = data.data.map(av => `
            <div class="feedback-card">
                <div class="feedback-card-topo">
                    <strong>${escapeHtml(av.nome_empresa || av.maker_nome)}</strong>
                    <span class="feedback-data">${formatarData(av.data_avaliacao)}</span>
                </div>
                <div class="feedback-estrelas">${renderEstrelas(av.nota)}</div>
                ${av.comentario ? `<p class="feedback-comentario">${escapeHtml(av.comentario)}</p>` : ''}
                ${av.resposta_maker ? `
                    <div class="feedback-resposta">
                        <strong><i class="bi bi-reply"></i> Resposta do fabricante:</strong>
                        <p>${escapeHtml(av.resposta_maker)}</p>
                    </div>` : ''}
            </div>
        `).join('');
    } catch (err) {
        lista.innerHTML = `<p class="text-muted mb-0">Erro ao carregar feedbacks.</p>`;
    }
}

function renderEstrelas(nota) {
    const n = parseInt(nota) || 0;
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= n ? '<i class="bi bi-star-fill"></i>' : '<i class="bi bi-star"></i>';
    }
    return html;
}

function formatarData(str) {
    const d = new Date(str);
    return d.toLocaleDateString('pt-BR');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
}