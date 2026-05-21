let chatPedidoId = null;
let chatMeuId = null;
let chatPollingTimer = null;
let chatUltimoId = 0;

function abrirChat(pedidoId) {
    chatPedidoId = pedidoId;
    chatUltimoId = 0;

    let modal = document.getElementById('modal-chat');
    if (!modal) {
        modal = criarModalChat();
        document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
    document.getElementById('chat-mensagens').innerHTML = '<div class="chat-loading">Carregando mensagens...</div>';
    document.getElementById('chat-input').value = '';
    document.getElementById('chat-input').focus();

    carregarMensagensChat(true);

    if (chatPollingTimer) clearInterval(chatPollingTimer);
    chatPollingTimer = setInterval(() => carregarMensagensChat(false), 3000);
}

function fecharChat() {
    const modal = document.getElementById('modal-chat');
    if (modal) modal.style.display = 'none';
    if (chatPollingTimer) {
        clearInterval(chatPollingTimer);
        chatPollingTimer = null;
    }
    chatPedidoId = null;
    chatUltimoId = 0;
}

function criarModalChat() {
    const modal = document.createElement('div');
    modal.id = 'modal-chat';
    modal.className = 'modal-chat';
    modal.innerHTML = `
        <div class="modal-chat-conteudo">
            <div class="chat-header">
                <div>
                    <div class="chat-titulo"><i class="bi bi-chat-dots"></i> Conversa</div>
                    <div class="chat-subtitulo" id="chat-subtitulo">Carregando...</div>
                </div>
                <button class="chat-fechar" onclick="fecharChat()"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="chat-mensagens" id="chat-mensagens"></div>
            <form class="chat-form" id="chat-form" onsubmit="enviarMensagemChat(event)">
                <input type="text" id="chat-input" placeholder="Digite sua mensagem..." maxlength="1000" autocomplete="off">
                <button type="submit" class="chat-btn-enviar" title="Enviar">
                    <i class="bi bi-send-fill"></i>
                </button>
            </form>
            <div class="chat-erro" id="chat-erro"></div>
        </div>
    `;
    modal.addEventListener('click', e => {
        if (e.target === modal) fecharChat();
    });
    return modal;
}

async function carregarMensagensChat(scrollToBottom) {
    if (!chatPedidoId) return;
    try {
        const res = await fetch(`../app/controllers/usuario/php/listar_mensagens.php?pedido_id=${chatPedidoId}`);
        const data = await res.json();

        if (data.status !== 'ok') {
            document.getElementById('chat-mensagens').innerHTML =
                `<div class="chat-vazio">${data.mensagem}</div>`;
            return;
        }

        chatMeuId = data.data.meu_id;
        document.getElementById('chat-subtitulo').textContent =
            `${data.data.outro_nome} · ${data.data.nome_projeto}`;

        const novas = data.data.mensagens;
        if (novas.length === 0) {
            document.getElementById('chat-mensagens').innerHTML =
                `<div class="chat-vazio">Nenhuma mensagem ainda. Inicie a conversa!</div>`;
            return;
        }

        const ultimoId = novas[novas.length - 1].id;
        if (ultimoId === chatUltimoId && !scrollToBottom) return;
        chatUltimoId = ultimoId;

        renderizarMensagensChat(novas);

        if (scrollToBottom || estaProximoDoFim()) {
            const box = document.getElementById('chat-mensagens');
            box.scrollTop = box.scrollHeight;
        }
    } catch (err) {
        console.error('Erro ao carregar mensagens:', err);
    }
}

function estaProximoDoFim() {
    const box = document.getElementById('chat-mensagens');
    if (!box) return true;
    return (box.scrollHeight - box.scrollTop - box.clientHeight) < 80;
}

function renderizarMensagensChat(mensagens) {
    const box = document.getElementById('chat-mensagens');
    box.innerHTML = mensagens.map(m => {
        const eu = (m.remetente_id === chatMeuId);
        const classe = eu ? 'chat-msg eu' : 'chat-msg outro';
        return `
            <div class="${classe}">
                <div class="chat-msg-balao">
                    ${escapeChat(m.mensagem)}
                    <span class="chat-msg-hora">${formatarHoraChat(m.data_envio)}</span>
                </div>
            </div>`;
    }).join('');
}

async function enviarMensagemChat(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const erroBox = document.getElementById('chat-erro');
    erroBox.textContent = '';

    const texto = input.value.trim();
    if (texto === '') return;

    const btn = e.target.querySelector('.chat-btn-enviar');
    btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('pedido_id', chatPedidoId);
        formData.append('mensagem', texto);

        const res = await fetch('../app/controllers/usuario/php/enviar_mensagem.php', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.status === 'ok') {
            input.value = '';
            await carregarMensagensChat(true);
        } else {
            erroBox.textContent = data.mensagem;
        }
    } catch (err) {
        erroBox.textContent = 'Erro ao enviar. Tente novamente.';
    } finally {
        btn.disabled = false;
        input.focus();
    }
}

function formatarHoraChat(str) {
    const d = new Date(str);
    const hoje = new Date();
    const ehHoje = d.toDateString() === hoje.toDateString();
    if (ehHoje) {
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function escapeChat(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}