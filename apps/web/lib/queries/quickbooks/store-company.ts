import { pool } from "../../db";

export async function storeCompany(companyId: string, name: string) {

  const result = await pool.query(
    `INSERT INTO companies (company_id, name, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (company_id)
     DO UPDATE SET
       name = EXCLUDED.name,
       updated_at = NOW()
     RETURNING *`,
    [companyId, name]
  );

  if (result.rowCount === 0) {
    throw new Error("Failed to store company");
  }

  return result.rows[0];
}