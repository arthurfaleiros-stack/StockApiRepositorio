const categoriaService = require('../services/categoriaService');

class CategoriaController {
  async list(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const result = await categoriaService.listCategorias({ page, limit, search });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const categoria = await categoriaService.getCategoriaById(req.params.id);
      return res.status(200).json(categoria);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { nome, descricao } = req.body;
      const categoria = await categoriaService.createCategoria({ nome, descricao });
      return res.status(201).json({
        message: 'Categoria criada com sucesso.',
        categoria
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { nome, descricao } = req.body;
      const categoria = await categoriaService.updateCategoria(req.params.id, { nome, descricao });
      return res.status(200).json({
        message: 'Categoria atualizada com sucesso.',
        categoria
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await categoriaService.deleteCategoria(req.params.id);
      return res.status(200).json({
        message: 'Categoria excluída com sucesso.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoriaController();
