const { pool, ping } = require('./connect');

async function testConnection() {
  console.log('🔍 Testando conexão com o banco de dados MySQL...');
  console.log(`Configuração: Host=${process.env.DB_HOST || 'localhost'}, Porta=${process.env.DB_PORT || 3306}, Banco=${process.env.DB_NAME || 'kstock_db'}, Usuário=${process.env.DB_USER || 'root'}`);

  try {
    await ping();
    console.log('✅ Conexão estabelecida com sucesso com o MySQL!');

    const [rows] = await pool.query('SHOW TABLES');
    console.log(`📊 Tabelas encontradas no banco de dados (${rows.length}):`);
    rows.forEach(r => console.log(`   - ${Object.values(r)[0]}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Falha ao conectar ao banco de dados MySQL:');
    console.error(`   Código do erro: ${error.code || 'Desconhecido'}`);
    console.error(`   Mensagem: ${error.message}`);
    console.error('\n💡 Dica: Verifique se o MySQL está rodando e as variáveis no arquivo .env estão corretas.');
    process.exit(1);
  }
}

if (require.main === module) {
  testConnection();
}

module.exports = testConnection;
