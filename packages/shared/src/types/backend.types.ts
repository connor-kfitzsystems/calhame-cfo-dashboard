export type AccountingConnectionRow = {
  connectionId: string;
  realmId: string;
  accessToken: string;
  refreshToken: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
}
