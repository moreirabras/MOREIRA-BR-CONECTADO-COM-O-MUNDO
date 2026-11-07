import axios from 'axios';
import { db } from '../db/index.ts';
import { transactions, auditLogs } from '../db/schema.ts';
import { eq, and, inArray } from 'drizzle-orm';
import * as schema from '../db/schema.ts';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * MOTOR DE CÂMBIO E REPATRIAÇÃO (FX MOTOR)
 * ---------------------------------------
 * Automatiza o fechamento de câmbio de vendas internacionais (Stripe UAE, Razorpay)
 * vinculando o número do contrato oficial do BACEN ao Tríplice Vínculo.
 */
export class ExchangeService {
  /**
   * Executa o fechamento de câmbio para transações pendentes de repatriação.
   */
  public static async executeAutomaticClosing(): Promise<void> {
    console.log('[FX-MOTOR] Iniciando rotina de fechamento de câmbio global...');

    try {
      // 1. Busca transações internacionais que precisam de repatriação
      const pendingTxs = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.status, 'COMMITTED'),
            eq(transactions.fxStatus, 'PENDING')
          )
        );

      if (pendingTxs.length === 0) {
        console.log('[FX-MOTOR] Sem saldos internacionais acumulados para repatriação.');
        return;
      }

      // 2. Agrupa lotes por moeda para otimização bancária
      const currencyLots = pendingTxs.reduce((acc: any, curr) => {
        acc[curr.currency] = (acc[curr.currency] || 0) + 1; // Simplificado para exemplo, em prod seria o valor
        return acc;
      }, {});

      console.log(`[FX-MOTOR] Processando lotes para moedas: ${Object.keys(currencyLots).join(', ')}`);

      // 3. Simulação de chamada à API do Banco de Câmbio (Travelex/Topázio/Bexs)
      // Em produção, isso usaria as credenciais do .env
      const mockBacenContract = `CTR-BACE-${Math.floor(Math.random() * 1000000)}`;
      const mockFxRate = "5.45"; // Simulado

      // 4. Atualização Atômica: Vincula o Contrato Bacen e sela a repatriação
      await db.transaction(async (tx: NodePgDatabase<typeof schema>) => {
        const txIds = pendingTxs.map(t => t.id);

        await tx
          .update(transactions)
          .set({
            fxStatus: 'REPATRIATED',
            fxRate: mockFxRate,
            bacenContractId: mockBacenContract,
            updatedAt: new Date()
          })
          .where(inArray(transactions.id, txIds));

        // 5. Log de Auditoria de Câmbio
        for (const targetId of txIds) {
          await tx.insert(auditLogs).values({
            transactionId: targetId,
            action: 'FX_REPATRIATION_CLOSED',
            newState: { 
              contract: mockBacenContract, 
              rate: mockFxRate,
              status: 'REPATRIATED' 
            },
            actor: 'FX_AUTOMATED_MOTOR',
          });
        }
      });

      console.log(`[FX-MOTOR] ✅ Câmbio liquidado com sucesso. Contrato: ${mockBacenContract}`);

    } catch (error: any) {
      console.error('[FX-MOTOR-ERRO] Falha crítica ao executar fechamento de câmbio:', error.message);
    }
  }
}
