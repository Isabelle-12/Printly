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
                <td>${fab.id}</td>
                <td>${fab.nome}</td>
                <td>${fab.cnpj || 'N/A'}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick='verPerfilFabricante(${JSON.stringify(fab)})' data-bs-toggle="modal" data-bs-target="#modalPerfil">Ver</button>
                    <button class="btn btn-warning btn-sm">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="excluirUsuario(${fab.id})">Excluir</button>
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
        <p><strong>Nome:</strong> ${fabricante.nome}</p>
        <p><strong>Email:</strong> ${fabricante.email}</p>
        <p><strong>CNPJ:</strong> ${fabricante.cnpj}</p>
        <p><strong>Telefone Comercial:</strong> ${fabricante.telefone_comercial}</p>
        <p><strong>Endereço da Empresa:</strong> ${fabricante.endereco_empresa}</p>
        <p><strong>Data de Aprovação:</strong> ${fabricante.data_aprovacao}</p>
    `;
}
function verPerfilAdministrador(administrador) {
    document.getElementById("conteudoModal").innerHTML = `
        <p><strong>Nome:</strong> ${administrador.nome}</p>
        <p><strong>Email:</strong> ${administrador.email}</p>
        <p><strong>Senha:</strong> ${administrador.senha}</p>
        <p><strong>Telefone:</strong> ${administrador.telefone}</p>
        <p><strong>CEP:</strong> ${administrador.cep}</p>
        <p><strong>Cidade:</strong> ${administrador.cidade}</p>
        <p><strong>Estado:</strong> ${administrador.estado}</p>
        <p><strong>Endereço:</strong> ${administrador.endereco}</p>
        <p><strong>Status:</strong> ${administrador.status}</p>
        <p><strong>Data de Cadastro:</strong> ${administrador.data_cadastro}</p>
    `;
}