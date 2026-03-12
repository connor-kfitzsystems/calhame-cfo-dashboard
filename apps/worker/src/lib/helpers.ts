import { withRetry } from "./retry-helper.js";

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
  return withRetry(async () => {
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
      const error = new Error(`QuickBooks request failed: ${res.status} ${text}`) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    return res.json();
  }, {
    maxAttempts: 3,
    baseDelayMs: 1000,
    onRetry: (error, attempt, delayMs) => {
      console.log(`[QuickBooks API] Retry attempt ${attempt}/3 for ${path} after ${delayMs}ms. Error: ${error.message}`);
    }
  });
}
