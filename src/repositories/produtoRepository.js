const { query } = require('../db/connect');

class ProdutoRepository {
  async findById(id, connection = null) {
    const executor = connection || { query };
    const [rows] = await executor.query(
      `SELECT p.*, 
              c.nome as categoria_nome, 
              f.nome as fornecedor_nome, 
              f.cnpj as fornecedor_cnpj,
              (p.quantidade_atual <= p.quantidade_minima) as estoque_baixo
       FROM produto p
       LEFT JOIN categoria c ON p.categoria_id = c.id
       LEFT JOIN fornecedor f ON p.fornecedor_id = f.id
       WHERE p.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findByIdForUpdate(id, connection) {
    const [rows] = await connection.query(
      'SELECT * FROM produto WHERE id = ? FOR UPDATE',
      [id]
    );
    return rows[0] || null;
  }

  async findByCodigo(codigo) {
    const [rows] = await query('SELECT * FROM produto WHERE codigo = ?', [codigo]);
    return rows[0] || null;
  }

  async findAll({
    page = 1,
    limit = 20,
    search = '',
    categoria_id = null,
    fornecedor_id = null,
    alerta_estoque = false,
    sort = 'p.id',
    order = 'DESC'
  }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT p.*, 
             c.nome as categoria_nome, 
             f.nome as fornecedor_nome, 
             f.cnpj as fornecedor_cnpj,
             (p.quantidade_atual <= p.quantidade_minima) as estoque_baixo
      FROM produto p
      LEFT JOIN categoria c ON p.categoria_id = c.id
      LEFT JOIN fornecedor f ON p.fornecedor_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ' AND (p.nome LIKE ? OR p.codigo LIKE ? OR p.codigo_barras LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (categoria_id) {
      sql += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    if (fornecedor_id) {
      sql += ' AND p.fornecedor_id = ?';
      params.push(fornecedor_id);
    }

    if (alerta_estoque === true || alerta_estoque === 'true') {
      sql += ' AND p.quantidade_atual <= p.quantidade_minima';
    }

    const safeSort = ['id', 'nome', 'codigo', 'quantidade_atual', 'quantidade_minima', 'criado_em'].includes(sort.replace('p.', ''))
      ? sort
      : 'p.id';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY ${safeSort} ${safeOrder} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await query(sql, params);
    return rows;
  }

  async countAll({
    search = '',
    categoria_id = null,
    fornecedor_id = null,
    alerta_estoque = false
  }) {
    let sql = 'SELECT COUNT(*) as total FROM produto p WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (p.nome LIKE ? OR p.codigo LIKE ? OR p.codigo_barras LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (categoria_id) {
      sql += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    if (fornecedor_id) {
      sql += ' AND p.fornecedor_id = ?';
      params.push(fornecedor_id);
    }

    if (alerta_estoque === true || alerta_estoque === 'true') {
      sql += ' AND p.quantidade_atual <= p.quantidade_minima';
    }

    const [rows] = await query(sql, params);
    return rows[0].total;
  }

  async create({
    categoria_id,
    fornecedor_id,
    nome,
    codigo,
    descricao = null,
    quantidade_atual = 0,
    quantidade_minima = 0,
    codigo_barras = null,
    foto_url = null
  }) {
    const [result] = await query(
      `INSERT INTO produto 
       (categoria_id, fornecedor_id, nome, codigo, descricao, quantidade_atual, quantidade_minima, codigo_barras, foto_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [categoria_id, fornecedor_id, nome, codigo, descricao, quantidade_atual, quantidade_minima, codigo_barras, foto_url]
    );
    return this.findById(result.insertId);
  }

  async update(id, {
    categoria_id,
    fornecedor_id,
    nome,
    codigo,
    descricao,
    quantidade_minima,
    codigo_barras
  }) {
    await query(
      `UPDATE produto 
       SET categoria_id = ?, fornecedor_id = ?, nome = ?, codigo = ?, descricao = ?, quantidade_minima = ?, codigo_barras = ?
       WHERE id = ?`,
      [categoria_id, fornecedor_id, nome, codigo, descricao, quantidade_minima, codigo_barras, id]
    );
    return this.findById(id);
  }

  async updateQuantidade(id, novaQuantidade, connection = null) {
    const executor = connection || { query };
    await executor.query('UPDATE produto SET quantidade_atual = ? WHERE id = ?', [novaQuantidade, id]);
    return true;
  }

  async updateFoto(id, fotoUrl) {
    await query('UPDATE produto SET foto_url = ? WHERE id = ?', [fotoUrl, id]);
    return this.findById(id);
  }

  async countMovimentacoes(id) {
    const [rows] = await query('SELECT COUNT(*) as total FROM movimentacao WHERE produto_id = ?', [id]);
    return rows[0].total;
  }

  async delete(id) {
    const [result] = await query('DELETE FROM produto WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new ProdutoRepository();
