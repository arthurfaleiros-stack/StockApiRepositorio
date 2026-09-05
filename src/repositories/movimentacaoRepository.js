const { query } = require('../db/connect');

class MovimentacaoRepository {
  async findById(id) {
    const [rows] = await query(
      `SELECT m.*, 
              u.nome as usuario_nome, 
              u.email as usuario_email,
              p.nome as produto_nome, 
              p.codigo as produto_codigo,
              p.quantidade_atual as produto_saldo_atual
       FROM movimentacao m
       JOIN usuario u ON m.usuario_id = u.id
       JOIN produto p ON m.produto_id = p.id
       WHERE m.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findAll({
    page = 1,
    limit = 20,
    produto_id = null,
    usuario_id = null,
    tipo = null,
    data_inicio = null,
    data_fim = null
  }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT m.*, 
             u.nome as usuario_nome, 
             u.email as usuario_email,
             p.nome as produto_nome, 
             p.codigo as produto_codigo
      FROM movimentacao m
      JOIN usuario u ON m.usuario_id = u.id
      JOIN produto p ON m.produto_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (produto_id) {
      sql += ' AND m.produto_id = ?';
      params.push(produto_id);
    }

    if (usuario_id) {
      sql += ' AND m.usuario_id = ?';
      params.push(usuario_id);
    }

    if (tipo) {
      sql += ' AND m.tipo = ?';
      params.push(tipo.toUpperCase());
    }

    if (data_inicio) {
      sql += ' AND m.data_hora >= ?';
      params.push(data_inicio);
    }

    if (data_fim) {
      sql += ' AND m.data_hora <= ?';
      params.push(data_fim);
    }

    sql += ' ORDER BY m.data_hora DESC, m.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await query(sql, params);
    return rows;
  }

  async countAll({
    produto_id = null,
    usuario_id = null,
    tipo = null,
    data_inicio = null,
    data_fim = null
  }) {
    let sql = 'SELECT COUNT(*) as total FROM movimentacao m WHERE 1=1';
    const params = [];

    if (produto_id) {
      sql += ' AND m.produto_id = ?';
      params.push(produto_id);
    }

    if (usuario_id) {
      sql += ' AND m.usuario_id = ?';
      params.push(usuario_id);
    }

    if (tipo) {
      sql += ' AND m.tipo = ?';
      params.push(tipo.toUpperCase());
    }

    if (data_inicio) {
      sql += ' AND m.data_hora >= ?';
      params.push(data_inicio);
    }

    if (data_fim) {
      sql += ' AND m.data_hora <= ?';
      params.push(data_fim);
    }

    const [rows] = await query(sql, params);
    return rows[0].total;
  }

  async create({ usuario_id, produto_id, tipo, quantidade, observacao = null }, connection = null) {
    const executor = connection || { query };
    const [result] = await executor.query(
      `INSERT INTO movimentacao (usuario_id, produto_id, tipo, quantidade, observacao)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario_id, produto_id, tipo.toUpperCase(), quantidade, observacao]
    );
    return result.insertId;
  }
}

module.exports = new MovimentacaoRepository();
