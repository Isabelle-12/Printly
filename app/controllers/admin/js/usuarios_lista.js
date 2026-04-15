document.addEventListener("DOMContentLoaded", () => {
    // Carrega todas as tabelas ao iniciar a página
    buscar();
    buscarFabricantes();
    buscarAdministrador();
    buscarSolicitacoes();
});

// --- FUNÇÕES DE BUSCA (GET) ---

async function buscar() {
    const retorno = await fetch("../app/controllers/admin/usuario_get.php");
    const resposta = await retorno.json();

    if (resposta.status === "ok") {
        preencherTabela(resposta.data);
    } else {
        document.getElementById("listaUsuarios").innerHTML = '<tr><td colspan="4" class="text-center">Nenhum usuário encontrado</td></tr>';
    }
}

async function buscarFabricantes() {
    const retorno = await fetch("../app/controllers/admin/fabricante_get.php");
    const resposta = await retorno.json();

    if (resposta.status === "ok") {
        preencherTabelaFabricante(resposta.data);
    } else {
        document.getElementById("listaFabricantes").innerHTML = '<tr><td colspan="4" class="text-center">Nenhum fabricante encontrado</td></tr>';
    }
}

async function buscarAdministrador() {
    const retorno = await fetch("../app/controllers/admin/administrador_get.php");
    const resposta = await retorno.json();

    if (resposta.status === "ok") {
        preencherTabelaAdministrador(resposta.data);
    } else {
        document.getElementById("listaAdinistradores").innerHTML = '<tr><td colspan="4" class="text-center">Nenhum administrador encontrado</td></tr>';
    }
}

// BUSCAR SOLICITAÇÕES PENDENTES (O SEU PBI ATUAL)
async function buscarSolicitacoes() {
    const retorno = await fetch("../app/controllers/admin/solicitacoes_get.php");
    const resposta = await retorno.json();
    const badge = document.getElementById("badgePendentes");

    if (resposta.status === "ok") {
        badge.innerText = resposta.data.length;
        preencherTabelaSolicitacoes(resposta.data);
    } else {
        badge.innerText = "0";
        document.getElementById("listaSolicitacoes").innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhuma solicitação pendente no momento.</td></tr>';
    }
}

// --- FUNÇÕES DE AÇÃO (EXCLUIR / VALIDAR) ---

async function excluirUsuario(id) {
    if (!confirm("Deseja realmente excluir este usuário?")) return;

    const response = await fetch(`../app/controllers/admin/usuario_excluir.php?id=${id}`);
    const resultado = await response.json();
    alert(resultado.mensagem);

    // Atualiza todas as listas
    buscar();
    buscarFabricantes();
    buscarAdministrador();
    buscarSolicitacoes();
}

// --- FUNÇÕES DE AÇÃO (EDITAR / VALIDAR) ---

function editarUsuario(id) {
    window.location.href = "index.php?rota=editar-usuario&id=" + id;
}

function editarAdmin(id) {
    window.location.href = "index.php?rota=editar-administrador&id=" + id;
}

function editarFabricante(id) {
    window.location.href = "index.php?rota=editar-fabricante&id=" + id;
}

//FUNÇÃO DE AÇÃO (RESETAR SENHA)
async function resetarSenha(usuarioId) {
    if (!confirm("Deseja realmente resetar a senha deste usuário?")) return;

    try {
        const formData = new FormData();
        formData.append("usuario_id", usuarioId);

        const response = await fetch("../app/controllers/admin/reset_admin.php", {
            method: "POST",
            body: formData
        });

        // --- ADICIONE ISSO AQUI PARA PEGAR O ERRO ---
        const textoErro = await response.text();
        console.log("ERRO NO RESET:", textoErro); 
        const resultado = JSON.parse(textoErro);
        // --------------------------------------------

        if (resultado.status === "ok") {
            alert("E-mail de redefinição enviado com sucesso!");
        } else {
            alert("Erro: " + resultado.mensagem);
        }

    } catch (erro) {
        console.error("Erro detalhado:", erro);
        alert("Ocorreu um erro técnico. Verifique o console (F12).");
    }
}

