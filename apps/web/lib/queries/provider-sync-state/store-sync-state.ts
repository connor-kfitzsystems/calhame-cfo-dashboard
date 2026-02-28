import { Entity } from "@repo/shared";
import { pool } from "../../db";
import type { PoolClient } from "pg";

export async function storeSyncState(connectionId: string, entities: Entity[], client?: PoolClient) {
  const database = client ?? pool;

  const result = await database.query(
    `INSERT INTO provider_sync_state (
      connection_id,
      entity_type,
      cursor,
      last_synced_at,
      created_at
    )
    VALUES ($1, $2, NULL, NULL, NOW())
    ON CONFLICT (connection_id, entity_type)
    DO NOTHING
    RETURNING *;`,
    [connectionId, entities]
  );

  return result.rows[0];
}
