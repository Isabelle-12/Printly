<?php
header("Content-type: application/json;charset=utf-8");

include_once __DIR__ . "/../../../../config/conexao.php";
include_once __DIR__ . "/../../../helpers/geo.php";

$cep      = isset($_GET['cep'])      ? preg_replace('/\D/', '', $_GET['cep']) : '';
$cidade   = isset($_GET['cidade'])   ? trim($_GET['cidade'])   : '';
$estado   = isset($_GET['estado'])   ? trim($_GET['estado'])   : '';
$latParam = isset($_GET['lat'])      ? (float) $_GET['lat']    : null;
$lngParam = isset($_GET['lng'])      ? (float) $_GET['lng']    : null;
$raioKm   = isset($_GET['raio'])     ? (int) $_GET['raio']     : 50;

if ($raioKm <= 0)   $raioKm = 50;
if ($raioKm > 1000) $raioKm = 1000;

$latOrigem = null;
$lngOrigem = null;

if ($latParam !== null && $lngParam !== null) {
    $latOrigem = $latParam;
    $lngOrigem = $lngParam;
} elseif (strlen($cep) === 8) {
    $coord = cepParaCoordenadas($cep);
    if ($coord !== null) {
        $latOrigem = $coord[0];
        $lngOrigem = $coord[1];
    }
} elseif ($cidade !== '' || $estado !== '') {
    // sem coordenadas — vai filtrar por texto direto no SQL
} else {
    echo json_encode(['status' => 'nok', 'mensagem' => 'Informe CEP, cidade/estado ou sua localização', 'data' => []]);
    exit;
}

$sql = "SELECT u.id AS maker_id, u.nome, u.cidade, u.estado, u.cep, u.disponivel_para_pedidos,
               f.nome_empresa, f.foto_empresa
        FROM usuarios u
        INNER JOIN fabricantes f ON f.usuario_id = u.id
        WHERE u.tipo_perfil = 'MAKER'
          AND u.status = 'ATIVO'
          AND u.status_fabricante = 'APROVADO'";

$params = [];
$tipos  = '';

if ($latOrigem === null && ($cidade !== '' || $estado !== '')) {
    if ($cidade !== '') {
        $sql .= " AND u.cidade LIKE ?";
        $params[] = '%' . $cidade . '%';
        $tipos .= 's';
    }
    if ($estado !== '') {
        $sql .= " AND u.estado = ?";
        $params[] = strtoupper($estado);
        $tipos .= 's';
    }
}

$stmt = $conexao->prepare($sql);
if (!empty($params)) {
    $stmt->bind_param($tipos, ...$params);
}
$stmt->execute();
$resultado = $stmt->get_result();

$makers = [];
while ($linha = $resultado->fetch_assoc()) {
    $maker = $linha;
    $maker['distancia_km'] = null;

    if ($latOrigem !== null) {
        $cepMaker = preg_replace('/\D/', '', $linha['cep'] ?? '');
        if (strlen($cepMaker) === 8) {
            $coordMaker = cepParaCoordenadas($cepMaker);
            if ($coordMaker !== null) {
                $dist = calcularDistanciaKm($latOrigem, $lngOrigem, $coordMaker[0], $coordMaker[1]);
                if ($dist <= $raioKm) {
                    $maker['distancia_km'] = $dist;
                    $makers[] = $maker;
                }
                continue;
            }
        }
    } else {
        $makers[] = $maker;
    }
}
$stmt->close();

if ($latOrigem !== null) {
    usort($makers, fn($a, $b) => $a['distancia_km'] <=> $b['distancia_km']);
}

foreach ($makers as $i => $maker) {
    $mid = (int) $maker['maker_id'];

    $stmt = $conexao->prepare("SELECT titulo, caminho_imagem FROM portfolio_maker WHERE maker_id = ? ORDER BY data_upload DESC");
    $stmt->bind_param("i", $mid);
    $stmt->execute();
    $makers[$i]['fotos'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    $stmt = $conexao->prepare("SELECT tipo_material FROM materiais_maker WHERE maker_id = ?");
    $stmt->bind_param("i", $mid);
    $stmt->execute();
    $matRes = $stmt->get_result();
    $mats = [];
    while ($m = $matRes->fetch_assoc()) {
        $mats[] = $m['tipo_material'];
    }
    $makers[$i]['materiais'] = $mats;
    $stmt->close();

    $stmt = $conexao->prepare("SELECT total_avaliacoes, media_nota FROM view_media_avaliacoes_maker WHERE maker_id = ?");
    $stmt->bind_param("i", $mid);
    $stmt->execute();
    $media = $stmt->get_result()->fetch_assoc();
    $makers[$i]['media_nota']       = $media['media_nota'] ?? null;
    $makers[$i]['total_avaliacoes'] = $media['total_avaliacoes'] ?? 0;
    $stmt->close();
}

if (count($makers) === 0) {
    echo json_encode([
        'status'   => 'ok',
        'mensagem' => 'Nenhum fabricante encontrado nesta região. Tente ampliar o raio de busca ou verificar outras regiões próximas.',
        'data'     => ['makers' => [], 'vazio' => true]
    ]);
    exit;
}

echo json_encode([
    'status'   => 'ok',
    'mensagem' => count($makers) . ' fabricante(s) encontrado(s)',
    'data'     => ['makers' => $makers, 'vazio' => false]
], JSON_UNESCAPED_UNICODE);

$conexao->close();