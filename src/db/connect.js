const mysql = require('mysql2/promise');
require('dotenv').config();

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kstock_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
  queueLimit: 0,
  timezone: 'Z',
  dateStrings: true
};

const pool = mysql.createPool(poolConfig);

/**
 * Executa uma consulta SQL no pool de conexões
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<[Array, Array]>}
 */
async function query(sql, params = []) {
  return await pool.query(sql, params);
}

/**
 * Executa um bloco de operações atômicas em uma transação gerenciada
 * @param {Function} callback (connection) => Promise<any>
 * @returns {Promise<any>}
 */
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Testa a conexão ativa com o banco
 */
async function ping() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  withTransaction,
  ping
};
