const movimentacaoService = require('../src/services/movimentacaoService');
const produtoRepository = require('../src/repositories/produtoRepository');
const movimentacaoRepository = require('../src/repositories/movimentacaoRepository');
const historicoRepository = require('../src/repositories/historicoRepository');
const dbConnect = require('../src/db/connect');

describe('Regras de Negócio de Movimentação de Estoque', () => {
  beforeEach(() => {
    jest.restoreAllMocks();

    // Mock da transação para executar callback diretamente com objeto connection mockado
    jest.spyOn(dbConnect, 'withTransaction').mockImplementation(async (callback) => {
      const mockConn = {
        query: jest.fn().mockResolvedValue([[]])
      };
      return await callback(mockConn);
    });
  });

  it('deve aumentar o saldo em movimentação de ENTRADA', async () => {
    const mockProduto = {
      id: 1,
      nome: 'Teclado Mecânico',
      quantidade_atual: 20
    };

    jest.spyOn(produtoRepository, 'findByIdForUpdate').mockResolvedValue(mockProduto);
    const updateQtdSpy = jest.spyOn(produtoRepository, 'updateQuantidade').mockResolvedValue(true);
    const createMovSpy = jest.spyOn(movimentacaoRepository, 'create').mockResolvedValue(100);
    const createHistSpy = jest.spyOn(historicoRepository, 'create').mockResolvedValue(200);
    jest.spyOn(movimentacaoRepository, 'findById').mockResolvedValue({
      id: 100,
      tipo: 'ENTRADA',
      quantidade: 10,
      produto_nome: 'Teclado Mecânico'
    });

    const result = await movimentacaoService.createMovimentacao({
      usuario_id: 1,
      produto_id: 1,
      tipo: 'ENTRADA',
      quantidade: 10,
      observacao: 'Compra de lote'
    });

    expect(updateQtdSpy).toHaveBeenCalledWith(1, 30, expect.anything()); // 20 + 10 = 30
    expect(createMovSpy).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'ENTRADA', quantidade: 10 }),
      expect.anything()
    );
    expect(createHistSpy).toHaveBeenCalledWith(
      expect.objectContaining({ tipo_operacao: 'MOVIMENTACAO_ESTOQUE' }),
      expect.anything()
    );
    expect(result.id).toBe(100);
  });

  it('deve diminuir o saldo em movimentação de SAIDA quando houver saldo suficiente', async () => {
    const mockProduto = {
      id: 1,
      nome: 'Teclado Mecânico',
      quantidade_atual: 20
    };

    jest.spyOn(produtoRepository, 'findByIdForUpdate').mockResolvedValue(mockProduto);
    const updateQtdSpy = jest.spyOn(produtoRepository, 'updateQuantidade').mockResolvedValue(true);
    jest.spyOn(movimentacaoRepository, 'create').mockResolvedValue(101);
    jest.spyOn(historicoRepository, 'create').mockResolvedValue(201);
    jest.spyOn(movimentacaoRepository, 'findById').mockResolvedValue({
      id: 101,
      tipo: 'SAIDA',
      quantidade: 5
    });

    await movimentacaoService.createMovimentacao({
      usuario_id: 1,
      produto_id: 1,
      tipo: 'SAIDA',
      quantidade: 5
    });

    expect(updateQtdSpy).toHaveBeenCalledWith(1, 15, expect.anything()); // 20 - 5 = 15
  });

  it('deve abortar e lançar erro 422 (INSUFFICIENT_STOCK) quando a saída for maior que o saldo disponível', async () => {
    const mockProduto = {
      id: 1,
      nome: 'Teclado Mecânico',
      quantidade_atual: 5 // saldo atual apenas 5
    };

    jest.spyOn(produtoRepository, 'findByIdForUpdate').mockResolvedValue(mockProduto);
    const updateQtdSpy = jest.spyOn(produtoRepository, 'updateQuantidade');

    await expect(
      movimentacaoService.createMovimentacao({
        usuario_id: 1,
        produto_id: 1,
        tipo: 'SAIDA',
        quantidade: 10 // tentativa de retirar 10
      })
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'INSUFFICIENT_STOCK'
    });

    expect(updateQtdSpy).not.toHaveBeenCalled();
  });

  it('deve atualizar o estoque para o valor exato no tipo AJUSTE', async () => {
    const mockProduto = {
      id: 1,
      nome: 'Teclado Mecânico',
      quantidade_atual: 50
    };

    jest.spyOn(produtoRepository, 'findByIdForUpdate').mockResolvedValue(mockProduto);
    const updateQtdSpy = jest.spyOn(produtoRepository, 'updateQuantidade').mockResolvedValue(true);
    jest.spyOn(movimentacaoRepository, 'create').mockResolvedValue(102);
    jest.spyOn(historicoRepository, 'create').mockResolvedValue(202);
    jest.spyOn(movimentacaoRepository, 'findById').mockResolvedValue({ id: 102 });

    await movimentacaoService.createMovimentacao({
      usuario_id: 1,
      produto_id: 1,
      tipo: 'AJUSTE',
      quantidade: 42 // inventário físico constatou 42 unidades
    });

    expect(updateQtdSpy).toHaveBeenCalledWith(1, 42, expect.anything());
  });

  it('deve rejeitar tipo de movimentação desconhecido (400)', async () => {
    await expect(
      movimentacaoService.createMovimentacao({
        usuario_id: 1,
        produto_id: 1,
        tipo: 'TIPO_INVALIDO',
        quantidade: 10
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_TYPE'
    });
  });

  it('deve rejeitar quantidade negativa em entrada ou saída (400)', async () => {
    await expect(
      movimentacaoService.createMovimentacao({
        usuario_id: 1,
        produto_id: 1,
        tipo: 'ENTRADA',
        quantidade: -5
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_QUANTITY'
    });
  });
});
