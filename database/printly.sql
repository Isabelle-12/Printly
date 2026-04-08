\DROP DATABASE IF EXISTS printly_db;
CREATE DATABASE printly_db;

CREATE USER IF NOT EXISTS 'printly_user'@'localhost' IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON printly_db.* TO 'printly_user'@'localhost';
FLUSH PRIVILEGES;

USE printly_db;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo_perfil ENUM('CLIENTE', 'MAKER', 'ADMIN') NOT NULL,
    documento VARCHAR(20),
    telefone VARCHAR(20),
    cep VARCHAR(10),
    cidade VARCHAR(100),
    estado CHAR(2),
    endereco TEXT,
    status ENUM('ATIVO', 'PENDENTE', 'BANIDO') DEFAULT 'PENDENTE',
    status_fabricante ENUM('NAO_SOLICITADO', 'PENDENTE', 'APROVADO', 'REJEITADO') DEFAULT 'NAO_SOLICITADO',
    disponivel_para_pedidos BOOLEAN NOT NULL DEFAULT TRUE,
    lat DOUBLE,
    lng DOUBLE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_usuarios_tipo_status (tipo_perfil, status),
    KEY idx_usuarios_cep (cep),
    KEY idx_usuarios_status_fab (status_fabricante)
);

CREATE TABLE fabricantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    cnpj VARCHAR(20),
    telefone_comercial VARCHAR(20),
    endereco_empresa TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE impressoras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    maker_id INT NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    volume_maximo_cm3 DECIMAL(10,2),
    status ENUM('DISPONIVEL', 'MANUTENCAO') DEFAULT 'DISPONIVEL',
    FOREIGN KEY (maker_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    KEY idx_impressoras_maker (maker_id, status)
);

CREATE TABLE materiais_maker (
    id INT AUTO_INCREMENT PRIMARY KEY,
    maker_id INT NOT NULL,
    tipo_material VARCHAR(50) NOT NULL,
    preco_por_grama DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (maker_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    KEY idx_materiais_maker (maker_id)
);

CREATE TABLE projetos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    nome_projeto VARCHAR(100) NOT NULL,
    descricao TEXT,
    arquivo_caminho VARCHAR(255) NOT NULL,
    formato ENUM('STL', 'OBJ') NOT NULL,
    volume_estimado_cm3 DECIMAL(10,2),
    peso_estimado_gramas DECIMAL(10,2),
    status ENUM('RASCUNHO','AGUARDANDO_ORCAMENTO','COM_PEDIDO','CONCLUIDO','EXCLUIDO') NOT NULL DEFAULT 'RASCUNHO',
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    KEY idx_projetos_cliente (cliente_id),
    KEY idx_projetos_status (status)
);

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projeto_id INT NOT NULL,
    maker_id INT NOT NULL,
    material_escolhido VARCHAR(50) NOT NULL,
    quantidade INT DEFAULT 1,
    valor_total DECIMAL(10,2) NOT NULL,
    status ENUM('AGUARDANDO_CONFIRMACAO', 'ARQUIVO_VALIDADO', 'ACEITO', 'EM_PRODUCAO', 'CONCLUIDO', 'NEGADO') DEFAULT 'AGUARDANDO_CONFIRMACAO',
    motivo_recusa TEXT,
    endereco_entrega TEXT NOT NULL,
    prazo_pedido DATETIME NULL DEFAULT NULL,
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (projeto_id) REFERENCES projetos(id),
    FOREIGN KEY (maker_id) REFERENCES usuarios(id),
    KEY idx_pedidos_projeto (projeto_id),
    KEY idx_pedidos_maker_status (maker_id, status),
    KEY idx_pedidos_prazo (prazo_pedido)
);

CREATE TABLE mensagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    remetente_id INT NOT NULL,
    destinatario_id INT NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (remetente_id) REFERENCES usuarios(id),
    FOREIGN KEY (destinatario_id) REFERENCES usuarios(id),
    KEY idx_mensagens_pedido_data (pedido_id, data_envio)
);

CREATE TABLE avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL UNIQUE,
    cliente_id INT NOT NULL,
    maker_id INT NOT NULL,
    nota INT NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    resposta_maker TEXT,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    FOREIGN KEY (maker_id) REFERENCES usuarios(id),
    KEY idx_avaliacoes_maker (maker_id)
);

CREATE TABLE logs_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    acao VARCHAR(255) NOT NULL,
    tabela_afetada VARCHAR(50),
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    KEY idx_logs_usuario_data (usuario_id, data_hora)
);

CREATE TABLE anuncios_globais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notificacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('ATRASO', 'MANUTENCAO', 'RETIFICACAO') NOT NULL,
    pedido_id INT NULL,
    titulo VARCHAR(255),
    mensagem TEXT NOT NULL,
    email_destino VARCHAR(100),
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retratada BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
    KEY idx_notificacoes_pedido (pedido_id)
);

