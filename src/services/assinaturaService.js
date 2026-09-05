const assinaturaRepository = require('../repositories/assinaturaRepository');
const usuarioRepository = require('../repositories/usuarioRepository');
const AppError = require('../utils/appError');

class AssinaturaService {
  async listAssinaturas({ page = 1, limit = 20 }) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

    const [assinaturas, total] = await Promise.all([
      assinaturaRepository.findAll({ page: p, limit: l }),
      assinaturaRepository.countAll()
    ]);

    return {
      data: assinaturas,
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l)
      }
    };
  }

  async getAssinaturaByUserId(usuarioId) {
    const assinatura = await assinaturaRepository.findByUsuarioId(usuarioId);
    if (!assinatura) {
      throw new AppError('Assinatura não encontrada para este usuário.', 404, 'SUBSCRIPTION_NOT_FOUND');
    }
    return assinatura;
  }

  async getAssinaturaById(id) {
    const assinatura = await assinaturaRepository.findById(id);
    if (!assinatura) {
      throw new AppError('Assinatura não encontrada.', 404, 'SUBSCRIPTION_NOT_FOUND');
    }
    return assinatura;
  }

  async createAssinatura({ usuario_id, plano = 'FREE', data_inicio, data_fim = null, status = 'ATIVO' }) {
    const user = await usuarioRepository.findById(usuario_id);
    if (!user) {
      throw new AppError('Usuário referenciado não existe.', 404, 'USER_NOT_FOUND');
    }

    const validPlans = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
    const validStatus = ['ATIVO', 'INATIVO', 'CANCELADO', 'PENDENTE'];

    const normalizedPlano = (plano || '').toUpperCase();
    const normalizedStatus = (status || '').toUpperCase();

    if (!validPlans.includes(normalizedPlano)) {
      throw new AppError(`Plano inválido. Permitidos: ${validPlans.join(', ')}`, 400, 'INVALID_PLAN');
    }

    if (!validStatus.includes(normalizedStatus)) {
      throw new AppError(`Status inválido. Permitidos: ${validStatus.join(', ')}`, 400, 'INVALID_STATUS');
    }

    const startDate = data_inicio || new Date().toISOString().split('T')[0];

    return await assinaturaRepository.create({
      usuario_id,
      plano: normalizedPlano,
      data_inicio: startDate,
      data_fim,
      status: normalizedStatus
    });
  }

  async updateStatus(id, status) {
    await this.getAssinaturaById(id);

    const validStatus = ['ATIVO', 'INATIVO', 'CANCELADO', 'PENDENTE'];
    const normalizedStatus = (status || '').toUpperCase();

    if (!validStatus.includes(normalizedStatus)) {
      throw new AppError(`Status inválido. Permitidos: ${validStatus.join(', ')}`, 400, 'INVALID_STATUS');
    }

    return await assinaturaRepository.updateStatus(id, normalizedStatus);
  }
}

module.exports = new AssinaturaService();
