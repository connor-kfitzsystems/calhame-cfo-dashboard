import type { PoolClient } from "pg";
import { pool } from "../../db";

export async function upsertProviderSyncStateLastSynced(
  connectionId: string,
  entityType: string,
  client?: PoolClient
) {
  const database = client ?? pool;

  return database.query(
    `INSERT INTO provider_sync_state (connection_id, entity_type, cursor, last_synced_at, created_at)
     VALUES ($1, $2, NULL, NOW(), NOW())
     ON CONFLICT (connection_id, entity_type)
     DO UPDATE SET last_synced_at = NOW()`,
    [connectionId, entityType]
  );
}
