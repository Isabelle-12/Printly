document.addEventListener('DOMContentLoaded', () => {

    carregarDadosMaker();
    configurarUpload();
    configurarFormulario();
    
});

let contadorPartes = 0;
let materiaisMaker = [];

/* ───────────────────────────── */
/* CARREGAR MAKER */
/* ───────────────────────────── */

async function carregarDadosMaker(){
    

    const params = new URLSearchParams(window.location.search);

    const makerId = params.get('maker_id');

    if(!makerId){
        alert('Fabricante não encontrado.');
        window.location.href = 'index.php?rota=listagem-maker';
        return;
    }

    document.getElementById('maker_id').value = makerId;

    try{

        const response = await fetch(
            `../app/controllers/fabricante/php/detalhes_portfolio_get.php?id=${makerId}`
        );

        const text = await response.text();

        let data;

        try{
            data = JSON.parse(text);
        }catch{
            console.error(text);
            throw new Error('Resposta inválida do servidor');
        }

        if(!data.sucesso){
            throw new Error(data.mensagem);
        }

        preencherMaker(data);

    }catch(err){

        console.error(err);

        alert(err.message);
    }
}

function preencherMaker(data){

    const maker = data.maker;

    materiaisMaker = data.materiais || [];

    document.getElementById('makerNome').textContent =
        maker.nome_empresa || maker.nome || 'Maker';

    document.getElementById('makerCidade').textContent =
        `${maker.cidade || '—'} ${maker.estado ? '- ' + maker.estado : ''}`;

    document.getElementById('makerAvaliacoes').innerHTML =
        gerarEstrelas(maker.media_nota);

    const foto = document.getElementById('makerFoto');

    if(maker.foto_perfil){

        foto.src = `../${maker.foto_perfil}`;

    }else{

        foto.src =
            'https://ui-avatars.com/api/?name=' +
            encodeURIComponent(maker.nome || 'Maker');
    }

    const materiaisContainer =
        document.getElementById('makerMateriais');

    materiaisContainer.innerHTML = '';

    if(materiaisMaker.length === 0){

        materiaisContainer.innerHTML = `
            <span class="badge-material">
                Nenhum material cadastrado
            </span>
        `;

        return;
    }

    materiaisMaker.forEach(material => {

        materiaisContainer.innerHTML += `
            <span class="badge-material">
                ${material.tipo_material}
            </span>
        `;
    });
    configurarPartes();
    atualizarResumo();
}

function gerarEstrelas(nota){

    const n = parseFloat(nota) || 0;

    return Array.from({ length: 5 }, (_, i) => {

        if(i < Math.floor(n)){
            return '<span class="estrela cheia">★</span>';
        }

        if(i < n){
            return '<span class="estrela meia">★</span>';
        }

        return '<span class="estrela vazia">☆</span>';

    }).join('');
}

/* ───────────────────────────── */
/* UPLOAD */
/* ───────────────────────────── */

function configurarUpload(){

    const input = document.getElementById('arquivo_3d');

    input.addEventListener('change', () => {

        const arquivo = input.files[0];

        if(!arquivo) return;

        const extensoesPermitidas = [
            'stl',
            'obj',
            'png'
        ];

        const extensao =
            arquivo.name
                .split('.')
                .pop()
                .toLowerCase();

        if(!extensoesPermitidas.includes(extensao)){

            alert(
                'Formato inválido. Utilize STL, OBJ ou PNG.'
            );

            input.value = '';

            return;
        }

        const uploadArea =
            document.querySelector('.upload-area p');

        uploadArea.innerHTML = `
            Arquivo selecionado:
            <strong>${arquivo.name}</strong>
        `;
    });
}

/* ───────────────────────────── */
/* PARTES */
/* ───────────────────────────── */

function configurarPartes(){

    document
        .getElementById('btnAdicionarParte')
        .addEventListener('click', adicionarParte);

    adicionarParte();
}

function adicionarParte(){

    contadorPartes++;

    const template =
        document.getElementById('templateParte');

    const clone =
        template.content.cloneNode(true);

    const card = clone.querySelector('.parte-card');

    card.dataset.index = contadorPartes;

    card.querySelector('h5').textContent =
        `Parte ${contadorPartes}`;

    const select =
        card.querySelector('.material-parte');

    // limpa antes
    select.innerHTML = '';

    if (materiaisMaker && materiaisMaker.length > 0) {

        materiaisMaker.forEach(material => {
            select.innerHTML += `
                <option value="${material.tipo_material}">
                    ${material.tipo_material}
                </option>
            `;
        });

    } else {

        select.innerHTML = `
            <option value="">
                Nenhum material disponível
            </option>
        `;
    }

    configurarRemocaoParte(card);
    configurarAtualizacaoResumo(card);

    document
        .getElementById('containerPartes')
        .appendChild(clone);

    atualizarResumo();
}


function configurarRemocaoParte(card){

    card
        .querySelector('.btn-remover-parte')
        .addEventListener('click', () => {

            card.remove();

            atualizarResumo();

            renumerarPartes();
        });
}

function configurarAtualizacaoResumo(card){

    const campos = card.querySelectorAll('input, select');

    campos.forEach(campo => {

        campo.addEventListener('input', atualizarResumo);
    });
}

