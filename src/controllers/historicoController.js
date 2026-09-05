const historicoService = require('../services/historicoService');

class HistoricoController {
  async list(req, res, next) {
    try {
      const result = await historicoService.listHistorico(req.query);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const item = await historicoService.getHistoricoById(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HistoricoController();
