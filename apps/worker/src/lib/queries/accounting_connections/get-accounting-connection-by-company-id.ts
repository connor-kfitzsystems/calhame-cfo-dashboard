import { PoolClient } from "pg";
import { pool } from "../../db.js";
import { AccountingConnectionRow } from "@repo/shared";

export async function getAccountingConnectionByCompanyId(companyId: string, client?: PoolClient) {
  const databbase = client ?? pool;

  const connectionResult = await databbase.query<AccountingConnectionRow>(
    `SELECT
        ac.id AS "connectionId",
        c.id AS "companyId",
        c.provider_id AS "providerId",
        c.provider_company_id AS "realmId",
        ac.access_token AS "accessToken",
        ac.refresh_token AS "refreshToken",
        ac.access_token_expires_at AS "accessTokenExpiresAt",
        ac.refresh_token_expires_at AS "refreshTokenExpiresAt"
      FROM accounting_connections ac
      JOIN companies c
        ON c.id = ac.company_id
      WHERE ac.company_id = $1
        AND ac.status = 'active'
      LIMIT 1`,
    [companyId]
  );

  if (connectionResult.rowCount === 0) {
    throw new Error("No active accounting connection found for company");
  }

  return connectionResult;
}
