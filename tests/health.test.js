const request = require('supertest');
const app = require('../src/server');

describe('Healthcheck & Swagger Documentation', () => {
  it('GET /health deve retornar status 200 e informações do serviço', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.name).toBe('KStock-API');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/docs deve responder à rota de documentação Swagger', async () => {
    const res = await request(app).get('/api/docs/');
    expect([200, 301, 302]).toContain(res.status);
  });

  it('GET /api/v1/rota-inexistente deve retornar 404 padronizado', async () => {
    const res = await request(app).get('/api/v1/rota-inexistente');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