async function validarFabricante(id, decisao) {
    const acao = decisao === 'aprovar' ? 'APROVAR' : 'REJEITAR';
    if (!confirm(`Deseja realmente ${acao} este cadastro de fabricante?`)) return;

    const response = await fetch(`../app/controllers/admin/fabricante_validar.php?id=${id}&decisao=${decisao}`);
    const resultado = await response.json();

    alert(resultado.mensagem);

    // Atualiza as tabelas afetadas
    buscarFabricantes();
    buscarSolicitacoes();
}

// --- PREENCHER TABELAS (MANIPULAÇÃO DE DOM) ---

function preencherTabela(lista) {
    let html = "";
    lista.forEach(usuario => {
        html += `
            <tr>
                <td>${usuario.id}</td>
                <td>${usuario.nome}</td>
                <td>${usuario.email}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick='verPerfil(${JSON.stringify(usuario)})' data-bs-toggle="modal" data-bs-target="#modalPerfil">Ver</button>
                    <button class="btn btn-warning btn-sm" onclick="editarUsuario(${usuario.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="excluirUsuario(${usuario.id})">Excluir</button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="resetarSenha(${usuario.id})">Resetar Senha</button>
                </td>
            </tr>`;
    });
    document.getElementById("listaUsuarios").innerHTML = html;
}

function preencherTabelaFabricante(lista) {
    let html = "";
    lista.forEach(fab => {
        html += `
            <tr>
                <td>${fab.usuario_id}</td> 
                <td>${fab.nome}</td>
                <td>${fab.cnpj || 'N/A'}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick='verPerfilFabricante(${JSON.stringify(fab)})' data-bs-toggle="modal" data-bs-target="#modalPerfil">Ver</button>
                    <button class="btn btn-warning btn-sm" onclick="editarFabricante(${fab.usuario_id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="excluirUsuario(${fab.usuario_id})">Excluir</button>
                </td>
            </tr>`;
    });
    document.getElementById("listaFabricantes").innerHTML = html;
}

function preencherTabelaAdministrador(lista) {
    let html = "";
    lista.forEach(adm => {
        html += `
            <tr>
                <td>${adm.id}</td>
                <td>${adm.nome}</td>
                <td>${adm.email}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick='verPerfilAdministrador(${JSON.stringify(adm)})' data-bs-toggle="modal" data-bs-target="#modalPerfil">Ver</button>
                    <button class="btn btn-warning btn-sm" onclick="editarAdmin(${adm.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="excluirUsuario(${adm.id})">Excluir</button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="resetarSenha(${adm.id})">Resetar Senha</button>
                </td>
            </tr>`;
    });
    document.getElementById("listaAdinistradores").innerHTML = html;
}

function preencherTabelaSolicitacoes(lista) {
    let html = "";
    lista.forEach(sol => {
        html += `
            <tr>
                <td>${sol.nome}</td>
                <td>${sol.cidade || 'N/I'}</td>
                <td>${sol.impressora || 'Pendente'}</td>
                <td>${sol.materiais || 'Pendente'}</td>
                <td>
                    <button class="btn btn-success btn-sm me-1" onclick="validarFabricante(${sol.id}, 'aprovar')">Aprovar</button>
                    <button class="btn btn-danger btn-sm" onclick="validarFabricante(${sol.id}, 'rejeitar')">Rejeitar</button>
                    <button class="btn btn-primary btn-sm" onclick='verInfoSolicitacao(${JSON.stringify(sol)})' data-bs-toggle="modal" data-bs-target="#modalPerfil">Ver</button>
                </td>
            </tr>`;
    });
    document.getElementById("listaSolicitacoes").innerHTML = html;
}

// --- MODAIS DE VISUALIZAÇÃO ---

