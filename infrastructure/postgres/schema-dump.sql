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
    company_id UUID NOT NULL REFERENCES companies(id),
    source TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE cogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    description TEXT,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    category TEXT NOT NULL,
    vendor TEXT,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
