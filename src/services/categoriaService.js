const categoriaRepository = require('../repositories/categoriaRepository');
const AppError = require('../utils/appError');

class CategoriaService {
  async listCategorias({ page = 1, limit = 20, search = '' }) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

    const [categorias, total] = await Promise.all([
      categoriaRepository.findAll({ page: p, limit: l, search }),
      categoriaRepository.countAll({ search })
    ]);

    return {
      data: categorias,
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l)
      }
    };
  }

  async getCategoriaById(id) {
    const categoria = await categoriaRepository.findById(id);
    if (!categoria) {
      throw new AppError('Categoria não encontrada.', 404, 'CATEGORY_NOT_FOUND');
    }
    return categoria;
  }

  async createCategoria({ nome, descricao }) {
    if (!nome || !nome.trim()) {
      throw new AppError('O nome da categoria é obrigatório.', 400, 'MISSING_NAME');
    }

    const trimmedNome = nome.trim();
    const existing = await categoriaRepository.findByNome(trimmedNome);
    if (existing) {
      throw new AppError('Já existe uma categoria cadastrada com este nome.', 409, 'DUPLICATE_CATEGORY');
    }

    return await categoriaRepository.create({ nome: trimmedNome, descricao });
  }

  async updateCategoria(id, { nome, descricao }) {
    const categoria = await this.getCategoriaById(id);

    if (nome && nome.trim()) {
      const trimmedNome = nome.trim();
      if (trimmedNome.toLowerCase() !== categoria.nome.toLowerCase()) {
        const existing = await categoriaRepository.findByNome(trimmedNome);
        if (existing && existing.id !== Number(id)) {
          throw new AppError('Já existe uma categoria cadastrada com este nome.', 409, 'DUPLICATE_CATEGORY');
        }
      }
      return await categoriaRepository.update(id, {
        nome: trimmedNome,
        descricao: descricao !== undefined ? descricao : categoria.descricao
      });
    }

    return await categoriaRepository.update(id, {
      nome: categoria.nome,
      descricao: descricao !== undefined ? descricao : categoria.descricao
    });
  }

  async deleteCategoria(id) {
    await this.getCategoriaById(id);

    const totalProdutos = await categoriaRepository.countProdutos(id);
    if (totalProdutos > 0) {
      throw new AppError(
        `Não é possível excluir esta categoria pois ela possui ${totalProdutos} produto(s) vinculado(s).`,
        409,
        'RESTRICTED_RELATION'
      );
    }

    return await categoriaRepository.delete(id);
  }
}

module.exports = new CategoriaService();
