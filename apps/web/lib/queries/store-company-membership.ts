import { pool } from "@/lib/db";

export async function storeCompanyMembership(clerkId: string, companyId: string, role: string = "member") {

  const userResult = await pool.query(
    `SELECT id FROM users WHERE clerk_id = $1`,
    [clerkId]
  );

	if (userResult.rowCount === 0) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const userId = userResult.rows[0].id as string;

	const result = await pool.query(
		`INSERT INTO company_memberships (user_id, company_id, role, created_at)
		 VALUES ($1, $2, $3, NOW())
		 ON CONFLICT (user_id, company_id)
		 DO UPDATE SET
			 role = EXCLUDED.role
		 RETURNING *`,
		[userId, companyId, role]
	);

	if (result.rowCount === 0) {
		throw new Error("Failed to store company membership");
	}

	return result.rows[0];
}

