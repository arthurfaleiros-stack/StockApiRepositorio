const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');

const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/appError');

const app = express();

// Middlewares Globais de Segurança e Utilidades
app.use(helmet({
  contentSecurityPolicy: false // Permite renderização correta do Swagger UI
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// Documentação Interativa Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Healthcheck do Serviço
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    name: 'KStock-API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rotas Versionadas da API
app.use('/api/v1', routes);

// Rota 404 para recursos não encontrados
app.use('*', (req, res, next) => {
  next(new AppError(`Rota ${req.originalUrl} não encontrada no servidor.`, 404, 'ROUTE_NOT_FOUND'));
});

// Middleware Global de Tratamento de Erros
app.use(errorHandler);

module.exports = app;
