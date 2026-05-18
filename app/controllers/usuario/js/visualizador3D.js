
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
import { STLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/STLLoader.js/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm';
import { OBJLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/OBJLoader.js/+esm';

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────
const TAMANHO_MAXIMO_MB = 100;
const TAMANHO_MAXIMO_BYTES = TAMANHO_MAXIMO_MB * 2048 * 2048;
const FORMATOS_ACEITOS = ['stl', 'obj'];

// ─────────────────────────────────────────────
// Referências DOM
// ─────────────────────────────────────────────
const uploadZone = document.getElementById('uploadZone');
const inputArquivo = document.getElementById('inputArquivo3D');
const btnSelecionar = document.getElementById('btnSelecionarArquivo');
const alertaErro = document.getElementById('alertaErroArquivo');
const msgErro = document.getElementById('msgErroArquivo');

const viewerWrapper = document.getElementById('viewerWrapper');
const canvas = document.getElementById('canvasVisualizador3D');
const placeholder = document.getElementById('placeholderVisualizador');
const loadingEl = document.getElementById('loadingVisualizador');
const erroViewer = document.getElementById('erroVisualizador');
const msgErroViewer = document.getElementById('msgErroVisualizador');

const btnResetarCamera = document.getElementById('btnResetarCamera');
const btnToggleGrid = document.getElementById('btnToggleGrid');
const btnToggleWireframe = document.getElementById('btnToggleWireframe');

const infoNome = document.getElementById('infoNomeArquivo');
const infoTamanho = document.getElementById('infoTamanhoArquivo');
const infoFormato = document.getElementById('infoFormato');

let renderer, scene, camera, controls;
let modeloAtual = null;
let gridHelper = null;
let gridVisivel = true;
let wireframeAtivo = false;
let cameraInicial = { position: null, target: null };
let threeIniciado = false;


function mostrarErroArquivo(msg) {
    msgErro.textContent = msg;
    alertaErro.style.display = 'block';
}

function ocultarErroArquivo() {
    alertaErro.style.display = 'none';
}

function mostrarLoading() {
    loadingEl.classList.add('ativo');
    erroViewer.classList.remove('ativo');
    placeholder.style.display = 'none';
}

function ocultarLoading() {
    loadingEl.classList.remove('ativo');
}

function mostrarErroViewer(msg) {
    ocultarLoading();
    msgErroViewer.textContent = msg || 'Não foi possível renderizar o modelo.';
    erroViewer.classList.add('ativo');
    placeholder.style.display = 'none';
}

function ocultarErroViewer() {
    erroViewer.classList.remove('ativo');
}

function formatarTamanho(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function preencherInfos(arquivo, extensao) {
    infoNome.textContent = arquivo.name;
    infoTamanho.textContent = formatarTamanho(arquivo.size);
    infoFormato.textContent = extensao.toUpperCase();
}

function limparInfos() {
    const vazio = '<span class="placeholder-info">—</span>';
    infoNome.innerHTML = vazio;
    infoTamanho.innerHTML = vazio;
    infoFormato.innerHTML = vazio;
}

//validar o arqv
function validarArquivo(arquivo) {
    const partes = arquivo.name.split('.');
    const ext = partes[partes.length - 1].toLowerCase();

    if (!FORMATOS_ACEITOS.includes(ext)) {
        mostrarErroArquivo(`Formato inválido (.${ext}). Apenas arquivos .STL e .OBJ são aceitos.`);
        return null;
    }

    if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
        mostrarErroArquivo(`Arquivo muito grande (${formatarTamanho(arquivo.size)}). O limite é ${TAMANHO_MAXIMO_MB} MB.`);
        return null;
    }

    ocultarErroArquivo();
    return ext;
}

//iniciar o visualizador

function inicializarThree() {
    if (threeIniciado) return;
    threeIniciado = true;

    const w = viewerWrapper.clientWidth;
    const h = viewerWrapper.clientHeight;

    // renderizar
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;


    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    //iniciar a camera cetralizada
    camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 10000);
    camera.position.set(0, 0, 300);

    //girar, zoom, pan)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.1;
    controls.maxDistance = 5000;
    controls.zoomSpeed = 10;

    // Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight1.position.set(1, 2, 1.5);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xc8a0d8, 0.35);
    dirLight2.position.set(-1, -0.5, -1);
    scene.add(dirLight2);

    const hemiLight = new THREE.HemisphereLight(0xf0cef5, 0x221133, 0.3);
    scene.add(hemiLight);

    // Grid (reposicionado em centralizarModelo)
    gridHelper = new THREE.GridHelper(300, 30, 0x7a3077, 0x3d1a3d);
    gridHelper.material.opacity = 0.55;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Loop de renderização
    function animar() {
        requestAnimationFrame(animar);
        controls.update();
        renderer.render(scene, camera);
    }
    animar();

    // Responsividade
    window.addEventListener('resize', () => {
        const nw = viewerWrapper.clientWidth;
        const nh = viewerWrapper.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
    });
}

// ─────────────────────────────────────────────
// Centralizar e enquadrar modelo
// ─────────────────────────────────────────────

function centralizarModelo(objeto) {
    // 1. Bounding box na posição original
    const box = new THREE.Box3().setFromObject(objeto);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    // 2. Move o objeto para que o centro geométrico fique na origem
    objeto.position.set(-center.x, -center.y, -center.z);

    // 3. Recalcula o box APÓS o deslocamento para obter o minY real
    const boxFinal = new THREE.Box3().setFromObject(objeto);
    if (gridHelper) {
        const tamanhoGrid = Math.max(size.x, size.z) * 2.5;
        gridHelper.scale.setScalar(tamanhoGrid / 300);
        gridHelper.position.y = boxFinal.min.y;
    }

    // 4. Distância da câmera proporcional ao maior eixo
    const maxDim = Math.max(size.x, size.y, size.z);
    const fovRad = camera.fov * (Math.PI / 180);
    let camDist = (maxDim / (2 * Math.tan(fovRad / 2))) * 1.8;
    camDist = Math.max(camDist, 1);

    // 5. Câmera frontal: reta na frente (+Z), leve elevação
    camera.position.set(0, camDist * 0.2, camDist);
    camera.near = camDist / 200;
    camera.far = camDist * 200;
    camera.updateProjectionMatrix();

    // 6. Garante que "cima" é sempre Y positivo (evita gimbal invertido)
    camera.up.set(0, 1, 0);

    // 7. Aponta para a origem e atualiza
    controls.target.set(0, 0, 0);
    camera.lookAt(0, 0, 0);
    controls.update();

    // Salva estado para o botão de reset
    cameraInicial.position = camera.position.clone();
    cameraInicial.target = controls.target.clone();
}

// ─────────────────────────────────────────────
// Remover modelo anterior da cena
// ─────────────────────────────────────────────

function removerModeloAtual() {
    if (!modeloAtual) return;
    scene.remove(modeloAtual);
    modeloAtual.traverse((child) => {
        if (child.isMesh) {
            child.geometry && child.geometry.dispose();
            if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
            } else {
                child.material && child.material.dispose();
            }
        }
    });
    modeloAtual = null;
}

