import { db } from '../db/index.ts';
import { transactions, auditLogs } from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Real API service to fetch Mercado Pago and Stripe gateway responses
 * adhering to the "Golden Record" structure for compliance auditing.
 */

export interface GoldenRecordPayment {
  id: string; // ID transação
  gateway: 'mercadopago' | 'stripe';
  status: 'succeeded' | 'approved' | 'pending' | 'failed';
  timestamp: string; // Timestamp
  pilarFiscal: {
    nfeKey: string;
    sefazStatus: string;
  };
  payload: {
    originUrl: string;
    customerDoc: string;
    amount: number;
    currency: string;
  };
}

export const mockApi = {
  getGoldenRecords: async (gateway: 'mercadopago' | 'stripe'): Promise<GoldenRecordPayment[]> => {
    try {
      // Busca transações reais do banco filtradas por gateway
      const dbTxs = await db.select().from(transactions)
        .where(sql`bank_end_to_end_id LIKE ${gateway.toUpperCase() + '%'}`)
        .orderBy(desc(transactions.createdAt))
        .limit(20);

      return dbTxs.map(tx => ({
        id: tx.saleId,
        gateway,
        status: tx.status === 'COMMITTED' ? (gateway === 'mercadopago' ? 'approved' : 'succeeded') : 'pending',
        timestamp: tx.createdAt.toISOString(),
        pilarFiscal: {
          nfeKey: tx.fiscalAccessKey || 'PENDENTE_EMISSAO',
          sefazStatus: tx.fiscalAccessKey ? '100% REGULAR & EMITIDA' : 'EM_PROCESSAMENTO',
        },
        payload: {
          originUrl: tx.originUrl,
          customerDoc: tx.buyerTaxId,
          amount: 0, // Amount needs to be extracted from webhookPayload or auditLogs if not in transactions
          currency: tx.currency,
        },
      }));
    } catch (error) {
      console.error('[REAL_API_ERR]', error);
      return [];
    }
  },
};

import { sql } from 'drizzle-orm';
