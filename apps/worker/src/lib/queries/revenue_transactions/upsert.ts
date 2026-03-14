import type { PoolClient } from "pg";
import { pool } from "../../db.js";

interface RevenueTransactionData {
  providerId: string;
  transactionId: string;
  transactionType: string;
  transactionNumber?: string;
  transactionDate: string;
  customerId?: string;
  customerName?: string;
  description?: string;
  accountId?: string;
  accountName?: string;
  amount: number;
  currencyCode?: string;
  providerMetadata?: Record<string, any>;
}

export async function upsertRevenueTransaction(companyId: string, data: RevenueTransactionData, client?: PoolClient) {
  const database = client ?? pool;

  await database.query(
    `INSERT INTO revenue_transactions (
      company_id,
      provider_id,
      provider_transaction_id,
      provider_transaction_type,
      transaction_number,
      transaction_date,
      customer_id,
      customer_name,
      description,
      account_id,
      account_name,
      amount,
      currency_code,
      provider_metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (company_id, provider_id, provider_transaction_id, provider_transaction_type)
    DO UPDATE SET
      transaction_number = EXCLUDED.transaction_number,
      transaction_date = EXCLUDED.transaction_date,
      customer_id = EXCLUDED.customer_id,
      customer_name = EXCLUDED.customer_name,
      description = EXCLUDED.description,
      account_id = EXCLUDED.account_id,
      account_name = EXCLUDED.account_name,
      amount = EXCLUDED.amount,
      currency_code = EXCLUDED.currency_code,
      provider_metadata = EXCLUDED.provider_metadata,
      updated_at = NOW()`,
    [
      companyId, data.providerId, data.transactionId, data.transactionType, data.transactionNumber || null,
      data.transactionDate, data.customerId || null, data.customerName || null, data.description || null,
      data.accountId || null, data.accountName || null, data.amount, data.currencyCode || 'USD',
      data.providerMetadata ? JSON.stringify(data.providerMetadata) : null
    ]
  );
}
