const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function runSeeds() {
  console.log('🌱 Iniciando população de dados iniciais (seeds) do KStock-API...');

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kstock_db'
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log(' Conectado ao banco de dados para execução de seeds.');

    // 1. Criar Usuários
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('Admin@123456', salt);
    const operadorHash = await bcrypt.hash('Operador@123456', salt);

    await connection.query(`
      INSERT INTO usuario (nome, email, senha_hash, perfil)
      VALUES 
        ('Administrador Geral', 'admin@kstock.com', ?, 'ADMIN'),
        ('Operador do Estoque', 'operador@kstock.com', ?, 'OPERADOR')
      ON DUPLICATE KEY UPDATE nome = VALUES(nome);
    `, [adminHash, operadorHash]);

    const [[adminUser]] = await connection.query('SELECT id FROM usuario WHERE email = ?', ['admin@kstock.com']);
    const [[opUser]] = await connection.query('SELECT id FROM usuario WHERE email = ?', ['operador@kstock.com']);

    // 2. Criar Assinaturas
    if (adminUser) {
      await connection.query(`
        INSERT INTO assinatura (usuario_id, plano, data_inicio, data_fim, status)
        VALUES (?, 'ENTERPRISE', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'ATIVO')
        ON DUPLICATE KEY UPDATE status = VALUES(status);
      `, [adminUser.id]);
    }

    if (opUser) {
      await connection.query(`
        INSERT INTO assinatura (usuario_id, plano, data_inicio, data_fim, status)
        VALUES (?, 'PRO', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'ATIVO')
        ON DUPLICATE KEY UPDATE status = VALUES(status);
      `, [opUser.id]);
    }
    console.log(' Usuários e assinaturas criados/atualizados.');

    // 3. Criar Categorias
    await connection.query(`
      INSERT INTO categoria (nome, descricao)
      VALUES 
        ('Eletrônicos', 'Dispositivos eletrônicos em geral'),
        ('Periféricos', 'Teclados, mouses, fones de ouvido e acessórios'),
        ('Informática', 'Peças de computador e suprimentos'),
        ('Ferramentas', 'Ferramentas de manutenção e reparo')
      ON DUPLICATE KEY UPDATE descricao = VALUES(descricao);
    `);
    console.log(' Categorias criadas/atualizadas.');

    // 4. Criar Fornecedores
    await connection.query(`
      INSERT INTO fornecedor (nome, cnpj, contato, endereco)
      VALUES 
        ('Tech Brasil Distribuidora Ltda', '11.222.333/0001-81', '(11) 98765-4321 - contato@techbrasil.com', 'Av. Paulista, 1000 - São Paulo/SP'),
        ('Global Componentes S/A', '44.555.666/0001-92', '(21) 91234-5678 - vendas@globalcomp.com', 'Rua da Alfândega, 200 - Rio de Janeiro/RJ')
      ON DUPLICATE KEY UPDATE nome = VALUES(nome), contato = VALUES(contato);
    `);
    console.log(' Fornecedores criados/atualizados.');

    // 5. Criar Produtos
    const [[categoriaPerifericos]] = await connection.query('SELECT id FROM categoria WHERE nome = ?', ['Periféricos']);
    const [[categoriaInformatica]] = await connection.query('SELECT id FROM categoria WHERE nome = ?', ['Informática']);
    const [[fornecedorTech]] = await connection.query('SELECT id FROM fornecedor WHERE cnpj = ?', ['11.222.333/0001-81']);

    if (categoriaPerifericos && fornecedorTech) {
      await connection.query(`
        INSERT INTO produto (categoria_id, fornecedor_id, nome, codigo, descricao, quantidade_atual, quantidade_minima, codigo_barras)
        VALUES 
          (?, ?, 'Teclado Mecânico RGB', 'TEC-RGB-01', 'Teclado mecânico switch azul com iluminação RGB e layout ABNT2', 50, 10, '7891234560011'),
          (?, ?, 'Mouse Gamer 16000 DPI', 'MOU-GAM-02', 'Mouse óptico ergonômico com 8 botões programáveis', 35, 5, '7891234560022')
        ON DUPLICATE KEY UPDATE nome = VALUES(nome), quantidade_minima = VALUES(quantidade_minima);
      `, [categoriaPerifericos.id, fornecedorTech.id, categoriaPerifericos.id, fornecedorTech.id]);
    }

    if (categoriaInformatica && fornecedorTech) {
      await connection.query(`
        INSERT INTO produto (categoria_id, fornecedor_id, nome, codigo, descricao, quantidade_atual, quantidade_minima, codigo_barras)
        VALUES 
          (?, ?, 'SSD NVMe M.2 1TB', 'SSD-1TB-03', 'SSD PCIe 4.0 ultra rápido leitura 5000MB/s', 8, 10, '7891234560033')
        ON DUPLICATE KEY UPDATE nome = VALUES(nome), quantidade_minima = VALUES(quantidade_minima);
      `, [categoriaInformatica.id, fornecedorTech.id]);
    }
    console.log(' Produtos criados/atualizados.');

    console.log('🌱 Seeds concluídos com sucesso!');
  } catch (error) {
    console.error(' Erro ao executar seeds:', error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  runSeeds()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runSeeds;
