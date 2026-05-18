
// Instâncias dos Modais do Bootstrap
// No topo do arquivo meus_projetos.js
let modalDetalhes;
let modalEditar;
let listaProjetosGlobal = [];
filtroAtual = "TODOS"; // Adicione ou garanta que esta linha existe

document.addEventListener("DOMContentLoaded", () => {
    modalDetalhes = new bootstrap.Modal(document.getElementById('modalProjeto'));
    modalEditar = new bootstrap.Modal(document.getElementById('modalEditarProjeto'));
    
    // Carrega os projetos inicialmente
    carregarProjetos();

    // Listener do formulário de edição
    const formEditar = document.getElementById('formEditarProjeto');
    if (formEditar) {
        formEditar.addEventListener('submit', salvarAlteracoesProjeto);
    }
});

/* ==========================================================================
   1. CARREGAMENTO E LISTAGEM DE PROJETOS
   ========================================================================== */

function carregarProjetos() {
    const container = document.getElementById('cardsProjetos');
    
    // Rota corrigida e atualizada para o novo arquivo gerenciador de requisições GET
    fetch('../app/controllers/usuario/php/meus_projetos_get.php')
        .then(response => {
            if (!response.ok) throw new Error('Erro na resposta do servidor');
            return response.json();
        })
        .then(dados => {
            // Verifica se o status retornado é 'erro'
            if (dados.status === 'erro') {
                container.innerHTML = `<div class="alert alert-danger w-100">${dados.mensagem}</div>`;
                return;
            }
            
            // Popula a listagem global com a nova propriedade 'projetos' vinda do backend
            listaProjetosGlobal = dados.projetos || [];
            filtrarProjetos(filtroAtual); // Usa a variável 'filtroAtual' definida no escopo global do HTML
        })
        .catch(error => {
            console.error('Erro:', error);
            container.innerHTML = `
                <div class="empty-state w-100">
                    <i class="bi bi-exclamation-triangle text-danger fs-1"></i>
                    <p class="mt-2">Não foi possível carregar seus projetos no momento.</p>
                </div>`;
        });
}

