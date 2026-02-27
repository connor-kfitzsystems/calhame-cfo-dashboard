import { pool } from "../../db";
import type { PoolClient } from "pg";

export async function storeCompany(providerCompanyId: string, name: string, provider: string, client?: PoolClient) {
  const database = client ?? pool;

  const providerIdResult = await database.query(
    `SELECT id FROM accounting_providers WHERE display_name = $1`,
    [provider]
  );

  if (providerIdResult.rowCount === 0) {
    throw new Error("Accounting provider not found");
  }

  const providerId = providerIdResult.rows[0].id;

  const result = await database.query(
    `INSERT INTO companies (provider_company_id, name, provider_id, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (provider_company_id, provider_id)
     DO UPDATE SET
       name = EXCLUDED.name,
       provider_id = EXCLUDED.provider_id,
       updated_at = NOW()
     RETURNING *`,
    [providerCompanyId, name, providerId]
  );

  if (result.rowCount === 0) {
    throw new Error("Failed to store company");
  }

  return result.rows[0];
}