// ─────────────────────────────────────────────
// Material padrão do modelo
// ─────────────────────────────────────────────

function criarMaterial() {
    return new THREE.MeshPhongMaterial({
        color: 0x9b59b6,
        specular: 0x3d0066,
        shininess: 60,
        side: THREE.DoubleSide,
    });
}

// ─────────────────────────────────────────────
// Carregar STL
// ─────────────────────────────────────────────

function carregarSTL(arrayBuffer) {
    return new Promise((resolve, reject) => {
        try {
            const loader = new STLLoader();
            const geometry = loader.parse(arrayBuffer);

            if (!geometry || !geometry.attributes.position) {
                reject('Geometria STL inválida ou vazia.');
                return;
            }

            // Corrige eixo Z-up → Y-up (Blender, Fusion 360, Cura, etc.)
            geometry.rotateX(-Math.PI / 2);
            geometry.computeVertexNormals();
            const mesh = new THREE.Mesh(geometry, criarMaterial());
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            resolve(mesh);
        } catch (e) {
            reject('Erro ao parsear arquivo STL: ' + e.message);
        }
    });
}

// ─────────────────────────────────────────────
// Carregar OBJ
// ─────────────────────────────────────────────

function carregarOBJ(texto) {
    return new Promise((resolve, reject) => {
        try {
            const loader = new OBJLoader();
            const objeto = loader.parse(texto);
            const material = criarMaterial();

            if (!objeto || !objeto.children.length) {
                reject('Arquivo OBJ vazio ou sem geometria reconhecível.');
                return;
            }

            objeto.traverse((child) => {
                if (child.isMesh) {
                    child.material = material;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.geometry.computeVertexNormals();
                }
            });

            // Mesma correção de eixo para OBJ
            objeto.rotation.x = -Math.PI / 2;

            resolve(objeto);
        } catch (e) {
            reject('Erro ao parsear arquivo OBJ: ' + e.message);
        }
    });
}

