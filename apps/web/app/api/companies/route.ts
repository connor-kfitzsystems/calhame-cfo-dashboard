import { pool } from "@/lib/db";
import { getCompaniesByUser } from "@/lib/queries/companies/get-companies-by-user";
import { auth } from "@clerk/nextjs/server";

export async function GET() {

  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userResult = await pool.query(
      `SELECT id FROM users WHERE clerk_id = $1`,
      [clerkUserId]
    );

    if (userResult.rowCount === 0) {
      throw new Error("User not found");
    }

    const userId = userResult.rows[0].id as string;
    const companies = await getCompaniesByUser(userId);

    return Response.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return Response.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}
