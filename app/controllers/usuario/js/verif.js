 async function verif() {
              const resp = await fetch("verificar.php");
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