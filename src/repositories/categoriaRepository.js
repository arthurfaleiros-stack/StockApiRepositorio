const { query } = require('../db/connect');

class CategoriaRepository {
  async findById(id) {
    const [rows] = await query(
      `SELECT c.*, (SELECT COUNT(*) FROM produto p WHERE p.categoria_id = c.id) as total_produtos 
       FROM categoria c 
       WHERE c.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findByNome(nome) {
    const [rows] = await query('SELECT * FROM categoria WHERE nome = ?', [nome]);
    return rows[0] || null;
  }

  async findAll({ page = 1, limit = 20, search = '' }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT c.*, (SELECT COUNT(*) FROM produto p WHERE p.categoria_id = c.id) as total_produtos 
      FROM categoria c
    `;
    const params = [];

    if (search) {
      sql += ' WHERE c.nome LIKE ? OR c.descricao LIKE ?';
      const term = `%${search}%`;
      params.push(term, term);
    }

    sql += ' ORDER BY c.nome ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await query(sql, params);
    return rows;
  }

  async countAll({ search = '' }) {
    let sql = 'SELECT COUNT(*) as total FROM categoria';
    const params = [];

    if (search) {
      sql += ' WHERE nome LIKE ? OR descricao LIKE ?';
      const term = `%${search}%`;
      params.push(term, term);
    }

    const [rows] = await query(sql, params);
    return rows[0].total;
  }

  async create({ nome, descricao = null }) {
    const [result] = await query(
      'INSERT INTO categoria (nome, descricao) VALUES (?, ?)',
      [nome, descricao]
    );
    return this.findById(result.insertId);
  }

  async update(id, { nome, descricao }) {
    await query(
      'UPDATE categoria SET nome = ?, descricao = ? WHERE id = ?',
      [nome, descricao, id]
    );
    return this.findById(id);
  }

  async countProdutos(id) {
    const [rows] = await query('SELECT COUNT(*) as total FROM produto WHERE categoria_id = ?', [id]);
    return rows[0].total;
  }

  async delete(id) {
    const [result] = await query('DELETE FROM categoria WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new CategoriaRepository();
