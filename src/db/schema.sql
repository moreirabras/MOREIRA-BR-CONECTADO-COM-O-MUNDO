/**
 * ESQUEMA POSTGRESQL PARA AUDITORIA FORENSE E RASTREABILIDADE
 * ---------------------------------------------------------
 * Este script gera a estrutura necessária para o Triple Transactional Link.
 * Compatível com CockroachDB e PostgreSQL.
 */

-- Extensão para UUIDs (Postgres padrão)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Estados da Transação
CREATE TYPE transaction_status AS ENUM (
    'PENDING_PAYMENT',
    'PAYMENT_RECEIVED',
    'FISCAL_SIGNED',
    'COMMITTED'
);

-- Tabela Principal: O "Golden Record"
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Pilar Comercial
    sale_id TEXT NOT NULL UNIQUE,
    origin_url TEXT NOT NULL,
    buyer_tax_id TEXT NOT NULL, -- CPF/CNPJ
    origin_ip TEXT NOT NULL,
    webhook_payload JSONB NOT NULL,
    
    -- Pilar Bancário
    bank_end_to_end_id TEXT UNIQUE,
    
    -- Pilar Fiscal
    fiscal_access_key CHAR(44) UNIQUE,
    fiscal_xml TEXT,
    
    -- Auditoria e Estado
    status transaction_status NOT NULL DEFAULT 'PENDING_PAYMENT',
    
    -- Blockchain Interno (Imutabilidade)
    prev_hash TEXT NOT NULL,
    current_hash TEXT, -- SHA-256(prev_hash + dados_atuais)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    committed_at TIMESTAMP WITH TIME ZONE
);

-- Índices de Performance e Busca Forense
CREATE INDEX idx_transactions_sale_id ON transactions(sale_id);
CREATE INDEX idx_transactions_bank_id ON transactions(bank_end_to_end_id);
CREATE INDEX idx_transactions_fiscal_key ON transactions(fiscal_access_key);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_hashes ON transactions(prev_hash, current_hash);

-- Tabela de Logs de Auditoria (Immutable Append-Only)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id),
    action TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actor TEXT NOT NULL
);

-- Constraint de Segurança: Impede UPDATE em transações já COMMITTED
CREATE OR REPLACE FUNCTION protect_committed_transactions()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'COMMITTED' THEN
        RAISE EXCEPTION 'VIOLAÇÃO DE AUDITORIA: Transações com status COMMITTED são imutáveis.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_committed
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION protect_committed_transactions();
