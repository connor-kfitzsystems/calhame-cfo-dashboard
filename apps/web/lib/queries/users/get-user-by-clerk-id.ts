import { pool } from "@/lib/db";
import type { PoolClient } from "pg";

export async function getUserByClerkId(clerkId: string, client?: PoolClient) {
  const database = client ?? pool;

  const userResult = await database.query(
    `SELECT id FROM users WHERE clerk_id = $1`,
    [clerkId]
  );

  if (userResult.rowCount === 0) {
    throw new Error("User not found");
  }
  
  return userResult.rows;
}
