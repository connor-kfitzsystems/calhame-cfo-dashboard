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
