const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioRepository = require('../repositories/usuarioRepository');
const assinaturaRepository = require('../repositories/assinaturaRepository');
const AppError = require('../utils/appError');
const { isValidEmail } = require('../middlewares/validate');

class AuthService {
  async register({ nome, email, senha, perfil = 'OPERADOR' }) {
    if (!nome || !email || !senha) {
      throw new AppError('Nome, e-mail e senha são obrigatórios.', 400, 'MISSING_FIELDS');
    }

    if (!isValidEmail(email)) {
      throw new AppError('Formato de e-mail inválido.', 400, 'INVALID_EMAIL');
    }

    if (senha.length < 6) {
      throw new AppError('A senha deve conter no mínimo 6 caracteres.', 400, 'WEAK_PASSWORD');
    }

    const existingUser = await usuarioRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Já existe um usuário cadastrado com este e-mail.', 409, 'DUPLICATE_EMAIL');
    }

    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

    const user = await usuarioRepository.create({
      nome,
      email,
      senha_hash,
      perfil: perfil.toUpperCase()
    });

    // Criar assinatura inicial gratuita padrão
    const hoje = new Date().toISOString().split('T')[0];
    await assinaturaRepository.create({
      usuario_id: user.id,
      plano: 'FREE',
      data_inicio: hoje,
      status: 'ATIVO'
    });

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil
      },
      token
    };
  }

  async login({ email, senha }) {
    if (!email || !senha) {
      throw new AppError('E-mail e senha são obrigatórios.', 400, 'MISSING_FIELDS');
    }

    const user = await usuarioRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Credenciais inválidas.', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(senha, user.senha_hash);
    if (!isMatch) {
      throw new AppError('Credenciais inválidas.', 401, 'INVALID_CREDENTIALS');
    }

    const assinatura = await assinaturaRepository.findByUsuarioId(user.id);
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil
      },
      assinatura,
      token
    };
  }

  async getProfile(userId) {
    const user = await usuarioRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
    }

    const assinatura = await assinaturaRepository.findByUsuarioId(userId);

    return {
      user,
      assinatura
    };
  }

  generateToken(user) {
    const secret = process.env.JWT_SECRET || 'kstock_secret_key_default';
    const expiresIn = process.env.JWT_EXPIRES_IN || '8h';

    return jwt.sign(
      {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil
      },
      secret,
      { expiresIn }
    );
  }
}

module.exports = new AuthService();
