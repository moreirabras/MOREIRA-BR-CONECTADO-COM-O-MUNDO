import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { Kafka, logLevel as KafkaLogLevel } from 'kafkajs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { MercadoPagoService } from './src/services/MercadoPagoService.ts';
import { db } from './src/db/index.ts';
import { auditLogs } from './src/db/schema.ts';
import { desc } from 'drizzle-orm';
import { EdgeSecurity } from './src/middleware/EdgeSecurity.ts';
import rateLimit from 'express-rate-limit';
import { InternationalGatewayService } from './src/services/InternationalGatewayService.ts';
import { ExchangeService } from './src/services/ExchangeService.ts';
import { AuditService } from './src/services/AuditService.ts';
import { SecurityShield } from './src/middleware/SecurityShield.ts';
import crypto from 'crypto';
import cron from 'node-cron';
import { ReportService } from './src/services/ReportService.ts';
import { initializeMtlsSecurity } from './src/services/security.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuração estrita do WAF Enterprise Limit: 120 requisições/minuto por IP
const wafRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // Janela de 1 minuto
  max: 120, // Limite de 120 requisições por IP
  standardHeaders: true, // Retorna as informações de limite nos headers RateLimit-*
  legacyHeaders: false, // Desativa os headers X-RateLimit-* legados
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Defesa de Borda WAF: Limite de 120 requisições por minuto excedido.',
    code: 429
  }
});

// Aplica o WAF Rate Limiter globalmente ou em rotas críticas de API
app.use('/api/', wafRateLimiter);

// Inicialização da Segurança de Borda & mTLS Cora PJ em RAM (Zero-Disk Extraction)
try {
  const { secureCoraAgent, secureSefazAgent } = initializeMtlsSecurity();
  app.set('secureCoraAgent', secureCoraAgent);
  app.set('secureSefazAgent', secureSefazAgent);
} catch (error: any) {
  console.error("🚨 [Vortex Security Gate]: Falha crítica na injeção do Certificado A1 em RAM:", error.message);
  process.exit(1);
}

/**
 * Função Engine: Cálculo do Hash SHA-256 Encadeado para o Golden Record
 * Garante o encadeamento imutável de transações (Blockchain Forense)
 */
export function calcularHashGoldenRecord(transacaoAtual: object, hashAnterior: string = ''): string {
  const payloadString = JSON.stringify(transacaoAtual);
  return crypto
    .createHash('sha256')
    .update(hashAnterior + payloadString)
    .digest('hex');
}

// In-memory Bacen Compliance & Audit Alerts Store
const activeAlerts: any[] = [
  {
    id: 'ALT-BACEN-9901',
    type: 'BACEN_NORMA_3978',
    category: 'NORMA_BACEN',
    severity: 'HIGH',
    title: 'Monitoramento de Operação com Pessoa Politicamente Exposta (PEP)',
    description: 'Transação iniciada por contraparte identificada como PEP sem preenchimento prévio da declaração complementar de origem dos recursos (Art. 12).',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    entityName: 'SANTOS CONSTRUCOES E EMBARQUES LTDA',
    taxId: '12.345.678/0001-90',
    transactionId: 'TX-ST-UAE-33910021-DUBAI',
    ruleReference: 'Norma Bacen nº 3.978 - Art. 12',
    status: 'PENDENTE'
  },
  {
    id: 'ALT-HASH-4410',
    type: 'HASH_INCONSISTENCY',
    category: 'INCONSISTENCIA_DADOS',
    severity: 'CRITICAL',
    title: 'Divergência Crítica no Rastro Forense SHA-256',
    description: 'O recálculo automático do hash da transação no banco de auditoria divergiu do selo assinado pela autoridade fiscal.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    transactionId: 'TX-GLOBAL-99812412-SEFAZ',
    ruleReference: 'Resolução Bacen nº 4.949 - Art. 4',
    status: 'PENDENTE',
    hashExpected: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    hashFound: 'b09a9f2398ab012c82ff3004a8b7c3d11e002947a1198c005e8392100e479c31'
  },
  {
    id: 'ALT-BACEN-9902',
    type: 'HIGH_VOLUME_SUSPICION',
    category: 'FRAUDE_POTENCIAL',
    severity: 'MEDIUM',
    title: 'Volume Fracionado Atípico em Curto Intervalo (Smurfing)',
    description: 'Sequência de depósitos de R$ 9.900,00 identificada pelo algoritmo de inteligência em conformidade BACEN.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    entityName: 'MOREIRA BRASIL LOGISTICA E IMPORTAÇÃO',
    taxId: '68.603.032/0001-15',
    ruleReference: 'Norma Bacen nº 3.978 - Art. 18',
    status: 'EM_INVESTIGACAO'
  }
];

// In-memory Asaas Webhook Event Store
const asaasWebhookLogs: any[] = [];

// In-memory Mercado Pago Webhook Audit Event Store (Bacen 3.978 & D+0 Instant Settlement)
const mercadopagoWebhookLogs: any[] = [
  {
    id: 'MP-WH-INIT-001',
    event: 'payment.updated',
    paymentId: 'mp_pay_998241029841',
    timestamp: new Date().toISOString(),
    status: 'approved',
    httpStatus: 200,
    latencyMs: 42,
    signatureValid: true,
    topic: 'payment',
    amountBRL: 299.00,
    payerDoc: '68.603.032/0001-15',
    blockchainHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    payloadSummary: {
      action: 'payment.updated',
      id: 'mp_pay_998241029841',
      live_mode: true,
      type: 'payment',
      date_created: new Date().toISOString(),
      user_id: 'MOREIRA_BRASIL_PJ',
      api_version: 'v1'
    }
  }
];

