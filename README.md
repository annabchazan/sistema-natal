Tabelas 
-- 1. Instituições (Com campo de contato)
CREATE TABLE instituicoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_instituicao VARCHAR(150) NOT NULL,
    responsavel VARCHAR(100),
    contato VARCHAR(50) NOT NULL -- Telefone ou WhatsApp
);

-- 2. Tags (Categorias: Brinquedo, Roupa, etc.)
CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL
);

-- 3. Pontos de Entrega
CREATE TABLE pontos_entrega (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_local VARCHAR(100) NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    horario VARCHAR(100)
);

-- 4. Usuários
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('admin', 'padrinho') DEFAULT 'padrinho'
);

-- 5. Cartinhas (Relacionada à Instituição e Tag)
CREATE TABLE cartinhas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_crianca VARCHAR(100) NOT NULL,
    idade INT NOT NULL,
    texto_cartinha TEXT NOT NULL,
    presente_pedido VARCHAR(150) NOT NULL,
    status ENUM('disponivel', 'adotada', 'entregue') DEFAULT 'disponivel',
    instituicao_id INT NOT NULL,
    tag_id INT,
    FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
);

-- 6. Adoções (Relaciona Padrinho, Cartinha e o Ponto de Entrega escolhido)
CREATE TABLE adocoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    cartinha_id INT NOT NULL,
    ponto_entrega_id INT NOT NULL,
    data_adocao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (cartinha_id) REFERENCES cartinhas(id),
    FOREIGN KEY (ponto_entrega_id) REFERENCES pontos_entrega(id)
);