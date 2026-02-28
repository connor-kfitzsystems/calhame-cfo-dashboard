import { pool } from "../../db";
import type { PoolClient } from "pg";

export async function storeCompany(providerCompanyId: string, name: string, providerId: string, client?: PoolClient) {
  const database = client ?? pool;

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

  return result.rows[0];
}
