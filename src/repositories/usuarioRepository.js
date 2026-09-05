const { query } = require('../db/connect');

class UsuarioRepository {
  async findByEmail(email) {
    const [rows] = await query('SELECT * FROM usuario WHERE email = ?', [email]);
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await query(
      'SELECT id, nome, email, perfil, criado_em, atualizado_em FROM usuario WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  async findByIdWithPassword(id) {
    const [rows] = await query('SELECT * FROM usuario WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async create({ nome, email, senha_hash, perfil = 'OPERADOR' }) {
    const [result] = await query(
      'INSERT INTO usuario (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)',
      [nome, email, senha_hash, perfil]
    );
    return this.findById(result.insertId);
  }

  async findAll({ page = 1, limit = 20, search = '' }) {
    const offset = (page - 1) * limit;
    let sql = 'SELECT id, nome, email, perfil, criado_em, atualizado_em FROM usuario';
    const params = [];

    if (search) {
      sql += ' WHERE nome LIKE ? OR email LIKE ?';
      const term = `%${search}%`;
      params.push(term, term);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await query(sql, params);
    return rows;
  }

  async countAll({ search = '' }) {
    let sql = 'SELECT COUNT(*) as total FROM usuario';
    const params = [];

    if (search) {
      sql += ' WHERE nome LIKE ? OR email LIKE ?';
      const term = `%${search}%`;
      params.push(term, term);
    }

    const [rows] = await query(sql, params);
    return rows[0].total;
  }

  async update(id, { nome, email }) {
    await query('UPDATE usuario SET nome = ?, email = ? WHERE id = ?', [nome, email, id]);
    return this.findById(id);
  }

  async updatePerfil(id, perfil) {
    await query('UPDATE usuario SET perfil = ? WHERE id = ?', [perfil, id]);
    return this.findById(id);
  }

  async updateSenha(id, senha_hash) {
    await query('UPDATE usuario SET senha_hash = ? WHERE id = ?', [senha_hash, id]);
    return true;
  }

  async delete(id) {
    const [result] = await query('DELETE FROM usuario WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new UsuarioRepository();
