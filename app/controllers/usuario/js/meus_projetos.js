document.addEventListener('DOMContentLoaded', () => {
    carregarProjetos();
});

async function carregarProjetos() {

    const container = document.querySelector('.cards-container');
    if (!container) return;

   const getStatusConfig = (status) => {
        const map = {
            AGUARDANDO_CONFIRMACAO: ['Em análise', 'analise'],
            ACEITO: ['Aceito', 'aceito'],
            EM_PRODUCAO: ['Em andamento', 'producao'],
            CONCLUIDO: ['Concluído', 'concluido'],
            NEGADO: ['Negado', 'negado']
        };

        const [texto, classe] = map[status] || ['Status desconhecido', 'analise'];
        return { texto, classe };
    };

    try {

        const resposta = await fetch('../app/controllers/usuario/php/meus_projetos_get.php');

        if (!resposta.ok) {
            throw new Error('Erro na requisição');
        }

        const retorno = await resposta.json();

        if (retorno.status !== 'ok') {

            container.innerHTML = `
                <div class="estado-vazio">
                    <i class="bi bi-folder2-open"></i>
                    <p>${retorno.mensagem || 'Nenhum projeto encontrado.'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = retorno.data.map(projeto => {

           
            let config;

            if (!projeto.status_pedido) {
                config = {
                    texto: 'Aguardando orçamento',
                    classe: 'analise'
                };
            } else {
                config = statusMap[projeto.status_pedido] || {
                    texto: 'Status desconhecido',
                    classe: 'analise'
                };
            }

            
            // DATA
            
            const dataFormatada = projeto.data_envio
                ? new Date(projeto.data_envio).toLocaleDateString('pt-BR')
                : 'Sem data';

            
            // VALOR
            
            const valorTotal = projeto.valor_total
                ? `<span>💰 Custo: R$ ${parseFloat(projeto.valor_total).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2
                })}</span>`
                : '';

            return `
                <div class="card projeto-card" data-status="${config.classe}">

                    <!-- IMAGEM -->
                    <div class="card-imagem">

                        <img src="/Printly/assets/img/default.png" alt="Projeto">

                        <span class="status ${config.classe}">
                            ${config.texto}
                        </span>

                    </div>

                    <!-- HEADER -->
                    <div class="card-header">

                        <div class="card-icon">
                            <i class="bi bi-box-seam"></i>
                        </div>

                        <h5>${projeto.nome_projeto}</h5>

                    </div>

                    <!-- BODY -->
                    <div class="card-body">

                        <p class="desc">
                            ${projeto.descricao || 'Sem descrição'}
                        </p>

                        <div class="informacoes">

                            <span>📁 Formato: ${projeto.formato || 'Arquivo'}</span>

                            ${valorTotal}

                            ${projeto.maker_nome ? `
                                <span>🖨️ Fabricante: ${projeto.maker_nome}</span>
                            ` : ''}

                            <span>📅 Data: ${dataFormatada}</span>
                            

                        </div>

                        ${projeto.motivo_recusa ? `
                            <div class="feedback-maker">
                                <strong>Feedback:</strong>
                                ${projeto.motivo_recusa}
                            </div>
                        ` : ''}

                        <!-- AÇÕES -->
                        <div class="acoes">

                            <button class="btn-ver" onclick="verProjeto(${projeto.id})">
                                Ver
                            </button>

                            <button class="btn-editar" onclick="editarProjeto(${projeto.id})">
                                Editar
                            </button>
                            <button class="btn-chat" onclick="excluirProjeto(${projeto.id})">
                                Chat
                            </button>

                            <button class="btn-danger" onclick="excluirProjeto(${projeto.id})">
                                Excluir
                            </button>

                            

                        </div>

                    </div>

                </div>
            `;
        }).join('');

    } catch (erro) {

        console.error('Erro ao carregar projetos:', erro);

        container.innerHTML = `
            <div class="estado-vazio">
                <i class="bi bi-exclamation-triangle"></i>
                <p>Falha ao carregar projetos. Tente novamente.</p>
            </div>
        `;
    }
}