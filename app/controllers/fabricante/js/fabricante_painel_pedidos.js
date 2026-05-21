document.addEventListener("DOMContentLoaded", () => {
    carregarPedidosPendentes();
    carregarPedidosAceitos();
});

let pedidoAtualId = null;

async function carregarPedidosPendentes() {
    const container = document.getElementById("lista-pedidos-pendentes");
    if (!container) return;

    try {
        const resposta = await fetch("../app/controllers/fabricante/php/listar_pedidos_pendentes.php");
        const dados = await resposta.json();

        container.innerHTML = "";

        if (dados.status === "nok") {
            container.innerHTML = `<p class="text-danger">${dados.mensagem}</p>`;
            return;
        }

        if (dados.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhum pedido pendente para análise no momento.</p>';
            return;
        }

        dados.forEach(pedido => {
            const valorFormatado = parseFloat(pedido.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            const cardHTML = `
                <div class="card mb-3 border-start border-warning border-4 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="card-title fw-bold mb-0">Projeto: ${pedido.nome_projeto}</h6>
                            <span class="badge bg-warning text-dark">Pendente</span>
                        </div>
                        <p class="card-text mb-1 text-muted"><i class="bi bi-person"></i> <strong>Cliente:</strong> ${pedido.cliente_nome}</p>
                        <p class="card-text mb-1 text-muted"><i class="bi bi-calendar"></i> <strong>Data:</strong> ${pedido.data_solicitacao}</p>
                        <p class="card-text mb-3 text-muted"><i class="bi bi-currency-dollar"></i> <strong>Valor:</strong> ${valorFormatado}</p>
                        
                        <button class="btn btn-success btn-sm" onclick="verDetalhes(${pedido.id})">Analisar Pedido</button>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

    } catch (erro) {
        console.error(erro);
        container.innerHTML = '<p class="text-danger">Erro de conexão ao carregar os pedidos.</p>';
    }
}

async function verDetalhes(id_pedido) {
    pedidoAtualId = id_pedido;

    try {
        const resposta = await fetch(`../app/controllers/fabricante/php/buscar_detalhes_pedido.php?id=${id_pedido}`);
        const dados = await resposta.json();

        if (dados.status === "nok") {
            alert("Erro: " + dados.mensagem);
            return;
        }

        const pedido = dados;

        const elId = document.getElementById('modal-pedido-id');
        const elNome = document.getElementById('modal-nome-projeto');
        const elCliente = document.getElementById('modal-cliente-nome');
        const elMaterial = document.getElementById('modal-material');
        const elLink = document.getElementById('modal-link-arquivo');
        const elValorSugerido = document.getElementById('modal-valor-sugerido');
        const elInputValor = document.getElementById('modal-input-valor');
        const elInputPrazo = document.getElementById('modal-input-prazo');

        if (elId) elId.innerText = pedido.id;
        if (elNome) elNome.innerText = pedido.nome_projeto;
        if (elCliente) elCliente.innerText = pedido.cliente_nome;
        if (elMaterial) elMaterial.innerText = pedido.material_escolhido || 'Não informado';

        if (elLink) {
            const base_url = window.location.origin;
            const path_projeto = window.location.pathname.split('/app/')[0];
            elLink.href = `${base_url}${path_projeto}/${pedido.arquivo_caminho}`;

            const nomeArquivo = pedido.arquivo_caminho.split('/').pop();
            elLink.setAttribute('download', nomeArquivo);
        }

        if (elValorSugerido) {
            const valorSugerido = parseFloat(pedido.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            elValorSugerido.innerText = valorSugerido;
        }

        if (elInputValor) elInputValor.value = parseFloat(pedido.valor_total).toFixed(2);
        if (elInputPrazo) elInputPrazo.value = "5";

        // PBI 7 - botão "Abrir Visualizador" para validação técnica
        const linkVisualizador = document.getElementById('modal-link-visualizador');
        if (linkVisualizador) {
            linkVisualizador.href = `index.php?rota=visualizador3F&pedido_id=${pedido.id}`;
        }

        const areaRecusa = document.getElementById('area-recusa');
        const botoesAcao = document.getElementById('botoes-acao-modal');
        const motivoRecusa = document.getElementById('motivo-recusa');

        if (areaRecusa) areaRecusa.style.display = 'none';
        if (botoesAcao) botoesAcao.style.display = 'flex';
        if (motivoRecusa) motivoRecusa.value = '';

        const modal = new bootstrap.Modal(document.getElementById('modalAnalisarPedido'));
        modal.show();

    } catch (erro) {
        console.error(erro);
        alert("Erro ao processar os detalhes do pedido no navegador.");
    }
}

function mostrarAreaRecusa() {
    document.getElementById('botoes-acao-modal').style.display = 'none';
    document.getElementById('area-recusa').style.display = 'block';
}

async function confirmarAceite() {
    const precoFinal = document.getElementById('modal-input-valor').value;
    const prazoDias = document.getElementById('modal-input-prazo').value;

    if (!precoFinal || precoFinal <= 0 || !prazoDias || prazoDias <= 0) {
        alert("Por favor, insira um preço e um prazo válidos.");
        return;
    }

    const dadosForm = new URLSearchParams();
    dadosForm.append('id', pedidoAtualId);
    dadosForm.append('valor_total', precoFinal);
    dadosForm.append('prazo_dias', prazoDias);

    try {
        const resposta = await fetch("../app/controllers/fabricante/php/aceitar_pedido.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: dadosForm
        });

        const resultado = await resposta.json();

        if (resultado.status === "ok") {
            alert(resultado.mensagem);
            bootstrap.Modal.getInstance(document.getElementById('modalAnalisarPedido')).hide();
            carregarPedidosPendentes();
            carregarPedidosAceitos();
        } else {
            alert("Erro: " + resultado.mensagem);
        }
    } catch (erro) {
        console.error(erro);
        alert("Erro de conexão ao aceitar o pedido.");
    }
}

async function confirmarRecusa() {
    const motivo = document.getElementById('motivo-recusa').value;

    if (motivo.trim() === "") {
        alert("Por favor, informe o motivo da recusa.");
        return;
    }

    const dadosForm = new URLSearchParams();
    dadosForm.append('id', pedidoAtualId);
    dadosForm.append('motivo_recusa', motivo);

    try {
        const resposta = await fetch("../app/controllers/fabricante/php/negar_pedido.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: dadosForm
        });

        const resultado = await resposta.json();

        if (resultado.status === "ok") {
            alert(resultado.mensagem);
            bootstrap.Modal.getInstance(document.getElementById('modalAnalisarPedido')).hide();
            carregarPedidosPendentes();
        } else {
            alert("Erro: " + resultado.mensagem);
        }
    } catch (erro) {
        console.error(erro);
        alert("Erro de conexão ao recusar o pedido.");
    }
}

async function carregarPedidosAceitos() {
    const container = document.getElementById("lista-pedidos-aceitos");
    if (!container) return;

    try {
        const resposta = await fetch("../app/controllers/fabricante/php/listar_pedidos_aceitos.php");
        const retorno = await resposta.json();

        container.innerHTML = "";

        if (retorno.status === "nok") {
            container.innerHTML = `<p class="text-danger">${retorno.mensagem}</p>`;
            return;
        }

        if (!retorno.data || retorno.data.length === 0) {
            container.innerHTML = '<p class="text-muted">Você ainda não possui pedidos em andamento ou concluídos.</p>';
            return;
        }

        retorno.data.forEach(pedido => {
            const valorFormatado = parseFloat(pedido.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            let corBadge = "bg-primary";
            let corBorda = "border-primary";
            let statusTexto = pedido.status;

            if (pedido.status === 'CONCLUIDO') {
                corBadge = "bg-success";
                corBorda = "border-success";
                statusTexto = "Concluído";
            } else if (pedido.status === 'EM_PRODUCAO') {
                corBadge = "bg-info text-dark";
                corBorda = "border-info";
                statusTexto = "Em Produção";
            } else if (pedido.status === 'ACEITO') {
                corBadge = "bg-warning text-dark";
                corBorda = "border-warning";
                statusTexto = "Aceito";
            } else if (pedido.status === 'ARQUIVO_VALIDADO') {
                corBadge = "bg-success";
                corBorda = "border-success";
                statusTexto = "Arquivo Validado";
            }

            let prazoTexto = "Não definido";
            if (pedido.prazo_pedido) {
                const data = new Date(pedido.prazo_pedido);
                prazoTexto = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }

            const podeChat = ['ACEITO', 'EM_PRODUCAO', 'ARQUIVO_VALIDADO', 'ENTREGUE'].includes(pedido.status);
            const botaoChat = podeChat
                ? `<button class="btn btn-sm btn-outline-dark mt-2 me-2 btn-chat-pedido" data-pedido-id="${pedido.id}">
                       <i class="bi bi-chat-dots"></i> Mensagens
                   </button>`
                : '';

            // PBI 7 - botão Validar Arquivo nos cards de pedidos aceitos
            const podeValidar = ['ACEITO', 'EM_PRODUCAO'].includes(pedido.status);
            const botaoValidar = podeValidar
                ? `<a href="index.php?rota=visualizador3F&pedido_id=${pedido.id}" class="btn btn-sm btn-outline-primary mt-2">
                       <i class="bi bi-shield-check"></i> Validar Arquivo
                   </a>`
                : '';

            const cardHTML = `
                <div class="card mb-3 border-start ${corBorda} border-4 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="card-title fw-bold mb-0">Pedido #${pedido.id} - ${pedido.nome_projeto}</h6>
                            <span class="badge ${corBadge}">${statusTexto}</span>
                        </div>
                        <p class="card-text mb-1 text-muted"><i class="bi bi-person"></i> <strong>Cliente:</strong> ${pedido.cliente_nome}</p>
                        <p class="card-text mb-1 text-muted"><i class="bi bi-currency-dollar"></i> <strong>Valor Fechado:</strong> ${valorFormatado}</p>
                        <p class="card-text mb-0 text-muted"><i class="bi bi-calendar-event"></i> <strong>Prazo Final:</strong> ${prazoTexto}</p>
                        ${botaoChat}
                        ${botaoValidar}
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

    } catch (erro) {
        console.error(erro);
        container.innerHTML = '<p class="text-danger">Erro de conexão ao carregar o histórico.</p>';
    }
}