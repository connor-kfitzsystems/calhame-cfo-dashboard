import { pool } from "@/lib/db";
import type { PoolClient } from "pg";

export async function deleteCompanyMembershipsById(companyMembershipId: string, client?: PoolClient) {
  const database = client ?? pool;

  const deleteCompanyMembershipResult = await database.query(
    `DELETE FROM company_memberships
     WHERE id = $1
     RETURNING id AS "companyMembershipId"`,
    [companyMembershipId]
  );
  
  return deleteCompanyMembershipResult.rows;
}
