import { quickbooksRequest } from "../../lib/helpers.js";
import { upsertCogsTransaction } from "../../lib/queries/cogs_transactions/upsert.js";
import { getLastSyncedAt } from "../../lib/queries/provider_sync_state/get-last-synced.js";
import { upsertProviderSyncStateLastSynced } from "../../lib/queries/provider_sync_state/upsert-provider-sync-state-last-synced.js";

export async function syncBills(
  companyId: string, providerId: string, realmId: string, accessToken: string, 
  connectionId: string
) {
  const entityType = "cogs_transactions";
  
  const lastSyncedAt = await getLastSyncedAt(connectionId, entityType);
  
  console.log(`[Bill Sync] Fetching bills for company ${companyId}`);

  if (lastSyncedAt) {
    console.log(`[Bill Sync] Incremental sync from ${lastSyncedAt.toISOString()}`);
  } else {
    console.log(`[Bill Sync] Full sync - fetching ALL historical data`);
  }
  
  let startPosition = 1;
  let totalFetched = 0;
  let pageNumber = 1;
  
  while (true) {
    const bills = await fetchBills(realmId, accessToken, lastSyncedAt, startPosition);
    
    console.log(`[Bill Sync] Page ${pageNumber}: Found ${bills.length} bills`);
    
    for (const bill of bills) {
      const billData = parseBill(bill);
      const lastModifiedAt = bill.MetaData?.LastUpdatedTime || null;
      
      for (const lineItem of billData.lineItems) {
        await upsertCogsTransaction(companyId, {
          providerId,
          transactionId: `${bill.Id}-${lineItem.lineNum}`,
          transactionType: 'Bill',
          transactionNumber: bill.DocNumber || null,
          transactionDate: bill.TxnDate,
          vendorId: bill.VendorRef?.value || null,
          vendorName: bill.VendorRef?.name || null,
          description: lineItem.description || undefined,
          accountId: lineItem.accountId || undefined,
          accountName: lineItem.accountName || undefined,
          amount: lineItem.amount,
          providerLastModifiedAt: lastModifiedAt
        });
      }
    }
    
    totalFetched += bills.length;
    
    if (bills.length < 1000) {
      break;
    }
    
    startPosition += 1000;
    pageNumber++;
  }
  
  await upsertProviderSyncStateLastSynced(connectionId, entityType);
  
  console.log(`[Bill Sync] Completed - Total processed: ${totalFetched} bills`);
}

interface ParsedBill {
  lineItems: Array<{
    lineNum: number;
    description: string;
    accountId: string | null;
    accountName: string | null;
    amount: number;
  }>;
}

function parseBill(bill: any): ParsedBill {
  const lineItems: ParsedBill['lineItems'] = [];
  
  const lines = bill.Line || [];
  
  for (const line of lines) {
    if (line.DetailType === 'AccountBasedExpenseLineDetail') {
      const expenseDetail = line.AccountBasedExpenseLineDetail || {};
      const accountRef = expenseDetail.AccountRef || {};
      
      lineItems.push({
        lineNum: line.LineNum || 0,
        description: line.Description || accountRef.name || 'Bill Line Item',
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
        description: line.Description || itemRef.name || 'Bill Line Item',
        accountId: itemDetail.AccountRef?.value || null,
        accountName: itemDetail.AccountRef?.name || null,
        amount: parseFloat(line.Amount || '0')
      });
    }
  }
  
  return { lineItems };
}

async function fetchBills(
  realmId: string, accessToken: string, lastSyncedAt: Date | null, startPosition: number = 1
) {
  let query: string;
  
  if (lastSyncedAt) {
    const lastSyncedISO = lastSyncedAt.toISOString();
    query = `SELECT * FROM Bill WHERE Metadata.LastUpdatedTime > '${lastSyncedISO}' MAXRESULTS 1000`;
  } else {
    query = `SELECT * FROM Bill ORDERBY Id MAXRESULTS 1000 STARTPOSITION ${startPosition}`;
  }
  
  const encodedQuery = encodeURIComponent(query);
  const path = `query?query=${encodedQuery}`;

  const result = await quickbooksRequest(realmId, accessToken, path);
  return result.QueryResponse?.Bill || [];
}
