import { getPool } from "./db.js";

/**
 * Convert arrays/objects to JSON strings for MySQL storage
 */
function prepareDataForMySQL(data) {
  const prepared = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      prepared[key] = JSON.stringify(value);
    } else if (
      typeof value === "object" &&
      value !== null &&
      !(value instanceof Date)
    ) {
      prepared[key] = JSON.stringify(value);
    } else {
      prepared[key] = value;
    }
  }
  return prepared;
}

/**
 * Parse JSON strings back to arrays/objects
 */
function parseJSONFields(row) {
  if (!row) return row;
  const parsed = { ...row };
  for (const [key, value] of Object.entries(parsed)) {
    if (
      typeof value === "string" &&
      (value.startsWith("[") || value.startsWith("{"))
    ) {
      try {
        parsed[key] = JSON.parse(value);
      } catch (e) {}
    }
  }
  return parsed;
}

export const crud = {
  /**
   * Get all records with optional filtering, sorting, and pagination
   */
  async getAll(table, options = {}) {
    const pool = getPool();
    const {
      filters = {},
      operators = {},
      sortBy, // ← No default - ORDER BY only added if explicitly provided
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
        const validOperators = ["=", "!=", ">", "<", ">=", "<=", "LIKE"];
        if (!validOperators.includes(operator)) {
          throw new Error(`Invalid operator: ${operator}`);
        }
        whereConditions.push(`?? ${operator} ?`);
        params.push(key, filters[key]);
      }
      query += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    // Build ORDER BY clause - only if sortBy is provided
    if (sortBy) {
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
    }

    // Build LIMIT and OFFSET clause
    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));
    }

    const [rows] = await pool.query(query, params);
    return rows.map((row) => parseJSONFields(row));
  },

  async getById(table, id) {
    const pool = getPool();
    const [rows] = await pool.query(`SELECT * FROM ?? WHERE id = ?`, [
      table,
      id,
    ]);
    return rows[0] ? parseJSONFields(rows[0]) : null;
  },

  async create(table, data) {
    const pool = getPool();
    const preparedData = prepareDataForMySQL(data);
    const [result] = await pool.query(`INSERT INTO ?? SET ?`, [
      table,
      preparedData,
    ]);
    return { success: true, id: result.insertId };
  },

  async update(table, id, data) {
    const pool = getPool();
    const preparedData = prepareDataForMySQL(data);
    const [result] = await pool.query(`UPDATE ?? SET ? WHERE id = ?`, [
      table,
      preparedData,
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