function renumerarPartes(){

    const cards =
        document.querySelectorAll('.parte-card');

    cards.forEach((card, index) => {

        card.querySelector('h5').textContent =
            `Parte ${index + 1}`;
    });
}

/* ───────────────────────────── */
/* RESUMO */
/* ───────────────────────────── */

function atualizarResumo(){

    const partes =
        document.querySelectorAll('.parte-card');

    document.getElementById('resumoPartes').textContent =
        partes.length;

    let quantidadeTotal = 0;

    partes.forEach(parte => {

        const quantidade =
            parseInt(
                parte.querySelector('.quantidade-parte').value
            ) || 0;

        quantidadeTotal += quantidade;
    });

    document.getElementById('resumoQuantidade').textContent =
        quantidadeTotal;
}

/* ───────────────────────────── */
/* FORMULÁRIO */
/* ───────────────────────────── */

function configurarFormulario(){

    document
        .getElementById('formPedido')
        .addEventListener('submit', enviarFormulario);
}

async function enviarFormulario(e){

    e.preventDefault();

    if(!validarFormulario()){
        return;
    }

    const botao =
        document.getElementById('btnEnviarPedido');

    const textoOriginal = botao.innerHTML;

    botao.disabled = true;

    botao.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2"></span>
        Enviando...
    `;

    try{

        const formData = montarFormData();

        const response = await fetch(
            '../app/controllers/usuario/php/criar_pedido_post.php',
            {
                method: 'POST',
                body: formData
            }
        );

        const text = await response.text();

        let data;

        try{
            data = JSON.parse(text);
        }catch{
            console.error(text);
            throw new Error('Resposta inválida do servidor');
        }

        if(!data.sucesso){
            throw new Error(data.mensagem);
        }

        alert('Pedido enviado com sucesso!');

        window.location.href =
            'index.php?rota=meus_projetos';

    }catch(err){

        console.error(err);

        alert(err.message);

    }finally{

        botao.disabled = false;

        botao.innerHTML = textoOriginal;
    }
}

/* ───────────────────────────── */
/* VALIDAÇÃO */
/* ───────────────────────────── */

function validarFormulario(){

    limparErros();

    let valido = true;

    const camposObrigatorios = [

        'nome_projeto',
        'descricao',
        'quantidade',
        'prazo',
        'endereco'
    ];

    camposObrigatorios.forEach(id => {

        const campo = document.getElementById(id);

        if(!campo.value.trim()){

            marcarErro(campo);

            valido = false;
        }
    });

    const arquivo =
        document.getElementById('arquivo_3d');

    if(!arquivo.files.length){

        marcarErro(arquivo);

        valido = false;
    }

    const partes =
        document.querySelectorAll('.parte-card');

    if(partes.length === 0){

        alert('Adicione ao menos uma parte.');

        return false;
    }

    partes.forEach(parte => {

        const nome =
            parte.querySelector('.nome-parte');

        const descricao =
            parte.querySelector('.descricao-parte');

        const material =
            parte.querySelector('.material-parte');

        const cor =
            parte.querySelector('.cor-parte');

        if(!nome.value.trim()){

            marcarErro(nome);

            valido = false;
        }

        if(!descricao.value.trim()){

            marcarErro(descricao);

            valido = false;
        }

        if(!material.value){

            marcarErro(material);

            valido = false;
        }

        if(!cor.value.trim()){

            marcarErro(cor);

            valido = false;
        }
    });

    if(!valido){

        alert(
            'Preencha todos os campos obrigatórios.'
        );
    }

    return valido;
}

function marcarErro(campo){

    campo.classList.add('is-invalid');
}

function limparErros(){

    document
        .querySelectorAll('.is-invalid')
        .forEach(campo => {

            campo.classList.remove('is-invalid');
        });
}

/* ───────────────────────────── */
/* MONTAR FORMDATA */
/* ───────────────────────────── */

function montarFormData(){

    const formData = new FormData();

    formData.append(
        'maker_id',
        document.getElementById('maker_id').value
    );

    formData.append(
        'nome_projeto',
        document.getElementById('nome_projeto').value
    );

    formData.append(
        'descricao',
        document.getElementById('descricao').value
    );

    formData.append(
        'quantidade',
        document.getElementById('quantidade').value
    );

    formData.append(
        'prazo',
        document.getElementById('prazo').value
    );

    formData.append(
        'endereco',
        document.getElementById('endereco').value
    );

    formData.append(
        'observacoes',
        document.getElementById('observacoes').value
    );

    formData.append(
        'arquivo_3d',
        document.getElementById('arquivo_3d').files[0]
    );

    const partes = [];

    document
        .querySelectorAll('.parte-card')
        .forEach(parte => {

            partes.push({

                nome:
                    parte.querySelector('.nome-parte').value,

                descricao:
                    parte.querySelector('.descricao-parte').value,

                material:
                    parte.querySelector('.material-parte').value,

                cor:
                    parte.querySelector('.cor-parte').value,

                quantidade:
                    parte.querySelector('.quantidade-parte').value
            });
        });

    formData.append(
        'partes',
        JSON.stringify(partes)
    );

    return formData;
}