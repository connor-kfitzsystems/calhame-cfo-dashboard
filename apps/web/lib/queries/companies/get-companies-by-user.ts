import { pool } from "@/lib/db";
import type { PoolClient } from "pg";

export async function getCompaniesByUser(userId: string, client?: PoolClient) {
	const database = client ?? pool;

	const userCompaniesResult = await database.query(
		`SELECT
			  cm.id AS "companyMembershipId",
        c.name AS "companyName",
        ap.display_name AS "providerName"
      FROM company_memberships cm
      JOIN companies c
        ON c.id = cm.company_id
      LEFT JOIN accounting_connections ac
        ON ac.company_id = c.id
      LEFT JOIN accounting_providers ap
			ON ap.id = c.provider_id
      WHERE cm.user_id = $1
      ORDER BY c.name, ap.display_name`,
		[userId]
	);

	return userCompaniesResult.rows;
}
