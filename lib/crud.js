import { getPool } from "./db.js";

/**
 * Universal CRUD operations for any table with advanced filtering, sorting, and pagination.
 */
export const crud = {
  /**
   * Get all records with optional filtering, sorting, and pagination
   * @param {string} table - Table name
   * @param {Object} options - Query options
   * @param {Object} options.filters - Key-value pairs for filtering (e.g., { status: 'active', user_id: 123 })
   * @param {Object} options.operators - Comparison operators for filters (e.g., { age: '>', price: '<=' })
   * @param {Array|string} options.sortBy - Column(s) to sort by (e.g., 'created_at' or ['status', 'created_at'])
   * @param {Array|string} options.order - Sort order(s) 'ASC' or 'DESC' (e.g., 'DESC' or ['ASC', 'DESC'])
   * @param {number} options.limit - Maximum number of records to return
   * @param {number} options.offset - Number of records to skip (for pagination)
   */
  async getAll(table, options = {}) {
    const pool = getPool();
    const {
      filters = {},
      operators = {},
      sortBy = "id",
      order = "ASC",
      limit,
      offset = 0,
    } = options;

    let query = `SELECT * FROM ??`;
    const params = [table];

    // Build WHERE clause
    const whereConditions = [];
    const filterKeys = Object.keys(filters);

    if (filterKeys.length > 0) {
      for (const key of filterKeys) {
        const operator = operators[key] || "=";
        // Validate operator to prevent SQL injection
        const validOperators = ["=", "!=", ">", "<", ">=", "<=", "LIKE"];
        if (!validOperators.includes(operator)) {
          throw new Error(`Invalid operator: ${operator}`);
        }
        whereConditions.push(`?? ${operator} ?`);
        params.push(key, filters[key]);
      }
      query += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    // Build ORDER BY clause
    const sortColumns = Array.isArray(sortBy) ? sortBy : [sortBy];
    const sortOrders = Array.isArray(order) ? order : [order];

    const orderClauses = sortColumns.map((col, idx) => {
      const sortOrder = (sortOrders[idx] || "ASC").toUpperCase();
      if (!["ASC", "DESC"].includes(sortOrder)) {
        throw new Error(`Invalid sort order: ${sortOrder}`);
      }
      params.push(col);
      return `?? ${sortOrder}`;
    });

    query += ` ORDER BY ${orderClauses.join(", ")}`;

    // Build LIMIT and OFFSET clause
    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));
    }

    const [rows] = await pool.query(query, params);
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
    return { success: true, id: result.insertId };
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

  /**
   * Get total count with optional filtering (useful for pagination)
   */
  async count(table, filters = {}, operators = {}) {
    const pool = getPool();
    let query = `SELECT COUNT(*) as total FROM ??`;
    const params = [table];

    const whereConditions = [];
    const filterKeys = Object.keys(filters);

    if (filterKeys.length > 0) {
      for (const key of filterKeys) {
        const operator = operators[key] || "=";
        const validOperators = ["=", "!=", ">", "<", ">=", "<=", "LIKE"];
        if (!validOperators.includes(operator)) {
          throw new Error(`Invalid operator: ${operator}`);
        }
        whereConditions.push(`?? ${operator} ?`);
        params.push(key, filters[key]);
      }
      query += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  },
};