function verPerfil(usuario) {
    document.getElementById("conteudoModal").innerHTML = `
        <p><strong>Nome:</strong> ${usuario.nome}</p>
        <p><strong>Email:</strong> ${usuario.email}</p>
        <p><strong>Senha:</strong> ${usuario.senha}</p>
        <p><strong>Telefone:</strong> ${usuario.telefone}</p>
        <p><strong>Documento:</strong> ${usuario.documento || 'Não informado'}</p>
        <p><strong>CEP:</strong> ${usuario.cep}</p>
        <p><strong>Cidade:</strong> ${usuario.cidade}</p>
        <p><strong>Estado:</strong> ${usuario.estado}</p>
        <p><strong>Endereço:</strong> ${usuario.endereco}</p>
        <p><strong>Status:</strong> ${usuario.status}</p>
        <p><strong>Data de Cadastro:</strong> ${usuario.data_cadastro}</p>
    `;
}

function verPerfilFabricante(fabricante) {
    document.getElementById("conteudoModal").innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>Nome:</strong> ${fabricante.nome}</p>
                <p><strong>Email:</strong> ${fabricante.email}</p>
                <p><strong>CNPJ:</strong> ${fabricante.cnpj || 'Não informado'}</p>
                <p><strong>Telefone Comercial:</strong> ${fabricante.telefone_comercial || 'Não informado'}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Data de Aprovação:</strong> ${fabricante.data_aprovacao || 'Pendente'}</p>
                <p><strong>Endereço da Empresa:</strong> ${fabricante.endereco_empresa || 'Não informado'}</p>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-12">
                <p><strong>Impressoras:</strong> <span class="badge bg-primary text-wrap">${fabricante.impressoras || 'Nenhuma cadastrada'}</span></p>
                <p><strong>Materiais:</strong> <span class="badge bg-success text-wrap">${fabricante.materiais || 'Nenhum cadastrado'}</span></p>
            </div>
        </div>
    `;
}
function verPerfilAdministrador(administrador) {
    document.getElementById("conteudoModal").innerHTML = `
        <p><strong>Nome:</strong> ${administrador.nome}</p>
        <p><strong>Email:</strong> ${administrador.email}</p>
        <p><strong>Senha:</strong> ${administrador.senha}</p>
        <p><strong>Telefone:</strong> ${administrador.telefone}</p>
        <p><strong>Documento:</strong> ${administrador.documento || 'Não informado'}</p>
        <p><strong>CEP:</strong> ${administrador.cep}</p>
        <p><strong>Cidade:</strong> ${administrador.cidade}</p>
        <p><strong>Estado:</strong> ${administrador.estado}</p>
        <p><strong>Endereço:</strong> ${administrador.endereco}</p>
        <p><strong>Status:</strong> ${administrador.status}</p>
        <p><strong>Data de Cadastro:</strong> ${administrador.data_cadastro}</p>
    `;
}
function verInfoSolicitacao(sol) {
    document.getElementById("conteudoModal").innerHTML = `
    <h5 class="border-bottom pb-2">Dados do Solicitante</h5>
        <p><strong>Nome:</strong> ${sol.nome}</p>
        <p><strong>E-mail:</strong> ${sol.email || 'Não informado'}</p>
        <p><strong>Telefone:</strong> ${sol.telefone || 'Não informado'}</p>
        <p><strong>Cidade/Estado:</strong> ${sol.cidade} - ${sol.estado}</p>
        <p><strong>Endereço:</strong> ${sol.endereco}</p>
        
        <h5 class="border-bottom pb-2 mt-3">Equipamento e Materiais</h5>
        <p><strong>Impressora:</strong> ${sol.impressora || 'Não informada'}</p>
        <p><strong>Materiais:</strong> ${sol.materiais || 'Não informados'}</p>
        <p><strong>CNPJ:</strong> ${sol.cnpj || 'Pessoa Física'}</p>
    `;
}