// In-memory Kafka Message Delivery & Cluster Nodes Store
const kafkaBrokerNodes: any[] = [
  { id: 'broker-1', host: 'kafka-node-01.moreirabrasil.internal', port: 9092, role: 'CONTROLLER_LEADER', rack: 'br-east-1a', status: 'ONLINE', latencyMs: 3, partitionsHosted: 9, uptime: '365d 00h', version: '3.7.0' },
  { id: 'broker-2', host: 'kafka-node-02.moreirabrasil.internal', port: 9092, role: 'REPLICA_FOLLOWER', rack: 'br-east-1b', status: 'ONLINE', latencyMs: 4, partitionsHosted: 8, uptime: '365d 00h', version: '3.7.0' },
  { id: 'broker-3', host: 'kafka-node-03.moreirabrasil.internal', port: 9092, role: 'REPLICA_FOLLOWER', rack: 'br-east-1c', status: 'ONLINE', latencyMs: 5, partitionsHosted: 7, uptime: '365d 00h', version: '3.7.0' }
];

const kafkaMessageDeliveryLogs: any[] = [
  {
    eventId: 'EVT-KAFKA-1001',
    topic: 'vendas-globais-pendentes',
    partition: 1,
    offset: 48921,
    key: 'TX-PROD-MOREIRA-BRASIL-142850400',
    eventType: 'PAYMENT_COMMITTED',
    priority: 'CRITICAL',
    senderNode: 'broker-1',
    targetConsumerGroup: 'audit-ingestor-group',
    status: 'ACK_DELIVERED',
    ackLatencyMs: 3.2,
    timestamp: new Date(Date.now() - 120000).toISOString(),
    sha256Digest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  {
    eventId: 'EVT-KAFKA-1002',
    topic: 'sefaz-invoices-queue',
    partition: 0,
    offset: 12034,
    key: 'NFE-3526086860303200011555001',
    eventType: 'SEFAZ_XSD_SIGNED',
    priority: 'HIGH',
    senderNode: 'broker-2',
    targetConsumerGroup: 'sefaz-emitter-group',
    status: 'ACK_DELIVERED',
    ackLatencyMs: 4.5,
    timestamp: new Date(Date.now() - 360000).toISOString(),
    sha256Digest: 'b09a9f2398ab012c82ff3004a8b7c3d11e002947a1198c005e8392100e479c31'
  },
  {
    eventId: 'EVT-KAFKA-1003',
    topic: 'webhooks-asaas-ingest',
    partition: 2,
    offset: 89312,
    key: 'WH-ASAAS-PIX-299',
    eventType: 'PIX_SETTLEMENT_D0',
    priority: 'CRITICAL',
    senderNode: 'broker-1',
    targetConsumerGroup: 'audit-ingestor-group',
    status: 'ACK_DELIVERED',
    ackLatencyMs: 2.8,
    timestamp: new Date(Date.now() - 600000).toISOString(),
    sha256Digest: '7c4a8d09f710d2b83892339f8389102938475610293847561029384756102938'
  }
];

// In-memory Store: Agendamento e Histórico de Disparos Automáticos de Saques Diários Bacen 24h
let bacenDailyPayoutConfig = {
  enabled: true,
  intervalHours: 24,
  maxDailyAmountBRL: 500000.00, // Teto Máximo Diário Bacen PJ
  batchAmountBRL: 50000.00,      // Lote padrão por disparo R$ 50k
  maxBatchesPerDay: 10,
  pixKey: '+5573998599213',
  pixKeyType: 'TELEFONE',
  bankName: 'Mercado Pago (Código 323)',
  agency: '0001',
  accountNumber: '8731119479-4',
  companyCnpj: '68.603.032/0001-15',
  companyName: 'MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA',
  lastDispatchedAt: new Date().toISOString(),
  nextDispatchAt: new Date(Date.now() + 86400000).toISOString()
};

const bacenDailyPayoutHistory: any[] = [
  {
    id: 'DISPARO-24H-BACEN-001',
    amountBRL: 500000.00,
    batchesCount: 10,
    batchValueBRL: 50000.00,
    status: 'DISBURSED_APPROVED_D0',
    pixKey: '+5573998599213',
    bank: 'Mercado Pago (323) • Ag 0001 • CC 8731119479-4',
    recipient: 'MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA (68.603.032/0001-15)',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    nextScheduledAt: new Date(Date.now() + 86400000).toISOString(),
    sha256Proof: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  }
];

// Configuração Padrão do Split de Pagamento Asaas para Moreira Brasil
let asaasSplitConfig = {
  walletId: 'wallet_moreira_brasil_68603032000115',
  recipientName: 'MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA',
  cnpj: '68603032000115',
  splitType: 'PERCENTAGE', // 'PERCENTAGE' ou 'FIXED'
  fixedValue: 0,
  percentualValue: 100.0, // 100% dos pagamentos direcionados para a Moreira Brasil
  bankInfo: {
    bankName: 'Mercado Pago',
    bankCode: '323',
    agency: '0001',
    account: '8731119479-4',
    accountType: 'CONTA_CORRENTE',
    pixKey: '+5573998599213'
  },
  autoTransfer: true,
  status: 'CONFIGURED_ACTIVE',
  lastUpdated: new Date().toISOString()
};

// In-Memory Real-Time Audit Logs & Global Clients Array
const auditLogsStorage: any[] = [];
const globalClients: any[] = [];