function filtrarProjetos(statusFiltro) {
    const container = document.getElementById('cardsProjetos');
    if (!container) return; // Segurança caso o ID mude no HTML
    
    container.innerHTML = ''; 

    const projetosFiltrados = listaProjetosGlobal.filter(p => {
        // Garanta que a comparação ignore maiúsculas/minúsculas se necessário
        return statusFiltro === "TODOS" || p.status_solicitacao === statusFiltro;
    });

    if (projetosFiltrados.length === 0) {
        // ... (seu código de empty state)
        return;
    }

    projetosFiltrados.forEach(projeto => {
        const card = document.createElement('div');
        card.className = 'card';
        
        const classeStatus = obterClasseStatus(projeto.status_solicitacao);
        const nomeStatusFormatado = projeto.status_solicitacao.replace(/_/g, ' ');

        // AJUSTE AQUI: O seu PHP enviou como 'caminho_arquivo' (ou imagem_capa se você mudou o PHP)
        // Use o nome exato que está no SELECT do seu PHP
        const imagemCapa = projeto.caminho_arquivo || '/Printly/assets/img/default.png';

        card.innerHTML = `
            <div class="card-imagem">
                <img src="${imagemCapa}" alt="${projeto.nome_projeto}" onerror="this.src='/Printly/assets/img/default.png'">
                <span class="status ${classeStatus}">${nomeStatusFormatado}</span>
            </div>
            <div class="card-header">
                <div class="card-icon"><i class="bi bi-box-seam"></i></div>
                <h5>${projeto.nome_projeto}</h5>
            </div>
            <div class="card-body">
                <p class="desc">${projeto.descricao ? projeto.descricao.substring(0, 90) + '...' : 'Sem descrição.'}</p>
                <div class="informacoes">
                    <span><i class="bi bi-layers"></i> Formato: ${projeto.formato}</span>
                    <span><i class="bi bi-hash"></i> Qtd: ${projeto.quantidade}x</span>
                    <span><i class="bi bi-calendar3"></i> ${formatarData(projeto.data_solicitacao)}</span>
                </div>
                <div class="acoes">
                    <button type="button" onclick="verDetalhes(${projeto.id})">Detalhes</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}
/* ==========================================================================
   2. DETALHES DO PROJETO (MODAL VISUALIZAR)
   ========================================================================== */

function verDetalhes(id) {
    // Reseta corpo do modal adicionando o feedback visual de carregamento
    document.getElementById('conteudoModalProjeto').innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-3">Buscando informações completas...</p>
        </div>`;
    
    modalDetalhes.show();

    fetch(`../app/controllers/usuario/php/obter_detalhes_projeto.php?id=${id}`)
        .then(res => res.json())
        .then(dados => {
            if (dados.status === 'erro') {
                document.getElementById('conteudoModalProjeto').innerHTML = `<div class="alert alert-danger">${dados.mensagem}</div>`;
                return;
            }

            const p = dados.projeto;
            let partesHtml = '';

            // Renderização das subpartes/especificações do projeto
            if (p.partes && p.partes.length > 0) {
                p.partes.forEach(parte => {
                    partesHtml += `
                        <div class="parte-card">
                            <div class="row align-items-center">
                                <div class="col-md-4"><strong>${parte.nome_parte}</strong></div>
                                <div class="col-md-3">Cor: <span class="badge bg-secondary">${parte.cor}</span></div>
                                <div class="col-md-3">Material: ${parte.material}</div>
                                <div class="col-md-2">Infill: ${parte.infill}%</div>
                            </div>
                        </div>`;
                });
            } else {
                partesHtml = '<p class="text-muted font-monospace small">Nenhuma especificação de subpartes configurada.</p>';
            }

            // Timeline reativa com base no status atual vindo da View
            const timelineHtml = gerarTimelineHtml(p.status_solicitacao);

            document.getElementById('conteudoModalProjeto').innerHTML = `
                <div class="row">
                    <div class="col-md-5 mb-3">
                        <img src="${p.imagem_capa || '/Printly/assets/img/default.png'}" class="img-fluid rounded shadow-sm mb-2" onerror="this.src='/Printly/assets/img/default.png'">
                        ${p.caminho_arquivo ? `
                            <a href="${p.caminho_arquivo}" download class="btn btn-outline-dark btn-sm w-100 mt-2">
                                <i class="bi bi-download"></i> Baixar Arquivo 3D (${p.formato})
                            </a>
                        ` : ''}
                    </div>
                    <div class="col-md-7">
                        <h3>${p.nome_projeto}</h3>
                        <p class="text-muted">${p.descricao || 'Sem descrição cadastrada.'}</p>
                        <hr>
                        <div class="row mb-3">
                            <div class="col-6"><strong>Qtd Solicitada:</strong> ${p.quantidade} unidades</div>
                            <div class="col-6"><strong>Formato Base:</strong> ${p.formato}</div>
                        </div>
                        
                        <h5 class="mt-4">Especificações de Impressão</h5>
                        ${partesHtml}
                    </div>
                </div>
                <hr>
                <h5 class="mb-3">Acompanhamento do Pedido</h5>
                ${timelineHtml}
            `;
        })
        .catch(() => {
            document.getElementById('conteudoModalProjeto').innerHTML = `<div class="alert alert-danger">Erro de conexão ao carregar detalhes.</div>`;
        });
}

/* ==========================================================================
   3. EDIÇÃO DO PROJETO (MODAL EDITAR)
   ========================================================================== */

function abrirEditar(id) {
    const projeto = listaProjetosGlobal.find(p => p.id == id);
    if (!projeto) return;

    // Preenche os inputs básicos do formulário de edição
    document.getElementById('editar_id').value = projeto.id;
    document.getElementById('editar_nome').value = projeto.nome_projeto;
    document.getElementById('editar_descricao').value = projeto.descricao || '';
    document.getElementById('editar_formato').value = projeto.formato;
    document.getElementById('editar_quantidade').value = projeto.quantidade;
    document.getElementById('previewImagemProjeto').src = projeto.imagem_capa || '/Printly/assets/img/default.png';
    
    // Reseta containers de logs e partes dinâmicas
    document.getElementById('editarMensagem').innerHTML = '';
    const containerPartes = document.getElementById('containerPartesProjeto');
    containerPartes.innerHTML = '';

    modalEditar.show();

    // Consulta os detalhes profundos para reconstruir o formulário dinâmico de subpartes
    fetch(`../app/controllers/usuario/php/obter_detalhes_projeto.php?id=${id}`)
        .then(res => res.json())
        .then(dados => {
            if (dados.projeto && dados.projeto.partes) {
                dados.projeto.partes.forEach(parte => {
                    adicionarParteProjeto(parte.nome_parte, parte.cor, parte.material, parte.infill);
                });
            }
        });
}

function adicionarParteProjeto(nome = '', cor = '', material = 'PLA', infill = '20') {
    const container = document.getElementById('containerPartesProjeto');
    const index = container.children.length;

    const divParte = document.createElement('div');
    divParte.className = 'parte-card-dinamico border p-3 rounded mb-2 bg-light position-relative';
    divParte.innerHTML = `
        <button type="button" class="btn-close position-absolute top-0 end-0 m-2 row-remove-btn" onclick="this.parentElement.remove()" style="font-size: 0.75rem;"></button>
        <div class="row g-2">
            <div class="col-md-4">
                <label class="small fw-bold">Nome da Parte / Arquivo</label>
                <input type="text" class="form-control form-control-sm" name="partes[${index}][nome]" value="${nome}" required placeholder="Ex: Tampa_Suporte">
            </div>
            <div class="col-md-3">
                <label class="small fw-bold">Cor</label>
                <input type="text" class="form-control form-control-sm" name="partes[${index}][cor]" value="${cor}" required placeholder="Ex: Preto">
            </div>
            <div class="col-md-3">
                <label class="small fw-bold">Material</label>
                <select class="form-select form-select-sm" name="partes[${index}][material]">
                    <option value="PLA" ${material === 'PLA' ? 'selected' : ''}>PLA</option>
                    <option value="ABS" ${material === 'ABS' ? 'selected' : ''}>ABS</option>
                    <option value="PETG" ${material === 'PETG' ? 'selected' : ''}>PETG</option>
                    <option value="Flexível" ${material === 'Flexível' ? 'selected' : ''}>Flexível</option>
                </select>
            </div>
            <div class="col-md-2">
                <label class="small fw-bold">Infill (%)</label>
                <input type="number" class="form-control form-control-sm" name="partes[${index}][infill]" value="${infill}" min="0" max="100">
            </div>
        </div>
    `;
    container.appendChild(divParte);
}

function salvarAlteracoesProjeto(event) {
    if (event) event.preventDefault();

    const form = document.getElementById('formEditarProjeto');
    const formData = new FormData(form);

    // 1. Sincronização de nomes principais
    // Garantimos que os nomes batam com o que o PHP (e o SQL) esperam
    formData.set('editar_id', document.getElementById('editar_id').value);
    formData.set('editar_nome', document.getElementById('editar_nome').value);
    formData.set('editar_descricao', document.getElementById('editar_descricao').value);

    // 2. --- CORREÇÃO DAS PARTES (Conforme Tabela partes_pedido) ---
    // Removemos os nomes complexos (partes[0][nome]) para não confundir o PHP
    const nomesPartes = document.querySelectorAll('input[name*="[nome]"]');
    const materiaisPartes = document.querySelectorAll('select[name*="[material]"]');
    const coresPartes = document.querySelectorAll('input[name*="[cor]"]'); // Mudamos de infill para cor
    const quantidadesPartes = document.querySelectorAll('input[name*="[quantidade]"]');

    // Limpamos possíveis lixos do append anterior no FormData
    formData.delete('partes_nomes[]');
    formData.delete('partes_materiais[]');
    formData.delete('partes_cores[]');
    formData.delete('partes_quantidades[]');

    nomesPartes.forEach((el, i) => {
        if (el.value.trim() !== "") {
            formData.append('partes_nomes[]', el.value);
            formData.append('partes_materiais[]', materiaisPartes[i].value);
            formData.append('partes_cores[]', coresPartes[i] ? coresPartes[i].value : 'Padrão');
            formData.append('partes_quantidades[]', quantidadesPartes[i] ? quantidadesPartes[i].value : 1);
        }
    });

    fetch('../app/controllers/usuario/php/editar_projeto.php', {
        method: 'POST',
        body: formData 
    })
    .then(res => {
        if (!res.ok) throw new Error("Erro na rede ou servidor.");
        return res.json();
    })
    .then(retorno => {
        if (retorno.status === 'sucesso') {
            alert("Sucesso: " + retorno.mensagem);
            if (typeof modalEditar !== 'undefined') modalEditar.hide();
            carregarProjetos(); 
        } else {
            alert("Erro do Servidor: " + retorno.mensagem);
        }
    })
    .catch(err => {
        console.error("Erro na requisição:", err);
        alert("Erro técnico ao conectar com o servidor.");
    });
}

/* ==========================================================================
   4. EXCLUSÃO DE PROJETOS
   ========================================================================== */

function excluirProjeto(id) {
    if (!confirm("Deseja mesmo remover este projeto rascunho?")) return;

    fetch('../app/controllers/usuario/php/excluir_projeto.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: id }) // Envia como JSON
    })
    .then(res => res.json())
    .then(dados => {
        if (dados.status === 'sucesso') {
            // Se você usa uma função para listar os cards, chame-a aqui
            if (typeof carregarProjetos === 'function') {
                carregarProjetos();
            } else {
                location.reload(); // Recarrega a página se não tiver a função
            }
        } else {
            alert(dados.mensagem);
        }
    })
    .catch(err => {
        console.error("Erro na requisição:", err);
        alert("Erro técnico ao excluir. Verifique o console.");
    });
}

/* ==========================================================================
   5. UTILITÁRIOS AUXILIARES
   ========================================================================== */

// Procure por esta função lá no final do arquivo e mude para "obter":
function obterClasseStatus(status) {
    // Certifique-se que o status que vem do banco é exatamente igual a essas strings
    switch (status) {
        case 'AGUARDANDO_CONFIRMACAO': return 'analise';
        case 'ACEITO': return 'aceito';
        case 'EM_PRODUCAO': return 'producao';
        case 'CONCLUIDO': return 'concluido';
        case 'NEGADO': return 'negado';
        default: return 'bloqueado';
    }
}

function formatarData(dataBanco) {
    if (!dataBanco) return '--/--/----';
    // Converte a data do banco YYYY-MM-DD HH:MM:SS para DD/MM/YYYY
    const partes = dataBanco.split(' ')[0].split('-');
    if (partes.length !== 3) return dataBanco;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function gerarTimelineHtml(statusAtual) {
    const passos = [
        { chave: 'AGUARDANDO_CONFIRMACAO', label: 'Em Análise' },
        { chave: 'ACEITO', label: 'Aprovado / Aceito' },
        { chave: 'EM_PRODUCAO', label: 'Em Impressão 3D' },
        { chave: 'CONCLUIDO', label: 'Concluído' }
    ];

    let html = '<div class="timeline">';

    // Se estiver negado ou bloqueado, renderiza uma caixa de alerta direta substituindo a linha do tempo
    if (statusAtual === 'NEGADO' || statusAtual === 'BLOQUEADO') {
        return `
            <div class="alert alert-dark text-center py-3">
                <i class="bi bi-shield-x text-danger fs-3"></i><br>
                O fluxo regular deste projeto foi interrompido porque ele se encontra como <strong>${statusAtual.replace(/_/g, ' ')}</strong>.
            </div>`;
    }

    const indexAtual = passos.findIndex(p => p.chave === statusAtual);

    passos.forEach((passo, i) => {
        let classeItem = '';
        if (i < indexAtual) {
            classeItem = 'concluido';
        } else if (i === indexAtual) {
            classeItem = 'ativo';
        }

        html += `
            <div class="timeline-item ${classeItem}">
                <h6 class="mb-0 fw-bold">${passo.label}</h6>
                <p class="text-muted small">${i <= indexAtual ? 'Etapa processada ou em andamento' : 'Aguardando fases anteriores'}</p>
            </div>
        `;
    });

    html += '</div>';
    return html;
}