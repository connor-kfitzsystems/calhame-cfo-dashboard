import { pool } from "@/lib/db";
import type { PoolClient } from "pg";

export default async function getRevenueExpenseChartData(companyId: string, startDate: string, endDate: string, client?: PoolClient) {
  const database = client ?? pool;

  const result = await database.query(`
    WITH months AS (
      SELECT DATE_TRUNC('month', d) AS month
      FROM generate_series(
        DATE_TRUNC('month', $2::date),
        DATE_TRUNC('month', $3::date),
        interval '1 month'
      ) AS d
    ),
    agg AS (
      SELECT
        DATE_TRUNC('month', COALESCE(r.transaction_date, e.transaction_date)) AS month,
        SUM(r.amount) AS revenue,
        SUM(e.amount) AS expenses
      FROM revenue_transactions r
      FULL OUTER JOIN expense_transactions e
        ON DATE_TRUNC('month', r.transaction_date) = DATE_TRUNC('month', e.transaction_date)
      WHERE (
        r.company_id = $1 AND r.transaction_date BETWEEN $2 AND $3
      )
      OR (
        e.company_id = $1 AND e.transaction_date BETWEEN $2 AND $3
      )
      GROUP BY 1
    )
    SELECT
      EXTRACT(MONTH FROM m.month) AS month,
      a.revenue,
      a.expenses
    FROM months m
    LEFT JOIN agg a ON m.month = a.month
    ORDER BY m.month;
  `, [companyId, startDate, endDate]);

  return result.rows;
}
