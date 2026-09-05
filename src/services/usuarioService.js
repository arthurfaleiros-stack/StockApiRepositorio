const bcrypt = require('bcryptjs');
const usuarioRepository = require('../repositories/usuarioRepository');
const AppError = require('../utils/appError');
const { isValidEmail } = require('../middlewares/validate');

class UsuarioService {
  async listUsers({ page = 1, limit = 20, search = '' }) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

    const [users, total] = await Promise.all([
      usuarioRepository.findAll({ page: p, limit: l, search }),
      usuarioRepository.countAll({ search })
    ]);

    return {
      data: users,
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l)
      }
    };
  }

  async getUserById(id) {
    const user = await usuarioRepository.findById(id);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
    }
    return user;
  }

  async createUser({ nome, email, senha, perfil = 'OPERADOR' }) {
    if (!nome || !email || !senha) {
      throw new AppError('Nome, e-mail e senha são obrigatórios.', 400, 'MISSING_FIELDS');
    }

    if (!isValidEmail(email)) {
      throw new AppError('Formato de e-mail inválido.', 400, 'INVALID_EMAIL');
    }

    const validProfiles = ['ADMIN', 'GERENTE', 'OPERADOR'];
    const normalizedPerfil = (perfil || '').toUpperCase();
    if (!validProfiles.includes(normalizedPerfil)) {
      throw new AppError(`Perfil inválido. Permitidos: ${validProfiles.join(', ')}`, 400, 'INVALID_PROFILE');
    }

    const existingUser = await usuarioRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Já existe um usuário com este e-mail.', 409, 'DUPLICATE_EMAIL');
    }

    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

    return await usuarioRepository.create({
      nome,
      email,
      senha_hash,
      perfil: normalizedPerfil
    });
  }

  async updateUser(id, { nome, email }) {
    const user = await this.getUserById(id);

    if (email && email !== user.email) {
      if (!isValidEmail(email)) {
        throw new AppError('Formato de e-mail inválido.', 400, 'INVALID_EMAIL');
      }
      const existing = await usuarioRepository.findByEmail(email);
      if (existing && existing.id !== Number(id)) {
        throw new AppError('Este e-mail já está em uso por outro usuário.', 409, 'DUPLICATE_EMAIL');
      }
    }

    return await usuarioRepository.update(id, {
      nome: nome || user.nome,
      email: email || user.email
    });
  }

  async updateUserPerfil(id, perfil) {
    await this.getUserById(id);

    const validProfiles = ['ADMIN', 'GERENTE', 'OPERADOR'];
    const normalizedPerfil = (perfil || '').toUpperCase();
    if (!validProfiles.includes(normalizedPerfil)) {
      throw new AppError(`Perfil inválido. Permitidos: ${validProfiles.join(', ')}`, 400, 'INVALID_PROFILE');
    }

    return await usuarioRepository.updatePerfil(id, normalizedPerfil);
  }

  async deleteUser(id, currentUserId) {
    if (Number(id) === Number(currentUserId)) {
      throw new AppError('Não é permitido excluir o próprio usuário logado.', 400, 'CANNOT_DELETE_SELF');
    }

    await this.getUserById(id);
    return await usuarioRepository.delete(id);
  }
}

module.exports = new UsuarioService();
