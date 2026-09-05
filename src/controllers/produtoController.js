const produtoService = require('../services/produtoService');
const AppError = require('../utils/appError');

class ProdutoController {
  async list(req, res, next) {
    try {
      const result = await produtoService.listProdutos(req.query);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async alertas(req, res, next) {
    try {
      const produtos = await produtoService.getAlertasEstoque();
      return res.status(200).json({
        total: produtos.length,
        data: produtos
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const produto = await produtoService.getProdutoById(req.params.id);
      return res.status(200).json(produto);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const produto = await produtoService.createProduto(req.body, req.user.id);
      return res.status(201).json({
        message: 'Produto cadastrado com sucesso.',
        produto
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const produto = await produtoService.updateProduto(req.params.id, req.body, req.user.id);
      return res.status(200).json({
        message: 'Produto atualizado com sucesso.',
        produto
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadFoto(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('Nenhum arquivo de imagem foi enviado.', 400, 'MISSING_FILE');
      }

      const fotoUrl = `/uploads/produtos/${req.file.filename}`;
      const produto = await produtoService.updateFoto(req.params.id, fotoUrl, req.user.id);

      return res.status(200).json({
        message: 'Foto do produto atualizada com sucesso.',
        foto_url: fotoUrl,
        produto
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await produtoService.deleteProduto(req.params.id, req.user.id);
      return res.status(200).json({
        message: 'Produto excluído com sucesso.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProdutoController();
