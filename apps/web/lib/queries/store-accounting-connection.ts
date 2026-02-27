import { pool } from "@/lib/db";
import { encryptTokenForStorage } from "@/lib/token-crypto";
import type { PoolClient } from "pg";

export async function storeAccountingConnection(
  companyId: string,
  accessToken: string,
  refreshToken: string,
  accessTokenExpiresAt: Date,
  refreshTokenExpiresAt: Date,
  client?: PoolClient
) {
  const databbase = client ?? pool;

  const encryptedAccessToken = encryptTokenForStorage(accessToken);
  const encryptedRefreshToken = encryptTokenForStorage(refreshToken);

  const result = await databbase.query(
    `WITH updated AS (
      UPDATE accounting_connections ac
      SET
        access_token = $2,
        refresh_token = $3,
        access_token_expires_at = $4,
        refresh_token_expires_at = $5,
        status = 'active',
        updated_at = NOW()
      WHERE ac.company_id = $1
      RETURNING ac.*
    ),
    inserted AS (
      INSERT INTO accounting_connections (
        company_id,
        access_token,
        refresh_token,
        access_token_expires_at,
        refresh_token_expires_at,
        status,
        created_at,
        updated_at
      )
      SELECT
        $1,
        $2,
        $3,
        $4,
        $5,
        'active',
        NOW(),
        NOW()
      WHERE NOT EXISTS (SELECT 1 FROM updated)
      RETURNING *
    )
    SELECT * FROM updated
    UNION ALL
    SELECT * FROM inserted`,
    [companyId, encryptedAccessToken, encryptedRefreshToken, accessTokenExpiresAt, refreshTokenExpiresAt]
  );

  if (result.rowCount === 0) {
    throw new Error(
      "Failed to store accounting connection"
    );
  }

  return result.rows[0];
}
