async function verif() {
    const resp = await fetch("../config/verificar.php");
    const dados = await resp.json();

    if (!dados.logado) {
        alert("Você precisa estar logado!");
        window.location.href = "index.php?rota=login";
    }


    const acesso = document.body.getAttribute("data-acesso");
    
    if (acesso && !acesso.split(",").includes(dados.tipos)) {
        alert("Você não tem permissão para acessar esta página.");
        window.location.href = "index.php?rota=home";
        return;
    }
    

    
    console.log("Usuário logado:", dados.email);
}

  async function sair() {
  await fetch("../config/logout.php");

  alert('Saindo...');

  window.location.href = "index.php?rota=home";


}

// nao sei se deixo no dom ja que nao está no header, mas deixarei
window.addEventListener('DOMContentLoaded', () => {
    verif();
    document.getElementById("sair").addEventListener("click", sair);

});








