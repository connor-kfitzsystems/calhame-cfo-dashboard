import { quickbooksRequest } from "../../lib/helpers";

export async function fetchProfitAndLoss(
  realmId: string,
  accessToken: string,
  startDate: string,
  endDate: string | undefined
) {
  const query = `reports/ProfitAndLoss?start_date=${startDate}&end_date=${endDate}&accounting_method=Accrual`;
  return quickbooksRequest(realmId, accessToken, query);
}

export function extractRevenueAccounts(pnl: any) {
  
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
