const db = require('../db/connect');
const movimentacaoRepository = require('../repositories/movimentacaoRepository');
const produtoRepository = require('../repositories/produtoRepository');
const historicoRepository = require('../repositories/historicoRepository');
const AppError = require('../utils/appError');

class MovimentacaoService {
  async listMovimentacoes(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));

    const [movimentacoes, total] = await Promise.all([
      movimentacaoRepository.findAll({ ...query, page, limit }),
      movimentacaoRepository.countAll(query)
    ]);

    return {
      data: movimentacoes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getMovimentacaoById(id) {
    const movimentacao = await movimentacaoRepository.findById(id);
    if (!movimentacao) {
      throw new AppError('Movimentação não encontrada.', 404, 'MOVEMENT_NOT_FOUND');
    }
    return movimentacao;
  }

  async createMovimentacao({ usuario_id, produto_id, tipo, quantidade, observacao }) {
    if (!usuario_id || !produto_id || !tipo || quantidade === undefined || quantidade === null) {
      throw new AppError('Usuário, produto, tipo e quantidade são obrigatórios.', 400, 'MISSING_FIELDS');
    }

    const normalizedTipo = tipo.toUpperCase();
    const validTipos = ['ENTRADA', 'SAIDA', 'AJUSTE'];
    if (!validTipos.includes(normalizedTipo)) {
      throw new AppError(`Tipo de movimentação inválido. Permitidos: ${validTipos.join(', ')}`, 400, 'INVALID_TYPE');
    }

    const qtd = parseInt(quantidade, 10);
    if (isNaN(qtd) || (normalizedTipo !== 'AJUSTE' && qtd <= 0) || (normalizedTipo === 'AJUSTE' && qtd < 0)) {
      throw new AppError('A quantidade movimentada deve ser um número inteiro válido e positivo.', 400, 'INVALID_QUANTITY');
    }

    // Executa toda a alteração atômica em transação gerenciada
    const movimentacaoId = await db.withTransaction(async (connection) => {
      // 1. Obter produto com lock exclusivo FOR UPDATE
      const produto = await produtoRepository.findByIdForUpdate(produto_id, connection);
      if (!produto) {
        throw new AppError('Produto não encontrado para movimentação.', 404, 'PRODUCT_NOT_FOUND');
      }

      const saldoAnterior = Number(produto.quantidade_atual);
      let novoSaldo = saldoAnterior;
      let descricaoHistorico = '';

      if (normalizedTipo === 'ENTRADA') {
        novoSaldo = saldoAnterior + qtd;
        descricaoHistorico = `Entrada de ${qtd} un. no produto "${produto.nome}". Saldo anterior: ${saldoAnterior}, novo saldo: ${novoSaldo}.`;
      } else if (normalizedTipo === 'SAIDA') {
        if (qtd > saldoAnterior) {
          throw new AppError(
            `Saldo insuficiente em estoque. Saldo disponível: ${saldoAnterior}, quantidade solicitada para saída: ${qtd}.`,
            422,
            'INSUFFICIENT_STOCK',
            { saldoAtual: saldoAnterior, quantidadeSolicitada: qtd }
          );
        }
        novoSaldo = saldoAnterior - qtd;
        descricaoHistorico = `Saída de ${qtd} un. no produto "${produto.nome}". Saldo anterior: ${saldoAnterior}, novo saldo: ${novoSaldo}.`;
      } else if (normalizedTipo === 'AJUSTE') {
        novoSaldo = qtd;
        const diff = novoSaldo - saldoAnterior;
        descricaoHistorico = `Ajuste de inventário do produto "${produto.nome}" para ${novoSaldo} un. (diferença: ${diff >= 0 ? '+' : ''}${diff}). Saldo anterior: ${saldoAnterior}.`;
      }

      // 2. Atualiza o saldo no produto
      await produtoRepository.updateQuantidade(produto_id, novoSaldo, connection);

      // 3. Registra a movimentação
      const movId = await movimentacaoRepository.create(
        {
          usuario_id,
          produto_id,
          tipo: normalizedTipo,
          quantidade: qtd,
          observacao
        },
        connection
      );

      // 4. Registra na trilha de auditoria (histórico)
      await historicoRepository.create(
        {
          usuario_id,
          produto_id,
          movimentacao_id: movId,
          tipo_operacao: 'MOVIMENTACAO_ESTOQUE',
          descricao: descricaoHistorico + (observacao ? ` Obs: ${observacao}` : '')
        },
        connection
      );

      return movId;
    });

    return await this.getMovimentacaoById(movimentacaoId);
  }
}

module.exports = new MovimentacaoService();
