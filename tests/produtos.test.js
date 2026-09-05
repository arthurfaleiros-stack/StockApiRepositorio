const produtoService = require('../src/services/produtoService');
const categoriaService = require('../src/services/categoriaService');
const fornecedorService = require('../src/services/fornecedorService');
const produtoRepository = require('../src/repositories/produtoRepository');
const categoriaRepository = require('../src/repositories/categoriaRepository');
const fornecedorRepository = require('../src/repositories/fornecedorRepository');
const historicoRepository = require('../src/repositories/historicoRepository');

describe('Regras de Negócio de Produtos, Categorias e Fornecedores', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validações de Produto', () => {
    it('deve rejeitar criação com código SKU duplicado (409)', async () => {
      jest.spyOn(categoriaRepository, 'findById').mockResolvedValue({ id: 1, nome: 'Eletrônicos' });
      jest.spyOn(fornecedorRepository, 'findById').mockResolvedValue({ id: 1, nome: 'Fornecedor A' });
      jest.spyOn(produtoRepository, 'findByCodigo').mockResolvedValue({ id: 2, codigo: 'SKU-EXISTE' });

      await expect(
        produtoService.createProduto({
          categoria_id: 1,
          fornecedor_id: 1,
          nome: 'Produto Teste',
          codigo: 'SKU-EXISTE'
        }, 1)
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'DUPLICATE_SKU'
      });
    });

    it('deve bloquear exclusão de produto que possui movimentações registradas (409)', async () => {
      jest.spyOn(produtoRepository, 'findById').mockResolvedValue({
        id: 1,
        nome: 'Produto com Historico',
        codigo: 'PROD-01'
      });
      jest.spyOn(produtoRepository, 'countMovimentacoes').mockResolvedValue(15);

      await expect(
        produtoService.deleteProduto(1, 1)
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'RESTRICTED_RELATION'
      });
    });
  });

  describe('Validações de Categoria', () => {
    it('deve rejeitar categoria com nome duplicado (409)', async () => {
      jest.spyOn(categoriaRepository, 'findByNome').mockResolvedValue({ id: 1, nome: 'Eletrônicos' });

      await expect(
        categoriaService.createCategoria({ nome: 'Eletrônicos' })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'DUPLICATE_CATEGORY'
      });
    });

    it('deve impedir exclusão de categoria que possui produtos vinculados (409)', async () => {
      jest.spyOn(categoriaRepository, 'findById').mockResolvedValue({ id: 1, nome: 'Eletrônicos' });
      jest.spyOn(categoriaRepository, 'countProdutos').mockResolvedValue(5);

      await expect(
        categoriaService.deleteCategoria(1)
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'RESTRICTED_RELATION'
      });
    });
  });

  describe('Validações de Fornecedor', () => {
    it('deve rejeitar CNPJ inválido (400)', async () => {
      await expect(
        fornecedorService.createFornecedor({
          nome: 'Fornecedor Inválido',
          cnpj: '11.111.111/1111-11' // CNPJ inválido
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_CNPJ'
      });
    });

    it('deve rejeitar CNPJ duplicado (409)', async () => {
      jest.spyOn(fornecedorRepository, 'findByCnpj').mockResolvedValue({ id: 1, cnpj: '11.222.333/0001-81' });

      await expect(
        fornecedorService.createFornecedor({
          nome: 'Tech Brasil',
          cnpj: '11.222.333/0001-81'
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'DUPLICATE_CNPJ'
      });
    });
  });
});
