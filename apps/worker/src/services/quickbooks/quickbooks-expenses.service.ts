import { upsertExpenses } from "../../lib/queries/expenses/upsert-expenses.js";
import { upsertProviderSyncStateLastSynced } from "../../lib/queries/provider_sync_state/upsert-provider-sync-state-last-synced.js";

// Todo: Fix any types and clean this file up

export async function syncExpenses(companyId: string, row: any, endDate: string, pnl: any) {

  const expensesAccounts = extractExpensesAccounts(pnl);

  for (const account of expensesAccounts) {
    await upsertExpenses(
      companyId,
      account.accountName,
      account.amount,
      endDate
    );
  }

  await upsertProviderSyncStateLastSynced(row.connectionId, "expenses");
}

interface PnlAccount {
  accountId: string;
  accountName: string;
  amount: number;
}

// Todo: Make this more generic and reuse it in revenue and expenses
export function extractExpensesAccounts(pnl: any): PnlAccount[] {
  const accounts: {
    accountId: string;
    accountName: string;
    amount: number;
  }[] = [];

  const sections = pnl?.Rows?.Row ?? [];

  for (const section of sections) {
    if (section.group !== "Expenses") continue;

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
