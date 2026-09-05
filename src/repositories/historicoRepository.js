const { query } = require('../db/connect');

class HistoricoRepository {
  async findById(id) {
    const [rows] = await query(
      `SELECT h.*, 
              u.nome as usuario_nome, 
              p.nome as produto_nome, 
              p.codigo as produto_codigo
       FROM historico h
       LEFT JOIN usuario u ON h.usuario_id = u.id
       LEFT JOIN produto p ON h.produto_id = p.id
       WHERE h.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findAll({
    page = 1,
    limit = 20,
    produto_id = null,
    usuario_id = null,
    movimentacao_id = null,
    tipo_operacao = null,
    data_inicio = null,
    data_fim = null
  }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT h.*, 
             u.nome as usuario_nome, 
             u.email as usuario_email,
             p.nome as produto_nome, 
             p.codigo as produto_codigo
      FROM historico h
      LEFT JOIN usuario u ON h.usuario_id = u.id
      LEFT JOIN produto p ON h.produto_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (produto_id) {
      sql += ' AND h.produto_id = ?';
      params.push(produto_id);
    }

    if (usuario_id) {
      sql += ' AND h.usuario_id = ?';
      params.push(usuario_id);
    }

    if (movimentacao_id) {
      sql += ' AND h.movimentacao_id = ?';
      params.push(movimentacao_id);
    }

    if (tipo_operacao) {
      sql += ' AND h.tipo_operacao = ?';
      params.push(tipo_operacao);
    }

    if (data_inicio) {
      sql += ' AND h.data_hora >= ?';
      params.push(data_inicio);
    }

    if (data_fim) {
      sql += ' AND h.data_hora <= ?';
      params.push(data_fim);
    }

    sql += ' ORDER BY h.data_hora DESC, h.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await query(sql, params);
    return rows;
  }

  async countAll({
    produto_id = null,
    usuario_id = null,
    movimentacao_id = null,
    tipo_operacao = null,
    data_inicio = null,
    data_fim = null
  }) {
    let sql = 'SELECT COUNT(*) as total FROM historico h WHERE 1=1';
    const params = [];

    if (produto_id) {
      sql += ' AND h.produto_id = ?';
      params.push(produto_id);
    }

    if (usuario_id) {
      sql += ' AND h.usuario_id = ?';
      params.push(usuario_id);
    }

    if (movimentacao_id) {
      sql += ' AND h.movimentacao_id = ?';
      params.push(movimentacao_id);
    }

    if (tipo_operacao) {
      sql += ' AND h.tipo_operacao = ?';
      params.push(tipo_operacao);
    }

    if (data_inicio) {
      sql += ' AND h.data_hora >= ?';
      params.push(data_inicio);
    }

    if (data_fim) {
      sql += ' AND h.data_hora <= ?';
      params.push(data_fim);
    }

    const [rows] = await query(sql, params);
    return rows[0].total;
  }

  async create({ usuario_id, produto_id, movimentacao_id = null, tipo_operacao, descricao }, connection = null) {
    const executor = connection || { query };
    const [result] = await executor.query(
      `INSERT INTO historico (usuario_id, produto_id, movimentacao_id, tipo_operacao, descricao)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario_id, produto_id, movimentacao_id, tipo_operacao, descricao]
    );
    return result.insertId;
  }
}

module.exports = new HistoricoRepository();