CREATE TABLE portfolio_maker (
    id INT AUTO_INCREMENT PRIMARY KEY,
    maker_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    caminho_imagem VARCHAR(255) NOT NULL,
    data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (maker_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE historico_status_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    status_anterior VARCHAR(30),
    status_novo VARCHAR(30) NOT NULL,
    alterado_por INT,
    observacao TEXT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (alterado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE entregas_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    caminho_arquivo VARCHAR(255) NOT NULL,
    tipo ENUM('FOTO','COMPROVANTE','OUTRO') DEFAULT 'FOTO',
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

CREATE TABLE tokens_reset_senha (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(128) NOT NULL UNIQUE,
    data_expiracao DATETIME NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE OR REPLACE VIEW view_media_avaliacoes_maker AS
SELECT
    u.id AS maker_id,
    u.nome,
    COUNT(a.id) AS total_avaliacoes,
    ROUND(AVG(a.nota), 2) AS media_nota
FROM usuarios u
LEFT JOIN avaliacoes a ON a.maker_id = u.id
WHERE u.tipo_perfil = 'MAKER'
GROUP BY u.id, u.nome;

CREATE OR REPLACE VIEW view_pedidos_completos AS
SELECT
    p.id,
    p.status,
    p.valor_total,
    p.quantidade,
    p.material_escolhido,
    p.data_solicitacao,
    p.data_atualizacao,
    p.prazo_pedido,
    pr.id AS projeto_id,
    pr.nome_projeto,
    pr.formato,
    pr.arquivo_caminho,
    c.id AS cliente_id,
    c.nome AS cliente_nome,
    c.email AS cliente_email,
    m.id AS maker_id,
    m.nome AS maker_nome,
    m.cidade AS maker_cidade,
    m.estado AS maker_estado
FROM pedidos p
JOIN projetos pr ON pr.id = p.projeto_id
JOIN usuarios c ON c.id = pr.cliente_id
JOIN usuarios m ON m.id = p.maker_id;

CREATE OR REPLACE VIEW view_metricas_plataforma AS
SELECT
    (SELECT COUNT(*) FROM usuarios WHERE tipo_perfil = 'CLIENTE') AS total_clientes,
    (SELECT COUNT(*) FROM usuarios WHERE tipo_perfil = 'MAKER') AS total_makers,
    (SELECT COUNT(*) FROM usuarios WHERE status_fabricante = 'PENDENTE') AS makers_pendentes,
    (SELECT COUNT(*) FROM projetos) AS total_projetos,
    (SELECT COUNT(*) FROM pedidos) AS total_pedidos,
    (SELECT COUNT(*) FROM pedidos WHERE status = 'EM_PRODUCAO') AS pedidos_em_producao,
    (SELECT COUNT(*) FROM pedidos WHERE status = 'CONCLUIDO') AS pedidos_concluidos,
    (SELECT COALESCE(SUM(valor_total),0) FROM pedidos WHERE status = 'CONCLUIDO') AS receita_concluida;

INSERT INTO usuarios (nome, email, senha, tipo_perfil, status, telefone, cep, cidade, estado, endereco) VALUES
('João Silva', 'joao@email.com', '123456', 'CLIENTE', 'ATIVO', '(41) 99111-0001', '80010-000', 'Curitiba', 'PR', 'Rua dos Clientes, 10'),
('Maria Souza', 'maria@email.com', '123456', 'MAKER', 'ATIVO', '(41) 99999-0001', '80020-000', 'Curitiba', 'PR', 'Rua das Impressoras, 123'),
('Carlos Pereira', 'carlos@email.com', '123456', 'MAKER', 'ATIVO', '(41) 97777-0003', '80030-000', 'Curitiba', 'PR', 'Rua dos Criadores, 789'),
('Ana Martins', 'ana.admin@email.com', '123456', 'ADMIN', 'ATIVO', '(41) 97777-1111', '80010-000', 'Curitiba', 'PR', 'Avenida Central, 200'),
('Bruno Maker Teste', 'bruno.maker@teste.com', '123456', 'MAKER', 'ATIVO', '(41) 98888-7777', '80040-000', 'Curitiba', 'PR', 'Rua de Teste, 500, Umbará');

UPDATE usuarios SET status_fabricante = 'APROVADO' WHERE email IN ('maria@email.com', 'carlos@email.com');
UPDATE usuarios SET status_fabricante = 'PENDENTE' WHERE email = 'bruno.maker@teste.com';

INSERT INTO fabricantes (usuario_id, cnpj, telefone_comercial, endereco_empresa, data_aprovacao) VALUES
((SELECT id FROM usuarios WHERE email='maria@email.com'), '12.345.678/0001-90', '(41) 99999-0001', 'Rua das Impressoras, 123, Curitiba, PR', NOW()),
((SELECT id FROM usuarios WHERE email='carlos@email.com'), '23.456.789/0001-55', '(41) 97777-0003', 'Rua dos Criadores, 789, Curitiba, PR', NOW()),
((SELECT id FROM usuarios WHERE email='bruno.maker@teste.com'), '99.999.999/0001-99', '(41) 98888-7777', 'Rua de Teste, 500, Umbará, Curitiba - PR', NULL);

INSERT INTO impressoras (maker_id, modelo, volume_maximo_cm3, status) VALUES
((SELECT id FROM usuarios WHERE email='bruno.maker@teste.com'), 'Ender 3 S1', 8000.00, 'DISPONIVEL');

INSERT INTO materiais_maker (maker_id, tipo_material, preco_por_grama) VALUES
((SELECT id FROM usuarios WHERE email='bruno.maker@teste.com'), 'PLA Premium', 0.15);