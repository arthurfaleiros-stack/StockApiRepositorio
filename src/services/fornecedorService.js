const fornecedorRepository = require('../repositories/fornecedorRepository');
const AppError = require('../utils/appError');
const { isValidCNPJ } = require('../middlewares/validate');

class FornecedorService {
  async listFornecedores({ page = 1, limit = 20, search = '' }) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

    const [fornecedores, total] = await Promise.all([
      fornecedorRepository.findAll({ page: p, limit: l, search }),
      fornecedorRepository.countAll({ search })
    ]);

    return {
      data: fornecedores,
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l)
      }
    };
  }

  async getFornecedorById(id) {
    const fornecedor = await fornecedorRepository.findById(id);
    if (!fornecedor) {
      throw new AppError('Fornecedor não encontrado.', 404, 'SUPPLIER_NOT_FOUND');
    }
    return fornecedor;
  }

  async createFornecedor({ nome, cnpj, contato, endereco }) {
    if (!nome || !cnpj) {
      throw new AppError('Nome e CNPJ do fornecedor são obrigatórios.', 400, 'MISSING_FIELDS');
    }

    if (!isValidCNPJ(cnpj)) {
      throw new AppError('CNPJ fornecido é inválido.', 400, 'INVALID_CNPJ');
    }

    const existing = await fornecedorRepository.findByCnpj(cnpj);
    if (existing) {
      throw new AppError('Já existe um fornecedor cadastrado com este CNPJ.', 409, 'DUPLICATE_CNPJ');
    }

    return await fornecedorRepository.create({
      nome: nome.trim(),
      cnpj,
      contato,
      endereco
    });
  }

  async updateFornecedor(id, { nome, cnpj, contato, endereco }) {
    const fornecedor = await this.getFornecedorById(id);

    if (cnpj && cnpj !== fornecedor.cnpj) {
      if (!isValidCNPJ(cnpj)) {
        throw new AppError('CNPJ fornecido é inválido.', 400, 'INVALID_CNPJ');
      }
      const existing = await fornecedorRepository.findByCnpj(cnpj);
      if (existing && existing.id !== Number(id)) {
        throw new AppError('Já existe um fornecedor cadastrado com este CNPJ.', 409, 'DUPLICATE_CNPJ');
      }
    }

    return await fornecedorRepository.update(id, {
      nome: nome ? nome.trim() : fornecedor.nome,
      cnpj: cnpj || fornecedor.cnpj,
      contato: contato !== undefined ? contato : fornecedor.contato,
      endereco: endereco !== undefined ? endereco : fornecedor.endereco
    });
  }

  async deleteFornecedor(id) {
    await this.getFornecedorById(id);

    const totalProdutos = await fornecedorRepository.countProdutos(id);
    if (totalProdutos > 0) {
      throw new AppError(
        `Não é possível excluir este fornecedor pois ele possui ${totalProdutos} produto(s) vinculado(s).`,
        409,
        'RESTRICTED_RELATION'
      );
    }

    return await fornecedorRepository.delete(id);
  }
}

module.exports = new FornecedorService();
