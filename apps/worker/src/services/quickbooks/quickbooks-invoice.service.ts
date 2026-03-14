import { quickbooksRequest } from "../../lib/helpers.js";
import { upsertRevenueTransaction } from "../../lib/queries/revenue_transactions/upsert.js";

export async function syncInvoices(
  companyId: string, providerId: string, realmId: string,
  accessToken: string, startDate: string, endDate: string
) {
  console.log(`[Invoice Sync] Fetching invoices for company ${companyId} from ${startDate} to ${endDate}`);
  
  const invoices = await fetchInvoices(realmId, accessToken, startDate, endDate);
  
  console.log(`[Invoice Sync] Found ${invoices.length} invoices`);
  
  for (const invoice of invoices) {
    const invoiceData = parseInvoice(invoice);
    
    for (const lineItem of invoiceData.lineItems) {
      await upsertRevenueTransaction(companyId, {
        providerId,
        transactionId: `${invoice.Id}-${lineItem.lineNum}`,
        transactionType: 'Invoice',
        transactionNumber: invoice.DocNumber || null,
        transactionDate: invoice.TxnDate,
        customerId: invoice.CustomerRef?.value || null,
        customerName: invoice.CustomerRef?.name || null,
        description: lineItem.description,
        accountId: lineItem.accountId || undefined,
        accountName: lineItem.accountName || undefined,
        amount: lineItem.amount
      });
    }
  }
  
  console.log(`[Invoice Sync] Processed ${invoices.length} invoices`);
}

interface ParsedInvoice {
  lineItems: Array<{
    lineNum: number;
    description: string;
    accountId: string | null;
    accountName: string | null;
    amount: number;
  }>;
}

function parseInvoice(invoice: any): ParsedInvoice {
  const lineItems: ParsedInvoice['lineItems'] = [];
  
  const lines = invoice.Line || [];
  
  for (const line of lines) {
    if (line.DetailType !== 'SalesItemLineDetail') {
      continue;
    }
    
    const salesDetail = line.SalesItemLineDetail || {};
    const itemRef = salesDetail.ItemRef || {};
    
    lineItems.push({
      lineNum: line.LineNum || 0,
      description: line.Description || itemRef.name || 'Invoice Line Item',
      accountId: salesDetail.AccountRef?.value || null,
      accountName: salesDetail.AccountRef?.name || null,
      amount: parseFloat(line.Amount || '0')
    });
  }
  
  return { lineItems };
}

async function fetchInvoices(
  realmId: string, accessToken: string, startDate: string, endDate: string
) {
  const query = `SELECT * FROM Invoice WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS 1000`;
  const encodedQuery = encodeURIComponent(query);
  const path = `query?query=${encodedQuery}`;

  const result = await quickbooksRequest(realmId, accessToken, path);
  return result.QueryResponse?.Invoice || [];
}
