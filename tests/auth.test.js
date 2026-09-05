const request = require('supertest');
const app = require('../src/server');
const usuarioRepository = require('../src/repositories/usuarioRepository');
const assinaturaRepository = require('../src/repositories/assinaturaRepository');
const bcrypt = require('bcryptjs');

describe('Auth Endpoints & Regras de Negócio', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('deve rejeitar cadastro sem campos obrigatórios (400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ nome: 'Teste' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('deve rejeitar e-mail com formato inválido (400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ nome: 'Teste', email: 'emailinvalido', senha: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_EMAIL');
    });

    it('deve rejeitar senha com menos de 6 caracteres (400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ nome: 'Teste', email: 'teste@email.com', senha: '123' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('WEAK_PASSWORD');
    });

    it('deve rejeitar se e-mail já existir (409)', async () => {
      jest.spyOn(usuarioRepository, 'findByEmail').mockResolvedValue({
        id: 1,
        email: 'existente@kstock.com'
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ nome: 'Teste', email: 'existente@kstock.com', senha: '123456' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
    });

    it('deve cadastrar usuário com sucesso (201) e perfil OPERADOR padrão', async () => {
      jest.spyOn(usuarioRepository, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usuarioRepository, 'create').mockResolvedValue({
        id: 10,
        nome: 'Novo Usuário',
        email: 'novo@kstock.com',
        perfil: 'OPERADOR'
      });
      jest.spyOn(assinaturaRepository, 'create').mockResolvedValue({
        id: 1,
        usuario_id: 10,
        plano: 'FREE',
        status: 'ATIVO'
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ nome: 'Novo Usuário', email: 'novo@kstock.com', senha: 'MinhaSenha123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.perfil).toBe('OPERADOR');
      expect(res.body.user.email).toBe('novo@kstock.com');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('deve rejeitar login com credenciais incorretas (401)', async () => {
      jest.spyOn(usuarioRepository, 'findByEmail').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'naoexiste@kstock.com', senha: '123456' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('deve realizar login com sucesso (200) e retornar JWT', async () => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('SenhaCorreta@123', salt);

      jest.spyOn(usuarioRepository, 'findByEmail').mockResolvedValue({
        id: 1,
        nome: 'Admin',
        email: 'admin@kstock.com',
        senha_hash: hash,
        perfil: 'ADMIN'
      });
      jest.spyOn(assinaturaRepository, 'findByUsuarioId').mockResolvedValue({
        id: 1,
        plano: 'ENTERPRISE',
        status: 'ATIVO'
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@kstock.com', senha: 'SenhaCorreta@123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('admin@kstock.com');
      expect(res.body.user.perfil).toBe('ADMIN');
    });
  });

  describe('Middleware verifyJWT e verifyRole', () => {
    it('deve bloquear rota privada quando token não for informado (401)', async () => {
      const res = await request(app).get('/api/v1/produtos');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
