const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigrations() {
  console.log(' Iniciando execução de migrations do KStock-API...');

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'senai@604',
  };

  const dbName = process.env.DB_NAME || 'kstock_db';

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log(` Connected to MySQL server at ${dbConfig.host}:${dbConfig.port}`);

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log(` Banco de dados "${dbName}" garantido.`);

    await connection.changeUser({ database: dbName });

    // 1. Tabela USUARIO
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuario (
        id BIGINT NOT NULL AUTO_INCREMENT,
        nome VARCHAR(150) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        senha_hash VARCHAR(255) NOT NULL,
        perfil ENUM('ADMIN', 'GERENTE', 'OPERADOR') NOT NULL DEFAULT 'OPERADOR',
        criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);
    console.log('   Tabela "usuario" verificada/criada.');

    // 2. Tabela ASSINATURA
    await connection.query(`
      CREATE TABLE IF NOT EXISTS assinatura (
        id BIGINT NOT NULL AUTO_INCREMENT,
        usuario_id BIGINT NOT NULL,
        plano ENUM('FREE', 'BASIC', 'PRO', 'ENTERPRISE') NOT NULL DEFAULT 'FREE',
        data_inicio DATE NOT NULL,
        data_fim DATE NULL,
        status ENUM('ATIVO', 'INATIVO', 'CANCELADO', 'PENDENTE') NOT NULL DEFAULT 'ATIVO',
        criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_assinatura_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('   Tabela "assinatura" verificada/criada.');

    // 3. Tabela CATEGORIA
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categoria (
        id BIGINT NOT NULL AUTO_INCREMENT,
        nome VARCHAR(150) NOT NULL UNIQUE,
        descricao TEXT NULL,
        criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);
    console.log('   Tabela "categoria" verificada/criada.');

    // 4. Tabela FORNECEDOR
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fornecedor (
        id BIGINT NOT NULL AUTO_INCREMENT,
        nome VARCHAR(150) NOT NULL,
        cnpj VARCHAR(20) NOT NULL UNIQUE,
        contato VARCHAR(150) NULL,
        endereco VARCHAR(255) NULL,
        criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);
    console.log('   Tabela "fornecedor" verificada/criada.');

    // 5. Tabela PRODUTO
    await connection.query(`
      CREATE TABLE IF NOT EXISTS produto (
        id BIGINT NOT NULL AUTO_INCREMENT,
        categoria_id BIGINT NOT NULL,
        fornecedor_id BIGINT NOT NULL,
        nome VARCHAR(200) NOT NULL,
        codigo VARCHAR(100) NOT NULL UNIQUE,
        descricao TEXT NULL,
        quantidade_atual BIGINT NOT NULL DEFAULT 0,
        quantidade_minima BIGINT NOT NULL DEFAULT 0,
        codigo_barras VARCHAR(100) NULL,
        foto_url VARCHAR(255) NULL,
        criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_produto_codigo (codigo),
        INDEX idx_produto_categoria (categoria_id),
        INDEX idx_produto_fornecedor (fornecedor_id),
        CONSTRAINT fk_produto_categoria FOREIGN KEY (categoria_id) REFERENCES categoria(id) ON DELETE RESTRICT,
        CONSTRAINT fk_produto_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES fornecedor(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB;
    `);
    console.log('   Tabela "produto" verificada/criada.');

    // 6. Tabela MOVIMENTACAO
    await connection.query(`
      CREATE TABLE IF NOT EXISTS movimentacao (
        id BIGINT NOT NULL AUTO_INCREMENT,
        usuario_id BIGINT NOT NULL,
        produto_id BIGINT NOT NULL,
        tipo ENUM('ENTRADA', 'SAIDA', 'AJUSTE') NOT NULL,
        quantidade BIGINT NOT NULL,
        data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        observacao TEXT NULL,
        PRIMARY KEY (id),
        INDEX idx_movimentacao_produto (produto_id),
        INDEX idx_movimentacao_usuario (usuario_id),
        INDEX idx_movimentacao_data (data_hora),
        CONSTRAINT fk_movimentacao_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE RESTRICT,
        CONSTRAINT fk_movimentacao_produto FOREIGN KEY (produto_id) REFERENCES produto(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB;
    `);
    console.log('   Tabela "movimentacao" verificada/criada.');

    // 7. Tabela HISTORICO
    await connection.query(`
      CREATE TABLE IF NOT EXISTS historico (
        id BIGINT NOT NULL AUTO_INCREMENT,
        usuario_id BIGINT NULL,
        produto_id BIGINT NULL,
        movimentacao_id BIGINT NULL,
        data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        tipo_operacao VARCHAR(60) NOT NULL,
        descricao TEXT NOT NULL,
        PRIMARY KEY (id),
        INDEX idx_historico_produto (produto_id),
        INDEX idx_historico_usuario (usuario_id),
        INDEX idx_historico_movimentacao (movimentacao_id),
        INDEX idx_historico_data (data_hora),
        CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL,
        CONSTRAINT fk_historico_produto FOREIGN KEY (produto_id) REFERENCES produto(id) ON DELETE SET NULL,
        CONSTRAINT fk_historico_movimentacao FOREIGN KEY (movimentacao_id) REFERENCES movimentacao(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);
    console.log('   Tabela "historico" verificada/criada.');

    console.log(' Migrations concluídas com sucesso!');
  } catch (error) {
    console.error(' Erro ao executar migrations:', error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runMigrations;
