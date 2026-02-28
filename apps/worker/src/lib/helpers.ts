export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} env var`);
  }
  return value;
}

export function isExpiringSoon(expiresAt: Date | null, leewayMs: number): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() - Date.now() <= leewayMs;
}

export async function quickbooksRequest(
  realmId: string,
  accessToken: string,
  path: string
) {
  const baseUrl = getRequiredEnv("QUICKBOOKS_BASE_URL").replace(/\/$/, "");
  const url = `${baseUrl}/v3/company/${realmId}/${path}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`QuickBooks request failed: ${res.status} ${text}`);
  }

  return res.json();
}
