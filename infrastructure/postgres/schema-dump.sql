CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tenant Layer --

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id varchar(255) UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_company_id TEXT NOT NULL,
    provider_id TEXT NOT NULL REFERENCES accounting_providers(id),
    name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),

    UNIQUE(provider_company_id, provider_id)
);

CREATE TABLE company_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMP NOT NULL DEFAULT now(),

    UNIQUE(user_id, company_id)
);

-- Provider Layer --

CREATE TABLE accounting_providers (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL
);

CREATE TABLE accounting_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID UNIQUE NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    access_token TEXT NOT NULL,
    refresh_token TEXT,
    access_token_expires_at TIMESTAMP,
    refresh_token_expires_at TIMESTAMP,

    status TEXT NOT NULL DEFAULT 'active',

    last_synced_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()

);

CREATE TABLE provider_sync_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES accounting_connections(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    cursor TEXT,
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),

    UNIQUE(connection_id, entity_type)
);

-- Entities Layer --

CREATE TABLE revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    provider_entity_id TEXT NOT NULL,
    provider_entity_type TEXT NOT NULL, 
    provider_account_id TEXT,          
    provider_account_name TEXT,         

    accounting_method TEXT NOT NULL DEFAULT

    source TEXT NOT NULL,
    amount NUMERIC(18,2) NOT NULL,
    date DATE NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT revenue_provider_unique
        UNIQUE (company_id, provider_entity_id, provider_entity_type)
);

CREATE TABLE cogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    description TEXT,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    vendor TEXT,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- This allows storing individual transactions with accurate dates instead of P&L summaries

-- Revenue Transactions (Invoices, Sales Receipts, Payments)
CREATE TABLE IF NOT EXISTS revenue_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Provider identification
    provider_id TEXT NOT NULL REFERENCES accounting_providers(id),

    -- Provider identifiers
    provider_transaction_id TEXT NOT NULL,
    provider_transaction_type TEXT NOT NULL,
    transaction_number TEXT,
    transaction_date DATE NOT NULL,

    -- Business data
    customer_id TEXT,
    customer_name TEXT,
    description TEXT,
    
    -- Accounting
    account_id TEXT,
    account_name TEXT,
    amount NUMERIC(18,2) NOT NULL,
    currency_code TEXT DEFAULT 'USD',
    
    -- Provider-specific metadata (JSON for flexible storage)
    provider_metadata JSONB,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT revenue_transactions_unique 
        UNIQUE (company_id, provider_id, provider_transaction_id, provider_transaction_type)
);

-- COGS Transactions (Bills, Purchases related to cost of goods)
CREATE TABLE IF NOT EXISTS cogs_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Provider identification
    provider_id TEXT NOT NULL REFERENCES accounting_providers(id),

    -- Provider identifiers
    provider_transaction_id TEXT NOT NULL,
    provider_transaction_type TEXT NOT NULL,
    transaction_number TEXT,
    transaction_date DATE NOT NULL,

    -- Business data
    vendor_id TEXT,
    vendor_name TEXT,
    description TEXT,
    
    -- Accounting
    account_id TEXT,
    account_name TEXT,
    amount NUMERIC(18,2) NOT NULL,
    currency_code TEXT DEFAULT 'USD',
    
    -- Provider-specific metadata (JSON for flexible storage)
    provider_metadata JSONB,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT cogs_transactions_unique 
        UNIQUE (company_id, provider_id, provider_transaction_id, provider_transaction_type)
);

-- Expense Transactions (Expenses, Checks, Credit Card Charges)
CREATE TABLE IF NOT EXISTS expense_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Provider identification
    provider_id TEXT NOT NULL REFERENCES accounting_providers(id),

    -- Provider identifiers
    provider_transaction_id TEXT NOT NULL,
    provider_transaction_type TEXT NOT NULL,
    transaction_number TEXT,
    transaction_date DATE NOT NULL,

    -- Business data
    vendor_id TEXT,
    vendor_name TEXT,
    category TEXT,
    description TEXT,
    
    -- Accounting
    account_id TEXT,
    account_name TEXT,
    amount NUMERIC(18,2) NOT NULL,
    currency_code TEXT DEFAULT 'USD',
    
    -- Provider-specific metadata (JSON for flexible storage)
    provider_metadata JSONB,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT expense_transactions_unique 
        UNIQUE (company_id, provider_id, provider_transaction_id, provider_transaction_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_date 
    ON revenue_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_company 
    ON revenue_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_company_date 
    ON revenue_transactions(company_id, transaction_date);

CREATE INDEX IF NOT EXISTS idx_cogs_transactions_date 
    ON cogs_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_cogs_transactions_company 
    ON cogs_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_cogs_transactions_company_date 
    ON cogs_transactions(company_id, transaction_date);

CREATE INDEX IF NOT EXISTS idx_expense_transactions_date 
    ON expense_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_company 
    ON expense_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_company_date 
    ON expense_transactions(company_id, transaction_date);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_revenue_transactions_updated_at 
    BEFORE UPDATE ON revenue_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cogs_transactions_updated_at 
    BEFORE UPDATE ON cogs_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_transactions_updated_at 
    BEFORE UPDATE ON expense_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

