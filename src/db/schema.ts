/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { pgTable, text, timestamp, uuid, jsonb, char, pgEnum, index } from 'drizzle-orm/pg-core';

export const transactionStatusEnum = pgEnum('transaction_status', [
  'PENDING_PAYMENT',
  'PAYMENT_RECEIVED',
  'FISCAL_SIGNED',
  'COMMITTED'
]);

/**
 * Tabela de Transações: O "Golden Record"
 * Unifica os pilares Comercial, Bancário e Fiscal com rastreabilidade total.
 */
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Pilar Comercial
  saleId: text('sale_id').notNull().unique(),
  originUrl: text('origin_url').notNull(),
  buyerTaxId: text('buyer_tax_id').notNull(), // CPF/CNPJ
  originIp: text('origin_ip').notNull(),
  webhookPayload: jsonb('webhook_payload').notNull(),
  
  // Pilar Bancário
  bankEndToEndId: text('bank_end_to_end_id').unique(),
  
  // Pilar Fiscal
  fiscalAccessKey: char('fiscal_access_key', { length: 44 }).unique(),
  fiscalXml: text('fiscal_xml'),
  
  // Auditoria e Estado
  status: transactionStatusEnum('status').notNull().default('PENDING_PAYMENT'),
  
  // Pilar de Câmbio e Repatriação (Compliance Global)
  currency: text('currency').notNull().default('BRL'),
  region: text('region').notNull().default('BRAZIL'),
  fxStatus: text('fx_status').notNull().default('NOT_APPLICABLE'), // PENDING, REPATRIATED, NOT_APPLICABLE
  fxRate: text('fx_rate'), // Taxa de conversão aplicada
  bacenContractId: text('bacen_contract_id'), // Número do Contrato de Câmbio oficial
  
  // Blockchain Interno (Hash em Cadeia)
  prevHash: text('prev_hash').notNull(),
  currentHash: text('current_hash'), // SHA-256(prevHash + content)
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  committedAt: timestamp('committed_at'),
}, (table) => {
  return {
    saleIdIdx: index('sale_id_idx').on(table.saleId),
    bankIdIdx: index('bank_id_idx').on(table.bankEndToEndId),
    fiscalKeyIdx: index('fiscal_key_idx').on(table.fiscalAccessKey),
    statusIdx: index('status_idx').on(table.status),
  };
});

/**
 * Tabela de Logs de Auditoria Forense
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').references(() => transactions.id),
  action: text('action').notNull(),
  previousState: jsonb('previous_state'),
  newState: jsonb('new_state'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  actor: text('actor').notNull(), // Identificação do microsserviço/usuário
});
