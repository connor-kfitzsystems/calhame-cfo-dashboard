import { PoolClient } from "pg";
import { pool } from "../../db";
import { encryptTokenForStorage } from "../../token-crypto";

export async function updateAccountingConnectionById(id: string, currentAccessToken: string, currentRefreshToken: string | null, currentAccessTokenExpiresAt: Date, currentRefreshTokenExpiresAt: Date | null, client?: PoolClient) {
  const databbase = client ?? pool;

  return await databbase.query(
    `UPDATE accounting_connections
      SET
        access_token = $2,
        refresh_token = $3,
        access_token_expires_at = $4,
        refresh_token_expires_at = $5,
        updated_at = NOW()
      WHERE id = $1`,
    [
      id,
      encryptTokenForStorage(currentAccessToken),
      currentRefreshToken ? encryptTokenForStorage(currentRefreshToken) : null,
      currentAccessTokenExpiresAt,
      currentRefreshTokenExpiresAt
    ]
  );
}
