document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("entrar").addEventListener("click", login);
});

async function login(){
    var email = document.getElementById("email").value;
    var senha = document.getElementById("senha").value;

    if(!email || !senha){
        alert("Preencha todos os campos!");
        return;
    }

    const fd = new FormData();
    fd.append("email", email);
    fd.append("senha", senha);

    try {
        const retorno = await fetch("../app/controllers/usuario/php/login.php", {
            method: "POST",
            body: fd
        });

        // Tenta ler como JSON direto
        const resposta = await retorno.json();
        console.log("RESPOSTA:", resposta);

        if(resposta.status == "ok"){
            // Redireciona baseado no tipo de perfil (opcional, mas útil)
           await conta_red();
        } else {
            alert(resposta.mensagem);
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro ao conectar com o servidor.");
    }
}

 async function conta_red() {
    const resposta= await fetch("../app/controllers/usuario/php/tipagem.php");
    const resp =  await resposta.json();
    const tipagem = resp.tipos;

    console.log(tipagem);

    switch(tipagem) {
        case "CLIENTE": window.location.href = "index.php?rota=usuario-painel"; 
        break;
        case "MAKER": window.location.href = "index.php?rota=fabricante-painel"; 
        break;
        // case "maker":   window.location.href = "/index.php?rota=usuario-painel"; break;
        case "ADMIN":   window.location.href = "index.php?rota=admin-usuarios"; 
        break;
        default:        window.location.href = "index.php?rota=home";
         break;
    }
    // Redirecionando para outra página após o login
    }
