const movimentacaoService = require('../services/movimentacaoService');

class MovimentacaoController {
  async list(req, res, next) {
    try {
      const result = await movimentacaoService.listMovimentacoes(req.query);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const movimentacao = await movimentacaoService.getMovimentacaoById(req.params.id);
      return res.status(200).json(movimentacao);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { produto_id, tipo, quantidade, observacao } = req.body;
      const movimentacao = await movimentacaoService.createMovimentacao({
        usuario_id: req.user.id,
        produto_id,
        tipo,
        quantidade,
        observacao
      });

      return res.status(201).json({
        message: 'Movimentação de estoque realizada com sucesso.',
        movimentacao
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MovimentacaoController();
