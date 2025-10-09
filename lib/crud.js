import { getPool } from "./db.js";

/**
 * Universal CRUD operations for any table.
 */
export const crud = {
  async getAll(table, orderBy = "id") {
    const pool = getPool();
    const [rows] = await pool.query(`SELECT * FROM ?? ORDER BY ?? ASC`, [
      table,
      orderBy,
    ]);
    return rows;
  },

  async getById(table, id) {
    const pool = getPool();
    const [rows] = await pool.query(`SELECT * FROM ?? WHERE id = ?`, [
      table,
      id,
    ]);
    return rows[0] || null;
  },

  async create(table, data) {
    const pool = getPool();
    const [result] = await pool.query(`INSERT INTO ?? SET ?`, [table, data]);
    return { id: result.insertId, ...data };
  },

  async update(table, id, data) {
    const pool = getPool();
    const [result] = await pool.query(`UPDATE ?? SET ? WHERE id = ?`, [
      table,
      data,
      id,
    ]);
    return result.affectedRows > 0;
  },

  async remove(table, id) {
    const pool = getPool();
    const [result] = await pool.query(`DELETE FROM ?? WHERE id = ?`, [
      table,
      id,
    ]);
    return result.affectedRows > 0;
  },
};
