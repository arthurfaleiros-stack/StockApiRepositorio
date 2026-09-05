require('dotenv').config();
const app = require('./server');
const { ping } = require('./db/connect');

const PORT = process.env.PORT || 3000;

async function startServer() {
  console.log('====================================================');
  console.log('         🚀 INICIALIZANDO KSTOCK-API                ');
  console.log('====================================================');

  // Testar conexão inicial com o banco
  try {
    await ping();
    console.log('✅ Conexão com banco de dados MySQL ativa e operante.');
  } catch (err) {
    console.warn('⚠️  Aviso: Não foi possível conectar ao banco de dados no momento.');
    console.warn(`    Motivo: ${err.message}`);
    console.warn('    Execute as migrations ("npm run migrate") assim que o MySQL estiver acessível.');
  }

  const server = app.listen(PORT, () => {
    console.log(`🌐 Servidor rodando na porta ${PORT}`);
    console.log(`📑 Documentação Swagger UI disponível em: http://localhost:${PORT}/api/docs`);
    console.log(`🩺 Healthcheck disponível em: http://localhost:${PORT}/health`);
    console.log(`📦 Recursos REST em: http://localhost:${PORT}/api/v1`);
    console.log('====================================================');
  });

  // Tratamento de encerramento gracioso (Graceful Shutdown)
  const shutdown = (signal) => {
    console.log(`\n🛑 Sinal ${signal} recebido. Encerrando servidor graciosamente...`);
    server.close(() => {
      console.log('🔒 Servidor HTTP encerrado.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
