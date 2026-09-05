const assinaturaService = require('../services/assinaturaService');

class AssinaturaController {
  async list(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await assinaturaService.listAssinaturas({ page, limit });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async minha(req, res, next) {
    try {
      const assinatura = await assinaturaService.getAssinaturaByUserId(req.user.id);
      return res.status(200).json(assinatura);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const assinatura = await assinaturaService.getAssinaturaById(req.params.id);
      return res.status(200).json(assinatura);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { usuario_id, plano, data_inicio, data_fim, status } = req.body;
      const assinatura = await assinaturaService.createAssinatura({
        usuario_id,
        plano,
        data_inicio,
        data_fim,
        status
      });
      return res.status(201).json({
        message: 'Assinatura criada com sucesso.',
        assinatura
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const assinatura = await assinaturaService.updateStatus(req.params.id, status);
      return res.status(200).json({
        message: 'Status da assinatura atualizado com sucesso.',
        assinatura
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssinaturaController();
