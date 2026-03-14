import { quickbooksRequest } from "../../lib/helpers.js";
import { upsertExpenseTransaction } from "../../lib/queries/expense_transactions/upsert.js";

export async function syncExpenses(
  companyId: string, providerId: string, realmId: string,
  accessToken: string, startDate: string, endDate: string
) {
  console.log(`[Expense Sync] Fetching expenses for company ${companyId} from ${startDate} to ${endDate}`);
  
  const expenses = await fetchExpenses(realmId, accessToken, startDate, endDate);
  
  console.log(`[Expense Sync] Found ${expenses.length} expenses`);
  
  for (const expense of expenses) {
    const expenseData = parsePurchase(expense);
    
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
        amount: lineItem.amount
      });
    }
  }
  
  console.log(`[Expense Sync] Processed ${expenses.length} expenses`);
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
  realmId: string, accessToken: string, startDate: string, endDate: string
) {
  const query = `SELECT * FROM Purchase WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' AND PaymentType = 'Cash' MAXRESULTS 1000`;
  const encodedQuery = encodeURIComponent(query);
  const path = `query?query=${encodedQuery}`;

  const result = await quickbooksRequest(realmId, accessToken, path);
  return result.QueryResponse?.Purchase || [];
}
