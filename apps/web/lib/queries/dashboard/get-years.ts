import { pool } from "@/lib/db";
import type { PoolClient } from "pg";

export default async function getYears(companyId: string, client?: PoolClient): Promise<number[]> {
  const database = client ?? pool;

  const result = await database.query(`
    SELECT DISTINCT EXTRACT(YEAR FROM transaction_date)::INTEGER AS year
    FROM (
      SELECT transaction_date FROM revenue_transactions WHERE company_id = $1
      UNION ALL
      SELECT transaction_date FROM cogs_transactions WHERE company_id = $1
      UNION ALL
      SELECT transaction_date FROM expense_transactions WHERE company_id = $1
    ) AS all_dates
    ORDER BY year ASC;
  `, [companyId]);

  return result.rows.map(row => row.year);
}
