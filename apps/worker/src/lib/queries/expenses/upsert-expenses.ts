import { PoolClient } from "pg";
import { pool } from "../../db.js";

export async function upsertExpenses(
  companyId: string,
  category: string,
  amount: number,
  date: string,
  vendor?: string | null,
  client?: PoolClient | null
) {
  const database = client ?? pool;

  // Todo: Fix this
  await database.query(
    `WITH upsert AS (
       UPDATE expenses
       SET amount = $3, vendor = COALESCE($5, vendor), created_at = NOW()
       WHERE company_id = $1 AND category = $2 AND date = $4
       RETURNING *
     )
     INSERT INTO expenses (company_id, category, vendor, amount, date, created_at)
     SELECT $1, $2, $5, $3, $4, NOW()
     WHERE NOT EXISTS (SELECT 1 FROM upsert);`,
    [companyId, category, amount, date, vendor]
  );
}
