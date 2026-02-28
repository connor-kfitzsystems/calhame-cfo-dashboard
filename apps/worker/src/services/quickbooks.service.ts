import { Entity } from "@repo/shared";
import { getRequiredEnv, isExpiringSoon } from "../lib/helpers";
import { getAccountingConnectionByCompanyId } from "../lib/queries/accounting_connections/get-accounting-connection-by-company-id";
import { markAccountingConnectionSynced } from "../lib/queries/accounting_connections/mark-accounting-connection-synced";
import { updateAccountingConnectionById } from "../lib/queries/accounting_connections/update-accounting-connection-by-id";
import { upsertProviderSyncStateLastSynced } from "../lib/queries/provider_sync_state/upsert-provider-sync-state-last-synced";
import { upsertRevenue } from "../lib/queries/revenue/upsert-revenue";
import { decryptTokenFromStorage } from "../lib/token-crypto";
import { extractRevenueAccounts, fetchProfitAndLoss } from "./quickbooks/quickbooks-revenue.service";

export async function syncQuickBooksCompany(companyId: string, entities: Entity[]) {
  console.log(`Starting QuickBooks sync for company ${companyId}, entities ${entities}...`);

  // TODO:
  // 1. Call QuickBooks API
  // 2. Normalize data
  // 3. Write to Postgres

  const connectionResult = await getAccountingConnectionByCompanyId(companyId);
  const row = connectionResult.rows[0];

  if (!row) {
    throw new Error("No active accounting connection found for company");
  }

  const { currentAccessToken, companyInfoRes } = await prepareQuickBooksTokensAndVerifyCompany(row);

  await companyInfoRes.json();

  const startDate = "2024-01-01";
  const endDate = new Date().toISOString().split("T")[0];
  
  if (entities.includes("revenue")) {
    const pnl = await fetchProfitAndLoss(
      row.realmId,
      currentAccessToken,
      startDate,
      endDate
    );

    const revenueAccounts = extractRevenueAccounts(pnl);

    for (const account of revenueAccounts) {
      await upsertRevenue(
        companyId,
        account.accountId,
        account.accountName,
        account.amount,
        endDate
      );
    }
    await upsertProviderSyncStateLastSynced(row.connectionId, "revenue");
  }

  await markAccountingConnectionSynced(row.connectionId);

  console.log(`Finished QuickBooks sync for ${companyId}`);
}

async function refreshQuickBooksAccessToken(refreshToken: string) {
  const clientId = getRequiredEnv("QUICKBOOKS_CLIENT_ID");
  const clientSecret = getRequiredEnv("QUICKBOOKS_CLIENT_SECRET");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(
    "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QuickBooks token refresh failed: ${errorText}`);
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
}
