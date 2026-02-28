import type { PoolClient } from "pg";
import { pool } from "../../db";

export async function markAccountingConnectionSynced(connectionId: string, client?: PoolClient) {
  const database = client ?? pool;

  return database.query(
    `UPDATE accounting_connections
     SET last_synced_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [connectionId]
  );
}