// ─────────────────────────────────────────────
// Processar arquivo selecionado
// ─────────────────────────────────────────────

function processarArquivo(arquivo) {
    const ext = validarArquivo(arquivo);
    if (!ext) return;

    ocultarErroViewer();
    mostrarLoading();
    preencherInfos(arquivo, ext);
    inicializarThree();

    const reader = new FileReader();
    reader.onerror = () => {
        mostrarErroViewer('Não foi possível ler o arquivo.');
        limparInfos();
    };

    const aoCarregar = (objeto) => {
        removerModeloAtual();
        modeloAtual = objeto;
        scene.add(modeloAtual);
        centralizarModelo(modeloAtual);
        ocultarLoading();
        placeholder.style.display = 'none';
        aplicarWireframe(wireframeAtivo);
    };

    if (ext === 'stl') {
        reader.onload = async (e) => {
            try {
                aoCarregar(await carregarSTL(e.target.result));
            } catch (err) {
                limparInfos();
                mostrarErroViewer(err);
            }
        };
        reader.readAsArrayBuffer(arquivo);

    } else if (ext === 'obj') {
        reader.onload = async (e) => {
            try {
                aoCarregar(await carregarOBJ(e.target.result));
            } catch (err) {
                limparInfos();
                mostrarErroViewer(err);
            }
        };
        reader.readAsText(arquivo);
    }
}

// ─────────────────────────────────────────────
// Wireframe
// ─────────────────────────────────────────────

function aplicarWireframe(ativo) {
    if (!modeloAtual) return;
    modeloAtual.traverse((child) => {
        if (child.isMesh) {
            if (Array.isArray(child.material)) {
                child.material.forEach(m => { m.wireframe = ativo; });
            } else {
                child.material.wireframe = ativo;
            }
        }
    });
}

// ─────────────────────────────────────────────
// Eventos — padrão Printly: DOMContentLoaded
// ─────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {

    // Drag & drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const arquivo = e.dataTransfer.files[0];
        if (arquivo) processarArquivo(arquivo);
    });

    // Seleção manual
    btnSelecionar.addEventListener('click', () => {
        inputArquivo.value = '';
        inputArquivo.click();
    });

    inputArquivo.addEventListener('change', () => {
        const arquivo = inputArquivo.files[0];
        if (arquivo) processarArquivo(arquivo);
    });

    // Controles do viewer
    btnResetarCamera.addEventListener('click', () => {
        if (!threeIniciado || !cameraInicial.position) return;
        camera.position.copy(cameraInicial.position);
        controls.target.copy(cameraInicial.target);
        controls.update();
    });

    btnToggleGrid.addEventListener('click', () => {
        if (!gridHelper) return;
        gridVisivel = !gridVisivel;
        gridHelper.visible = gridVisivel;
        btnToggleGrid.classList.toggle('btn-viewer-ativo', gridVisivel);
    });

    btnToggleWireframe.addEventListener('click', () => {
        wireframeAtivo = !wireframeAtivo;
        aplicarWireframe(wireframeAtivo);
        btnToggleWireframe.classList.toggle('btn-viewer-ativo', wireframeAtivo);
    });

});