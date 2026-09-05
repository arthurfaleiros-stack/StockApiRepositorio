const { query } = require('../db/connect');

class AssinaturaRepository {
  async findByUsuarioId(usuarioId) {
    const [rows] = await query(
      `SELECT a.*, u.nome as usuario_nome, u.email as usuario_email 
       FROM assinatura a 
       JOIN usuario u ON a.usuario_id = u.id 
       WHERE a.usuario_id = ? 
       ORDER BY a.id DESC LIMIT 1`,
      [usuarioId]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await query(
      `SELECT a.*, u.nome as usuario_nome, u.email as usuario_email 
       FROM assinatura a 
       JOIN usuario u ON a.usuario_id = u.id 
       WHERE a.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create({ usuario_id, plano = 'FREE', data_inicio, data_fim = null, status = 'ATIVO' }) {
    const [result] = await query(
      `INSERT INTO assinatura (usuario_id, plano, data_inicio, data_fim, status)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario_id, plano, data_inicio, data_fim, status]
    );
    return this.findById(result.insertId);
  }

  async updateStatus(id, status) {
    await query('UPDATE assinatura SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }

  async findAll({ page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const [rows] = await query(
      `SELECT a.*, u.nome as usuario_nome, u.email as usuario_email 
       FROM assinatura a 
       JOIN usuario u ON a.usuario_id = u.id 
       ORDER BY a.id DESC LIMIT ? OFFSET ?`,
      [parseInt(limit, 10), parseInt(offset, 10)]
    );
    return rows;
  }

  async countAll() {
    const [rows] = await query('SELECT COUNT(*) as total FROM assinatura');
    return rows[0].total;
  }
}

module.exports = new AssinaturaRepository();
