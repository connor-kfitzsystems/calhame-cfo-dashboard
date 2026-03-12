import { upsertCogs } from "../../lib/queries/cogs/upsert-cogs.js";
import { upsertProviderSyncStateLastSynced } from "../../lib/queries/provider_sync_state/upsert-provider-sync-state-last-synced.js";

// Todo: Fix any types and clean this file up

export async function syncCogs(companyId: string, row: any, endDate: string, pnl: any) {

  const cogsAccounts = extractCogsAccounts(pnl);

  for (const account of cogsAccounts) {
    await upsertCogs(
      companyId,
      account.accountName,
      account.amount,
      endDate
    );
  }

  await upsertProviderSyncStateLastSynced(row.connectionId, "cogs");
}

interface PnlAccount {
  accountId: string;
  accountName: string;
  amount: number;
}

// Todo: Make this more generic and reuse it in revenue and expenses
export function extractCogsAccounts(pnl: any): PnlAccount[] {
  const accounts: {
    accountId: string;
    accountName: string;
    amount: number;
  }[] = [];

  const sections = pnl?.Rows?.Row ?? [];

  for (const section of sections) {
    if (section.group !== "COGS") continue;

    const rows = section?.Rows?.Row ?? [];

    for (const row of rows) {
      const cols = row?.ColData ?? [];
      if (cols.length < 2) continue;

      accounts.push({
        accountId: cols[0].id,
        accountName: cols[0].value,
        amount: parseFloat(cols[1].value ?? "0")
      });
    }
  }

  return accounts;
}
