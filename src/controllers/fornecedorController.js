const fornecedorService = require('../services/fornecedorService');

class FornecedorController {
  async list(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const result = await fornecedorService.listFornecedores({ page, limit, search });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const fornecedor = await fornecedorService.getFornecedorById(req.params.id);
      return res.status(200).json(fornecedor);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { nome, cnpj, contato, endereco } = req.body;
      const fornecedor = await fornecedorService.createFornecedor({ nome, cnpj, contato, endereco });
      return res.status(201).json({
        message: 'Fornecedor cadastrado com sucesso.',
        fornecedor
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { nome, cnpj, contato, endereco } = req.body;
      const fornecedor = await fornecedorService.updateFornecedor(req.params.id, { nome, cnpj, contato, endereco });
      return res.status(200).json({
        message: 'Fornecedor atualizado com sucesso.',
        fornecedor
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await fornecedorService.deleteFornecedor(req.params.id);
      return res.status(200).json({
        message: 'Fornecedor excluído com sucesso.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FornecedorController();
