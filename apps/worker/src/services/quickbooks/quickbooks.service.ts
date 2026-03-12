import { Entity } from "@repo/shared";
import { getRequiredEnv, isExpiringSoon, quickbooksRequest } from "../../lib/helpers.js";
import { withRetry } from "../../lib/retry-helper.js";
import { getAccountingConnectionByCompanyId } from "../../lib/queries/accounting_connections/get-accounting-connection-by-company-id.js";
import { markAccountingConnectionSynced } from "../../lib/queries/accounting_connections/mark-accounting-connection-synced.js";
import { updateAccountingConnectionById } from "../../lib/queries/accounting_connections/update-accounting-connection-by-id.js";
import { decryptTokenFromStorage } from "../../lib/token-crypto.js";
import { syncRevenue } from "./quickbooks-revenue.service.js";
import { syncCogs } from "./quickbooks-cogs.service.js";
import { syncExpenses } from "./quickbooks-expenses.service.js";

export async function syncQuickBooksCompany(companyId: string, entities: Entity[]) {
  console.log(`Starting QuickBooks sync for company ${companyId}, entities ${entities}...`);

  const connectionResult = await getAccountingConnectionByCompanyId(companyId);
  const row = connectionResult.rows[0];

  if (!row) {
    throw new Error("No active accounting connection found for company");
  }

  const { currentAccessToken, companyInfoRes } = await prepareQuickBooksTokensAndVerifyCompany(row);

  await companyInfoRes.json();

  const startDate = "2024-01-01";
  const endDate = new Date().toISOString().split("T")[0] as string;

  const pnl = await fetchProfitAndLoss(
    row.realmId,
    currentAccessToken,
    startDate,
    endDate
  );

  for (const entity of entities) {
    switch (entity) {
      case "revenue":
        await syncRevenue(companyId, row, endDate, pnl);
        break;
      case "cogs":
        await syncCogs(companyId, row, endDate, pnl);
        break;
      case "expenses":
        await syncExpenses(companyId, row, endDate, pnl);
        break;
      default:
        console.error(`Unknown entity type: ${entity}`);
        break;
    }
  }
  
  await markAccountingConnectionSynced(row.connectionId);

  console.log(`Finished QuickBooks sync for ${companyId}`);
}

async function refreshQuickBooksAccessToken(refreshToken: string) {
  return withRetry(async () => {
    const clientId = getRequiredEnv("QUICKBOOKS_CLIENT_ID");
    const clientSecret = getRequiredEnv("QUICKBOOKS_CLIENT_SECRET");

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    });

    const response = await fetch(
      "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`QuickBooks token refresh failed: ${errorText}`) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      x_refresh_token_expires_in?: number;
    }

    const accessTokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);
    const refreshTokenExpiresAt = data.x_refresh_token_expires_in
      ? new Date(Date.now() + data.x_refresh_token_expires_in * 1000)
      : null;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt
    }
  }, {
    maxAttempts: 3,
    baseDelayMs: 1000,
    onRetry: (error, attempt, delayMs) => {
      console.log(`[QuickBooks Token Refresh] Retry attempt ${attempt}/3 after ${delayMs}ms. Error: ${error.message}`);
    }
  });
}

async function prepareQuickBooksTokensAndVerifyCompany(row: any) {
  const encryptedAccessToken = row.accessToken;

  if (!encryptedAccessToken) {
    throw new Error("Missing access token for company connection");
  }

  const accessToken = decryptTokenFromStorage(encryptedAccessToken);

  let refreshToken: string | null = null;
  if (row.refreshToken) {
    refreshToken = decryptTokenFromStorage(row.refreshToken);
  }

  let currentAccessToken = accessToken;
  let currentAccessTokenExpiresAt = row.accessTokenExpiresAt;
  let currentRefreshToken = refreshToken;
  let currentRefreshTokenExpiresAt = row.refreshTokenExpiresAt;

  const shouldRefresh = isExpiringSoon(row.accessTokenExpiresAt, 60_000);

  if (shouldRefresh) {
    if (!refreshToken) {
      throw new Error("Access token expiring soon but no refresh token available");
    }

    const refreshed = await refreshQuickBooksAccessToken(refreshToken);
    currentAccessToken = refreshed.accessToken;
    currentRefreshToken = refreshed.refreshToken;
    currentAccessTokenExpiresAt = refreshed.accessTokenExpiresAt;
    currentRefreshTokenExpiresAt = refreshed.refreshTokenExpiresAt;

    await updateAccountingConnectionById(
      row.connectionId,
      currentAccessToken,
      currentRefreshToken,
      currentAccessTokenExpiresAt,
      currentRefreshTokenExpiresAt
    );
  }

  let companyInfoRes = await fetchQuickBooksCompanyInfo(row.realmId, currentAccessToken);
  if (companyInfoRes.status === 401) {
    if (!currentRefreshToken) {
      throw new Error("QuickBooks access token unauthorized and no refresh token available");
    }

    const refreshed = await refreshQuickBooksAccessToken(currentRefreshToken);
    currentAccessToken = refreshed.accessToken;
    currentRefreshToken = refreshed.refreshToken;
    currentAccessTokenExpiresAt = refreshed.accessTokenExpiresAt;
    currentRefreshTokenExpiresAt = refreshed.refreshTokenExpiresAt;

    await updateAccountingConnectionById(
      row.connectionId,
      currentAccessToken,
      currentRefreshToken,
      currentAccessTokenExpiresAt,
      currentRefreshTokenExpiresAt
    );

    companyInfoRes = await fetchQuickBooksCompanyInfo(row.realmId, currentAccessToken);
  }

  if (!companyInfoRes.ok) {
    const errorText = await companyInfoRes.text();
    throw new Error(`QuickBooks CompanyInfo request failed: ${companyInfoRes.status} ${errorText}`);
  }

  return {
    currentAccessToken,
    companyInfoRes
  }
}

async function fetchQuickBooksCompanyInfo(realmId: string, accessToken: string) {
  return withRetry(async () => {
    const baseUrl = getRequiredEnv("QUICKBOOKS_BASE_URL").replace(/\/$/, "");
    const url = `${baseUrl}/v3/company/${realmId}/companyinfo/${realmId}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    });

    return res;
  }, {
    maxAttempts: 3,
    baseDelayMs: 1000,
    onRetry: (error, attempt, delayMs) => {
      console.log(`[QuickBooks CompanyInfo] Retry attempt ${attempt}/3 after ${delayMs}ms. Error: ${error.message}`);
    }
  });
}

async function fetchProfitAndLoss(
  realmId: string,
  accessToken: string,
  startDate: string,
  endDate: string
) {
  console.log(startDate, endDate);
  const query = `reports/ProfitAndLoss?start_date=${startDate}&end_date=${endDate}&accounting_method=Accrual`;
  return quickbooksRequest(realmId, accessToken, query);
}
