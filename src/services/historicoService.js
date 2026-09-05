const historicoRepository = require('../repositories/historicoRepository');
const AppError = require('../utils/appError');

class HistoricoService {
  async listHistorico(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));

    const [historico, total] = await Promise.all([
      historicoRepository.findAll({ ...query, page, limit }),
      historicoRepository.countAll(query)
    ]);

    return {
      data: historico,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getHistoricoById(id) {
    const item = await historicoRepository.findById(id);
    if (!item) {
      throw new AppError('Registro de histórico não encontrado.', 404, 'HISTORY_NOT_FOUND');
    }
    return item;
  }
}

module.exports = new HistoricoService();
