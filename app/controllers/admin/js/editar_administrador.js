document.addEventListener("DOMContentLoaded", async () => {
    await verif();
    carregarUsuario();

    document.getElementById("formEditarUsuario").addEventListener("submit", function(e) {
        e.preventDefault();
        salvarAlteracoes();
    });
});

async function carregarUsuario() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    if (!id) {
        alert("ID do usuário não fornecido.");
        window.location.href = "index.php?rota=admin-usuarios";
        return;
    }
    
    try {
       const retorno = await fetch(`../app/controllers/admin/administrador_get.php?id=${id}&t=${Date.now()}`);
        const resposta = await retorno.json(); 

        
        if (resposta.status === "ok") {
            const user = resposta.data[0];
            document.getElementById("id").value = user.id;
            document.getElementById("nome").value = user.nome;
            document.getElementById("email").value = user.email;
            document.getElementById("documento").value = user.documento;
            document.getElementById("endereco").value = user.endereco;
            document.getElementById("telefone").value = user.telefone;
            document.getElementById("cep").value = user.cep;
            document.getElementById("cidade").value = user.cidade;
            document.getElementById("estado").value = user.estado;
            document.getElementById("tipo_perfil").value = user.tipo_perfil;
        } else {
            alert("Erro ao carregar usuário: " + resposta.mensagem);
        }
    } catch (err) {
        console.error(err);
        alert("Erro ao carregar dados do usuário.");
    }
}

function salvarAlteracoes() {
    const id = document.getElementById("id").value;
    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const documento = document.getElementById("documento").value;
    const endereco = document.getElementById("endereco").value;
    const telefone = document.getElementById("telefone").value;
    const cep = document.getElementById("cep").value;
    const cidade = document.getElementById("cidade").value;
    const estado = document.getElementById("estado").value;
    const tipo_perfil = document.getElementById("tipo_perfil").value;
    const nova_senha = document.getElementById("nova_senha").value;
    const confirmar_senha = document.getElementById("confirmar_senha").value;

    if (!email.includes("@")) {
        alert("O e-mail deve conter @");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("O formato do e-mail está incorreto!");
        return;
    }

    if (nova_senha && nova_senha !== confirmar_senha) {
        alert("As senhas não coincidem!");
        return;
    }

    const fd = new FormData();
    fd.append("id", id);
    fd.append("nome", nome);
    fd.append("email", email);
    fd.append("documento", documento);
    fd.append("endereco", endereco);
    fd.append("telefone", telefone);
    fd.append("cep", cep);
    fd.append("cidade", cidade);
    fd.append("estado", estado);
    fd.append("tipo_perfil", tipo_perfil);
    fd.append("nova_senha", nova_senha);

    fetch("../app/controllers/admin/editar_usuarios.php", { method: "POST", body: fd, credentials: 'same-origin'})
        .then(resp => resp.json())
        .then(res => {
            if (res.status === "ok") {
                alert("Usuário atualizado com sucesso!");
                window.location.href = "index.php?rota=admin-usuarios";
            } else {
                alert("Erro ao atualizar usuário: " + res.mensagem);
            }
        })
        .catch(err => {
            console.error("Erro detectado:", err);
            alert("Erro ao carregar dados");
        });
}