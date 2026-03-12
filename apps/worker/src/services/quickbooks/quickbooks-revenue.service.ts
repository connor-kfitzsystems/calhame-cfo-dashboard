import { upsertProviderSyncStateLastSynced } from "../../lib/queries/provider_sync_state/upsert-provider-sync-state-last-synced.js";
import { upsertRevenue } from "../../lib/queries/revenue/upsert-revenue.js";

// Fix any types and clean this file up

export async function syncRevenue(companyId: string, row: any, endDate: string, pnl: any) {
  
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

function extractRevenueAccounts(pnl: any) {
  const accounts: {
    accountId: string;
    accountName: string;
    amount: number;
  } [] = [];

  const sections = pnl?.Rows?.Row ?? [];

  for (const section of sections) {
    if (section.group !== "Income") continue;

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
