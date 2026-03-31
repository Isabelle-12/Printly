
async function carregarPedidosExpirados() {
    const container = document.getElementById('pedidos-atrasados');
    container.innerHTML = '<p class="text-muted">Carregando...</p>';

    const resposta = await fetch('../app/controllers/admin/listar_pedidos_expirados.php');
    const retorno  = await resposta.json();

    if (retorno.status === 'ok' && retorno.data.length > 0) {
        let itens = '';
        for (let i = 0; i < retorno.data.length; i++) {
            let p = retorno.data[i];
            itens += `
                <div class="d-flex justify-content-between align-items-center border rounded p-2 mb-2">
                    <div>
                        <strong>Pedido #${p.id}</strong> &mdash; ${p.maker_nome}
                        <br><small class="text-muted">${p.maker_email} &bull; Prazo: ${p.prazo_pedido} &bull; Status: ${p.status}</small>
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="notificarAtraso(${p.id}, '${p.maker_email}')">
                        Notificar
                    </button>
                </div>
            `;
        }
        container.innerHTML = itens;
    } else {
        container.innerHTML = '<p class="text-success">Nenhum pedido com prazo expirado.</p>';
    }
}

async function notificarAtraso(pedidoId, emailDestino) {
    const mensagem = 'Seu pedido #' + pedidoId + ' está com prazo expirado. Entre em contato para mais detalhes.';

    const resposta = await fetch('../app/controllers/admin/enviar_notificacao_atraso.php', {
        method: 'POST',
        body:   new URLSearchParams({
            pedido_id:     pedidoId,
            email_destino: emailDestino,
            mensagem:      mensagem
        })
    });
    const retorno = await resposta.json();

    alert(retorno.mensagem);

    if (retorno.status === 'ok') {
        carregarNotificacoesEnviadas();
    }
}


// document.getElementById('form-manutencao').addEventListener('submit', async function(event) {
//     event.preventDefault();

//         const titulo      = document.getElementById('titulo').value;
//         const mensagem    = document.getElementById('mensagem').value;
//         const data_inicio = document.getElementById('data_inicio').value;
//         const data_fim    = document.getElementById('data_fim').value;

//         const resposta = await fetch('../app/controllers/admin/agendar_manutencao.php', {
//             method: 'POST',
//             body:   new URLSearchParams({
//                 titulo:      titulo,
//                 mensagem:    mensagem,
//                 data_inicio: data_inicio,
//                 data_fim:    data_fim
//             })
//         });
//         const retorno = await resposta.json();

//         alert(retorno.mensagem);

//     if (retorno.status === 'ok') {
//         document.getElementById('form-manutencao').reset();
//     }
// });


async function carregarNotificacoesEnviadas() {
    const container = document.getElementById('notificacoes-enviadas');
    if (!container) return;

    container.innerHTML = '<p class="text-muted">Carregando...</p>';

    const resposta = await fetch('../app/controllers/admin/listar_notificacoes_enviadas.php');
    const retorno  = await resposta.json();

    if (retorno.status === 'ok' && retorno.data.length > 0) {
        let itens = '';
        for (let i = 0; i < retorno.data.length; i++) {
            let n = retorno.data[i];
            let btnRetratar = n.retratada == 0
                ? '<button class="btn btn-sm btn-warning" onclick="retratar(' + n.id + ')">Retratar</button>'
                : '<span class="badge bg-secondary">Retratada</span>';

            itens += `
                <div class="d-flex justify-content-between align-items-center border rounded p-2 mb-2">
                    <div>
                        <strong>${n.titulo || n.tipo}</strong>
                        <br><small class="text-muted">${n.data_envio} &bull; ${n.email_destino || '—'}</small>
                        <br><small>${n.mensagem}</small>
                    </div>
                    <div>${btnRetratar}</div>
                </div>
            `;
        }
        container.innerHTML = itens;
    } else {
        container.innerHTML = '<p class="text-muted">Nenhuma notificação enviada.</p>';
    }
}

async function retratar(id) {
    if (!confirm('Confirma a retratação desta notificação?')) return;

    const resposta = await fetch('../app/controllers/admin/retratar_notificacao.php', {
        method: 'POST',
        body:   new URLSearchParams({ id: id })
    });
    const retorno = await resposta.json();

    alert(retorno.mensagem);

    if (retorno.status === 'ok') {
        carregarNotificacoesEnviadas();
    }
}


async function carregarAnunciosGlobais() {
    const container = document.getElementById('banner-anuncios');
    if (!container) return;

    const resposta = await fetch('../app/controllers/admin/listar_anuncios_ativos.php');
    const retorno  = await resposta.json();

    if (retorno.status === 'ok' && retorno.data.length > 0) {
        let a = retorno.data[0];
        document.getElementById('banner-titulo').textContent   = a.titulo;
        document.getElementById('banner-mensagem').textContent = a.mensagem;
        document.getElementById('banner-periodo').textContent  = a.data_inicio + ' até ' + a.data_fim;
        container.classList.remove('d-none');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    carregarPedidosExpirados();
    carregarNotificacoesEnviadas();

    const formManutencao = document.getElementById('form-manutencao');
    if (formManutencao) {
        formManutencao.addEventListener('submit', async function(event) {
            event.preventDefault();

            const titulo      = document.getElementById('titulo').value;
            const mensagem    = document.getElementById('mensagem').value;
            const data_inicio = document.getElementById('data_inicio').value;
            const data_fim    = document.getElementById('data_fim').value;

            const resposta = await fetch('../app/controllers/admin/agendar_manutencao.php', {
                method: 'POST',
                body:   new URLSearchParams({
                    titulo:      titulo,
                    mensagem:    mensagem,
                    data_inicio: data_inicio,
                    data_fim:    data_fim
                })
            });
            const retorno = await resposta.json();

            alert(retorno.mensagem);

            if (retorno.status === 'ok') {
                formManutencao.reset();
            }
        });
    }

    carregarAnunciosGlobais();
});