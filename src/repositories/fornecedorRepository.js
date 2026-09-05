const { query } = require('../db/connect');

class FornecedorRepository {
  async findById(id) {
    const [rows] = await query(
      `SELECT f.*, (SELECT COUNT(*) FROM produto p WHERE p.fornecedor_id = f.id) as total_produtos 
       FROM fornecedor f 
       WHERE f.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findByCnpj(cnpj) {
    const [rows] = await query('SELECT * FROM fornecedor WHERE cnpj = ?', [cnpj]);
    return rows[0] || null;
  }

  async findAll({ page = 1, limit = 20, search = '' }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT f.*, (SELECT COUNT(*) FROM produto p WHERE p.fornecedor_id = f.id) as total_produtos 
      FROM fornecedor f
    `;
    const params = [];

    if (search) {
      sql += ' WHERE f.nome LIKE ? OR f.cnpj LIKE ? OR f.contato LIKE ?';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY f.nome ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await query(sql, params);
    return rows;
  }

  async countAll({ search = '' }) {
    let sql = 'SELECT COUNT(*) as total FROM fornecedor';
    const params = [];

    if (search) {
      sql += ' WHERE nome LIKE ? OR cnpj LIKE ? OR contato LIKE ?';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const [rows] = await query(sql, params);
    return rows[0].total;
  }

  async create({ nome, cnpj, contato = null, endereco = null }) {
    const [result] = await query(
      'INSERT INTO fornecedor (nome, cnpj, contato, endereco) VALUES (?, ?, ?, ?)',
      [nome, cnpj, contato, endereco]
    );
    return this.findById(result.insertId);
  }

  async update(id, { nome, cnpj, contato, endereco }) {
    await query(
      'UPDATE fornecedor SET nome = ?, cnpj = ?, contato = ?, endereco = ? WHERE id = ?',
      [nome, cnpj, contato, endereco, id]
    );
    return this.findById(id);
  }

  async countProdutos(id) {
    const [rows] = await query('SELECT COUNT(*) as total FROM produto WHERE fornecedor_id = ?', [id]);
    return rows[0].total;
  }

  async delete(id) {
    const [result] = await query('DELETE FROM fornecedor WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new FornecedorRepository();
