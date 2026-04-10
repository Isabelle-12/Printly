    async function verif() {
        const resp = await fetch("../config/verificar.php");
        const dados = await resp.json();

        if (!dados.logado) {
            alert("Você precisa estar logado!");
            window.location.href = "index.php?rota=login";
        }

       if (dados.tipos === "CLIENTE") {

        document.getElementById("notif")?.classList.add("d-none");
        document.getElementById("usuario")?.classList.add("d-none");
    }
       if (dados.tipos === "MAKER") {

        document.getElementById("notif")?.classList.add("d-none");
        document.getElementById("painelM")?.classList.add("d-none");
    }

        if (dados.tipos === "CLIENTE") {
            const card  = document.getElementById("card-virar-maker");
            const corpo = document.getElementById("card-maker-corpo");

            if (card && corpo) {
                const status = dados.status_fabricante; 

                if (status === "NAO_SOLICITADO" || status === "REJEITADO") {
                    // mostra o botão para solicitar
                    corpo.innerHTML = `
                        <p class="text-muted">
                            Cadastre suas impressoras e materiais e comece a receber pedidos de impressão 3D!
                        </p>
                        ${status === "REJEITADO" 
                            ? '<div class="alert alert-danger py-2 mb-3"><i class="bi bi-x-circle me-1"></i>Sua solicitação anterior foi <strong>recusada</strong>. Você pode tentar novamente.</div>' 
                            : ''}
                        <a href="index.php?rota=solicitar-maker" class="btn btn-primary">
                            <i class="bi bi-send me-1"></i> Solicitar ser Maker
                        </a>`;
                    card.style.display = "block";

                } else if (status === "PENDENTE") {
                    // mostra mensagem de aguardando análise
                    corpo.innerHTML = `
                        <div class="alert alert-warning py-2 mb-0">
                            <i class="bi bi-clock me-1"></i>
                            Sua solicitação de Maker está <strong>em análise</strong>. 
                            Aguarde a resposta dos administradores.
                        </div>`;
                    card.style.display = "block";

                } else if (status === "APROVADO") {
                    // já é maker (não mostra nada)
                    card.style.display = "none";
                }
            }
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
    if (confirm('Deseja realmente sair?')) {
    await fetch('../config/logout.php');
        alert('Saindo...');

        window.location.href = "index.php?rota=login";
    }



    }

    // nao sei se deixo no dom ja que nao está no header, mas deixarei
    window.addEventListener('DOMContentLoaded', () => {
        verif();
        const btnSair = document.getElementById("sair");
        if (btnSair) {
            btnSair.addEventListener("click", sair);
        }
    });






