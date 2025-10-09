import { getPool } from "./db.js";

const schemaCache = new Map();

export async function getTableSchema(table) {
  if (schemaCache.has(table)) return schemaCache.get(table);

  const pool = getPool();
  const [rows] = await pool.query(`SHOW COLUMNS FROM ??`, [table]);
  const schema = rows.map((col) => ({
    name: col.Field,
    type: col.Type,
    required: col.Null === "NO" && !col.Extra.includes("auto_increment"),
    isPrimary: col.Key === "PRI",
    default: col.Default,
  }));

  schemaCache.set(table, schema);
  return schema;
}
