import { PoolClient } from "pg";
import { pool } from "../../db.js";

export async function upsertCogs(
  companyId: string,
  description: string,
  amount: number,
  date: string,
  client?: PoolClient | null
) {
  const database = client ?? pool;
  
  await database.query(
    `WITH upsert AS (
       UPDATE cogs
       SET amount = $3
       WHERE company_id = $1 AND description = $2 AND date = $4
       RETURNING *
     )
     INSERT INTO cogs (company_id, description, amount, date)
     SELECT $1, $2, $3, $4
     WHERE NOT EXISTS (SELECT 1 FROM upsert);`,
    [companyId, description, amount, date]
  );
}
