 async function verif() {
              const resp = await fetch("../config/verificar.php");
              const dados = await resp.json();
              
              if (!dados.logado) {
                alert("Você precisa estar logado!");
                window.location.href = "index.html";
              } else {
                console.log("Usuário logado:", dados.login);
              }
            }
            
            // nao sei se deixo no dom ja que nao está no header, mas deixarei
            window.addEventListener('DOMContentLoaded', () => {
              verif();
            });

// Espera o carregamento completo do DOM (estrutura HTML pronta)
document.getElementById("entrar").addEventListener('click',conta_red);


 async function conta_red() {
    const resposta= await fetch("../config/tipagem.php");
    const resp =  await resposta.json();
    const tipagem = resp.tipos;

    console.log(tipagem);

    switch(tipagem){
        case "cliente":     window.location.href = "index.php?rota=usuario_painel.html";
        break;
            // case "maker":     window.location.href = "../home/index_contaV.html";
            // break;
        case "admin":     window.location.href = "index.php?rota=admin-notificacoes.html";
        break;
    }
    // Redirecionando para outra página após o login

}


