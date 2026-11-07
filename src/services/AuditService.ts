import { db } from '../db/index.ts';
import { transactions, auditLogs } from '../db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema.ts';
import { InvoiceService } from './InvoiceService.ts';

export interface WebhookData {
  saleId: string;
  originUrl: string;
  buyerTaxId: string;
  originIp: string;
  payload: any;
  bankEndToEndId: string;
}

export class AuditService {
  /**
   * Gera o hash SHA-256 para selar a transação.
   * Implementa o conceito de "Blockchain Interno" ligando a transação atual à anterior.
   */
  private static async generateChainedHash(currentData: string): Promise<{ prevHash: string; currentHash: string }> {
    // Busca a última transação commitada para obter o hash anterior
    const lastTx = await db
      .select({ currentHash: transactions.currentHash })
      .from(transactions)
      .where(eq(transactions.status, 'COMMITTED'))
      .orderBy(desc(transactions.committedAt))
      .limit(1);

    const prevHash = lastTx[0]?.currentHash || '0'.repeat(64); // Gênesis se for a primeira
    
    const hash = crypto.createHash('sha256');
    hash.update(prevHash + currentData);
    const currentHash = hash.digest('hex');

    return { prevHash, currentHash };
  }

  /**
   * Processa o pagamento recebido e inicia o fluxo de auditoria forense.
   * Executado de forma atômica (ACID Transaction).
   */
  public static async processPayment(data: WebhookData) {
    return await db.transaction(async (tx: NodePgDatabase<typeof schema>) => {
      // 1. Validação de Idempotência
      const existing = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.bankEndToEndId, data.bankEndToEndId))
        .limit(1);

      if (existing.length > 0) {
        throw new Error('DUPLICATE_TRANSACTION: O EndToEndId já foi processado.');
      }

      // 2. Criação do Registro em Estado PENDING/RECEIVED
      // Nota: Em um fluxo real, o PENDING ocorreria no checkout. 
      // Aqui estamos simulando a chegada do webhook do banco.
      const [newTx] = await tx.insert(transactions).values({
        saleId: data.saleId,
        originUrl: data.originUrl,
        buyerTaxId: data.buyerTaxId,
        originIp: data.originIp,
        webhookPayload: data.payload,
        bankEndToEndId: data.bankEndToEndId,
        status: 'PAYMENT_RECEIVED',
        currency: (data as any).currency || 'BRL',
        region: (data as any).region || 'BRAZIL',
        fxStatus: (data as any).fx_status || 'NOT_APPLICABLE',
        prevHash: 'PENDING_SEAL',
      }).returning();

      // 3. Log de Auditoria
      await tx.insert(auditLogs).values({
        transactionId: newTx.id,
        action: 'PAYMENT_RECEIVED',
        newState: { status: 'PAYMENT_RECEIVED', bankEndToEndId: data.bankEndToEndId },
        actor: 'BANK_WEBHOOK_INGESTOR',
      });

      return newTx;
    });
  }

  /**
   * Assina e Comita a transação fiscalmente.
   * Sela o "Tríplice Vínculo" e gera a prova de imutabilidade.
   */
  public static async commitFiscal(transactionId: string, fiscalKey: string, xmlContent: string) {
    return await db.transaction(async (tx: NodePgDatabase<typeof schema>) => {
      const [currentTx] = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId))
        .limit(1);

      if (!currentTx) throw new Error('TRANSACTION_NOT_FOUND');
      if (currentTx.status !== 'PAYMENT_RECEIVED') throw new Error('INVALID_STATE_FOR_FISCAL_SIGN');

      // 1. Geração de Invoice para Transações Internacionais
      let finalXml = xmlContent;
      if (currentTx.region !== 'BRAZIL') {
        const invoiceXml = InvoiceService.gerarDocumentoExportacao({
          invoiceNumero: `INV-${currentTx.saleId}`,
          clienteNome: 'Global Customer',
          documentoInternacional: currentTx.buyerTaxId,
          paisDestino: currentTx.region,
          moedaEstrangeira: currentTx.currency,
          valorEstrangeiroCentavos: 1000, // Exemplo: valor viria do payload original
          idTransacaoGateway: currentTx.bankEndToEndId || ''
        });
        const signature = InvoiceService.selarInvoice(invoiceXml);
        finalXml = `${invoiceXml}\n<!-- SIGNATURE: ${signature} -->`;
      }

      // 2. Atualiza para FISCAL_SIGNED
      await tx.update(transactions)
        .set({
          fiscalAccessKey: fiscalKey,
          fiscalXml: finalXml,
          status: 'FISCAL_SIGNED',
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, transactionId));

      // 2. Geração da Prova de Origem (Hash Chained)
      // O dado para o hash inclui o Tríplice Vínculo: Venda + Banco + Fiscal
      const sealData = `${currentTx.saleId}|${currentTx.bankEndToEndId}|${fiscalKey}`;
      const { prevHash, currentHash } = await this.generateChainedHash(sealData);

      // 3. Finalização (COMMITTED)
      const [finalTx] = await tx.update(transactions)
        .set({
          status: 'COMMITTED',
          prevHash,
          currentHash,
          committedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, transactionId))
        .returning();

      // 4. Log de Auditoria Final
      await tx.insert(auditLogs).values({
        transactionId: finalTx.id,
        action: 'TRANSACTION_COMMITTED',
        newState: { 
          status: 'COMMITTED', 
          hash: currentHash,
          fiscalKey: fiscalKey 
        },
        actor: 'FISCAL_AUTHORIZER_SERVICE',
      });

      return finalTx;
    });
  }
}
