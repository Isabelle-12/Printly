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
                    <button class="btn btn-warning btn-sm">Editar</button>
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
                    <button class="btn btn-warning btn-sm">Editar</button>
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

function verPerfil(u) {
    document.getElementById("conteudoModal").innerHTML = `
        <p><strong>Nome:</strong> ${u.nome}</p>
        <p><strong>Email:</strong> ${u.email}</p>
        <p><strong>Cidade:</strong> ${u.cidade || 'N/I'}</p>
        <p><strong>Status:</strong> <span class="badge bg-info">${u.status}</span></p>
        <p><strong>Perfil:</strong> ${u.tipo_perfil}</p>
    `;
}

function verPerfilFabricante(f) {
    document.getElementById("conteudoModal").innerHTML = `
        <p><strong>Nome:</strong> ${f.nome}</p>
        <p><strong>CNPJ:</strong> ${f.cnpj}</p>
        <p><strong>Telefone:</strong> ${f.telefone_comercial}</p>
        <p><strong>Endereço:</strong> ${f.endereco_empresa}</p>
    `;
}

function verPerfilAdministrador(a) {
    document.getElementById("conteudoModal").innerHTML = `
        <p><strong>Nome:</strong> ${a.nome}</p>
        <p><strong>Email:</strong> ${a.email}</p>
        <p><strong>Perfil:</strong> ADMINISTRADOR</p>
    `;
}