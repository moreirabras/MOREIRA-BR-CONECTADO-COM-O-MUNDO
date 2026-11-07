import { Kafka, logLevel as KafkaLogLevel } from 'kafkajs';
import { AuditService } from './src/services/AuditService.ts';
import dotenv from 'dotenv';

dotenv.config();

/**
 * WORKER DE PROCESSAMENTO E AUDITORIA (CONSUMIDOR KAFKA)
 * ----------------------------------------------------
 * Este serviço consome a fila de vendas, realiza o 'match' bancário,
 * dispara a emissão fiscal e sela o Tríplice Vínculo com Hash SHA-256.
 */

const kafka = new Kafka({
  clientId: 'audit-processor-worker',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
  logLevel: KafkaLogLevel.NOTHING,
  connectionTimeout: 2000,
  retry: { retries: 0 }
});

const consumer = kafka.consumer({ groupId: 'audit-group-v1' });

const run = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'vendas-globais-pendentes', fromBeginning: true });

    console.log('[AUDITOR] Worker de Processamento iniciado. Aguardando eventos...');

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        
        const rawData = JSON.parse(message.value.toString());
        console.log(`[AUDITOR] Processando Venda: ${rawData.id_transacao}`);

        try {
          // 1. Inicia o Tríplice Vínculo (Comercial + Bancário)
          const tx = await AuditService.processPayment({
            saleId: rawData.id_transacao,
            originUrl: rawData.origin_url || 'external-gateway',
            buyerTaxId: rawData.cliente_documento,
            originIp: rawData.metadata?.ip || '0.0.0.0',
            payload: rawData,
            bankEndToEndId: rawData.banco_id || `PIX-${Date.now()}`
          });

          // 2. Simulação de Integração com SEFAZ (Assinatura XML A1)
          const mockFiscalKey = Math.random().toString().slice(2, 46).padEnd(44, '0');
          const mockXml = `<nfe><id>${mockFiscalKey}</id><sale>${rawData.id_transacao}</sale><vencimento>ACID</vencimento></nfe>`;

          // 3. Sela a Transação e Gera a Prova de Origem Imutável (Commit)
          const finalAudit = await AuditService.commitFiscal(tx.id, mockFiscalKey, mockXml);

          console.log(`[AUDITOR] ✅ Transação SELADA: ${finalAudit.saleId}`);
          console.log(`[AUDITOR] 🛡️ Hash Forense: ${finalAudit.currentHash}`);

        } catch (error: any) {
          console.error(`[AUDITOR] ❌ Falha crítica ao processar ${rawData.id_transacao}:`, error.message);
        }
      },
    });
  } catch {
    console.log('[AUDITOR] Servidor Kafka indisponível para o worker. Operação suspensa.');
  }
};

run().catch(() => {});
