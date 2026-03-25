import { quickbooksRequest } from "../../lib/helpers.js";
import { upsertExpenseTransaction } from "../../lib/queries/expense_transactions/upsert.js";
import { getLastSyncedAt } from "../../lib/queries/provider_sync_state/get-last-synced.js";
import { upsertProviderSyncStateLastSynced } from "../../lib/queries/provider_sync_state/upsert-provider-sync-state-last-synced.js";

export async function syncExpenses(
  companyId: string, providerId: string, realmId: string, accessToken: string, 
  connectionId: string
) {
  const entityType = "expense_transactions";
  
  const lastSyncedAt = await getLastSyncedAt(connectionId, entityType);
  
  console.log(`[Expense Sync] Fetching expenses for company ${companyId}`);

  if (lastSyncedAt) {
    console.log(`[Expense Sync] Incremental sync from ${lastSyncedAt.toISOString()}`);
  } else {
    console.log(`[Expense Sync] Full sync - fetching ALL historical data`);
  }
  
  let startPosition = 1;
  let totalFetched = 0;
  let pageNumber = 1;
  
  while (true) {
    const expenses = await fetchExpenses(realmId, accessToken, lastSyncedAt, startPosition);
    
    console.log(`[Expense Sync] Page ${pageNumber}: Found ${expenses.length} expenses`);
    
    for (const expense of expenses) {
      const expenseData = parsePurchase(expense);
      const lastModifiedAt = expense.MetaData?.LastUpdatedTime || null;
      
      for (const lineItem of expenseData.lineItems) {
        await upsertExpenseTransaction(companyId, {
          providerId,
          transactionId: `${expense.Id}-${lineItem.lineNum}`,
          transactionType: 'Purchase',
          transactionNumber: expense.DocNumber || null,
          transactionDate: expense.TxnDate,
          vendorId: expense.EntityRef?.value || null,
          vendorName: expense.EntityRef?.name || null,
          category: lineItem.category || undefined,
          description: lineItem.description || undefined,
          accountId: lineItem.accountId || undefined,
          accountName: lineItem.accountName || undefined,
          amount: lineItem.amount,
          providerLastModifiedAt: lastModifiedAt
        });
      }
    }
    
    totalFetched += expenses.length;
    
    if (expenses.length < 1000) {
      break;
    }
    
    startPosition += 1000;
    pageNumber++;
  }
  
  await upsertProviderSyncStateLastSynced(connectionId, entityType);
  
  console.log(`[Expense Sync] Completed - Total processed: ${totalFetched} expenses`);
}

interface ParsedPurchase {
  lineItems: Array<{
    lineNum: number;
    description: string;
    category: string | null;
    accountId: string | null;
    accountName: string | null;
    amount: number;
  }>;
}

function parsePurchase(purchase: any): ParsedPurchase {
  const lineItems: ParsedPurchase['lineItems'] = [];
  
  const lines = purchase.Line || [];
  
  for (const line of lines) {
    if (line.DetailType === 'AccountBasedExpenseLineDetail') {
      const expenseDetail = line.AccountBasedExpenseLineDetail || {};
      const accountRef = expenseDetail.AccountRef || {};
      
      lineItems.push({
        lineNum: line.LineNum || 0,
        description: line.Description || accountRef.name || 'Expense Line Item',
        category: accountRef.name || null,
        accountId: accountRef.value || null,
        accountName: accountRef.name || null,
        amount: parseFloat(line.Amount || '0')
      });
    }

    else if (line.DetailType === 'ItemBasedExpenseLineDetail') {
      const itemDetail = line.ItemBasedExpenseLineDetail || {};
      const itemRef = itemDetail.ItemRef || {};
      
      lineItems.push({
        lineNum: line.LineNum || 0,
        description: line.Description || itemRef.name || 'Expense Line Item',
        category: itemRef.name || null,
        accountId: itemDetail.AccountRef?.value || null,
        accountName: itemDetail.AccountRef?.name || null,
        amount: parseFloat(line.Amount || '0')
      });
    }
  }
  
  return { lineItems };
}

async function fetchExpenses(
  realmId: string, accessToken: string, lastSyncedAt: Date | null, startPosition: number = 1
) {
  let query: string;
  
  if (lastSyncedAt) {
    const lastSyncedISO = lastSyncedAt.toISOString();
    query = `SELECT * FROM Purchase WHERE Metadata.LastUpdatedTime > '${lastSyncedISO}' MAXRESULTS 1000`;
  } else {
    query = `SELECT * FROM Purchase ORDERBY Id MAXRESULTS 1000 STARTPOSITION ${startPosition}`;
  }
  
  const encodedQuery = encodeURIComponent(query);
  const path = `query?query=${encodedQuery}`;

  const result = await quickbooksRequest(realmId, accessToken, path);
  return result.QueryResponse?.Purchase || [];
}
