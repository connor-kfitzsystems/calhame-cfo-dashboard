export type AccountingConnectionRow = {
  connectionId: string;
  companyId: string;
  providerId: string;
  realmId: string;
  accessToken: string;
  refreshToken: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
}

export type Entity = "revenue" | "cogs" | "expenses";
