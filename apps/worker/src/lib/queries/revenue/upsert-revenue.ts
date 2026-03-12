import type { PoolClient } from "pg";
import { pool } from "../../db.js";

export async function upsertRevenue(
  companyId: string,
  accountId: string,
  accountName: string,
  amount: number,
  date: string,
  client?: PoolClient
) {
  const database = client ?? pool;

  await database.query(
    `INSERT INTO revenue (
      company_id,
      provider_entity_id,
      provider_entity_type,
      provider_account_id,
      provider_account_name,
      source,
      amount,
      date
    )
    VALUES ($1, $2, 'pnl_account', $2, $3, $3, $4, $5)
    ON CONFLICT (company_id, provider_entity_id, provider_entity_type)
    DO UPDATE SET
      amount = EXCLUDED.amount,
      provider_account_name = EXCLUDED.provider_account_name,
      source = EXCLUDED.source,
      updated_at = now()`,
    [companyId, accountId, accountName, amount, date]
  );
}
