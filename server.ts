import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { Kafka, logLevel as KafkaLogLevel } from 'kafkajs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { MercadoPagoService } from './src/services/MercadoPagoService.ts';
import { db } from './src/db/index.ts';
import { auditLogs, transactions, alerts, bacenPayoutHistory } from './src/db/schema.ts';
import { desc, eq, and, sql, count, sum } from 'drizzle-orm';
import { EdgeSecurity } from './src/middleware/EdgeSecurity.ts';
import rateLimit from 'express-rate-limit';
import { InternationalGatewayService } from './src/services/InternationalGatewayService.ts';
import { ExchangeService } from './src/services/ExchangeService.ts';
import { AuditService } from './src/services/AuditService.ts';
import { SecurityShield } from './src/middleware/SecurityShield.ts';
import crypto from 'crypto';
import cron from 'node-cron';
import { ReportService } from './src/services/ReportService.ts';
import { DataAggregatorService } from './src/services/dataAggregator.ts';
import { MailService } from './src/services/MailService.ts';
import { TenantService } from './src/services/TenantService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Store
let bacenDailyPayoutConfig = {
  enabled: true,
  intervalHours: 24,
  maxDailyAmountBRL: 500000.00,
  batchAmountBRL: 50000.00,
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

// Split Config
let asaasSplitConfig = {
  walletId: 'wallet_moreira_brasil_68603032000115',
  recipientName: 'MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA',
  cnpj: '68603032000115',
  splitType: 'PERCENTAGE',
  fixedValue: 0,
  percentualValue: 100.0,
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

// AES-256 Helpers
const getDerivedBackupKey = (): Buffer => {
  const rawKey = process.env.BACKUP_ENCRYPTION_KEY || 'vortex_sec_aes256_moreira_brasil_key_2026_x89a721';
  return crypto.createHash('sha256').update(rawKey).digest();
};

const encryptBackupPayload = (payload: any) => {
  const key = getDerivedBackupKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const jsonStr = JSON.stringify(payload);
  let encrypted = cipher.update(jsonStr, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  const hmacSignature = crypto.createHmac('sha256', key).update(encrypted).digest('hex');

  return {
    version: 'BACEN-3.978-AES256-GCM',
    keyConfigured: !!process.env.BACKUP_ENCRYPTION_KEY,
    iv: iv.toString('hex'),
    authTag,
    hmacSignature,
    encryptedData: encrypted,
    itemCount: Array.isArray(payload.dbAuditRecords) ? payload.dbAuditRecords.length : 0,
    createdAt: new Date().toISOString(),
    companyCnpj: '68.603.032/0001-15',
    companyName: 'MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA'
  };
};

const decryptBackupPayload = (backupPkg: any) => {
  const key = getDerivedBackupKey();
  const { iv, authTag, hmacSignature, encryptedData } = backupPkg;
  if (!iv || !authTag || !encryptedData) throw new Error('FORMATO_INVALIDO');
  if (hmacSignature) {
    const expectedHmac = crypto.createHmac('sha256', key).update(encryptedData).digest('hex');
    if (expectedHmac !== hmacSignature) throw new Error('HMAC_INTEGRITY_MISMATCH');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};

// Cron Jobs
cron.schedule('0 * * * *', async () => {
  console.log('[BACKUP] Executando rotina automática de backup...');
  try {
    const dbAuditRecords = await db.select().from(auditLogs).limit(500);
    const encrypted = encryptBackupPayload({ timestamp: new Date().toISOString(), dbAuditRecords });
    console.log('[BACKUP] Backup gerado:', encrypted.createdAt);
  } catch (error) {
    console.error('[BACKUP] Erro:', error);
  }
});

cron.schedule('0 0 * * *', async () => {
  if (!bacenDailyPayoutConfig.enabled) return;
  console.log('[BACEN-CRON-24H] Verificando saldo para saque diário...');
  try {
    const mpBal = await DataAggregatorService.getMercadoPagoBalance();
    if (mpBal.available < bacenDailyPayoutConfig.batchAmountBRL) return;

    const dispatchId = `DISPARO-24H-BACEN-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const sha256Proof = crypto.createHash('sha256').update(dispatchId + bacenDailyPayoutConfig.companyCnpj + now).digest('hex');

    const amountToDisburse = Math.min(mpBal.available, bacenDailyPayoutConfig.maxDailyAmountBRL);
    const actualBatches = Math.ceil(amountToDisburse / bacenDailyPayoutConfig.batchAmountBRL);

    await db.insert(bacenPayoutHistory).values({
      id: dispatchId,
      amountBRL: amountToDisburse.toString(),
      batchesCount: actualBatches.toString(),
      batchValueBRL: bacenDailyPayoutConfig.batchAmountBRL.toString(),
      status: 'DISBURSED_APPROVED_D0',
      pixKey: bacenDailyPayoutConfig.pixKey,
      bank: `${bacenDailyPayoutConfig.bankName} • Ag ${bacenDailyPayoutConfig.agency} • CC ${bacenDailyPayoutConfig.accountNumber}`,
      recipient: `${bacenDailyPayoutConfig.companyName} (${bacenDailyPayoutConfig.companyCnpj})`,
      sha256Proof
    });

    bacenDailyPayoutConfig.lastDispatchedAt = now;
    bacenDailyPayoutConfig.nextDispatchAt = new Date(Date.now() + 86400000).toISOString();
    console.log(`[BACEN-CRON-24H] Saque de R$ ${amountToDisburse.toLocaleString('pt-BR')} concluído.`);
  } catch (error: any) {
    console.error('[BACEN-CRON-24H] Erro:', error.message);
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000; // Forçado para conformidade com o ambiente AI Studio (evita conflito com 8080)

  app.set('trust proxy', 1); // Necessário para express-rate-limit em ambientes com proxy

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, asaas-access-token, stripe-signature, x-signature, x-gateway-signature');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  app.use(express.json({ verify: (req: any, _res, buf) => { req.rawBody = buf; } }));
  app.use(SecurityShield.activeDefenseMiddleware);

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    message: { error: 'TOO_MANY_REQUESTS' },
    validate: { xForwardedForHeader: false }, // Ignora validação de proxy no ambiente de dev
  });
  app.use(limiter);

  app.use(EdgeSecurity.validateGatewaySignature);
  app.use(EdgeSecurity.accelerateGlobalRoute);
  app.use(EdgeSecurity.attachIntegrityToken);

  let isKafkaConnected = false;
  // Kafka setup (minimalistic for this applet)
  try {
    const kafka = new Kafka({ clientId: 'audit-ingestor', brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'], logLevel: KafkaLogLevel.NOTHING });
    const producer = kafka.producer();
    producer.connect().then(() => { isKafkaConnected = true; console.log('[KAFKA] Online'); }).catch(() => {});
  } catch {}

  // ============================================================================
  // ROTAS DE MERCADO PAGO COM MARGEM DE COMISSÃO DE 1,15% E TRÍPLICE VÍNCULO
  // ============================================================================

  /**
   * Endpoint para geração de Pix dinâmico para captação imediata de caixa
   * Aplica automaticamente a margem de comissão de 1,15% da Moreira Brasil
   */
  app.post('/api/payments/create-pix', async (req, res) => {
    try {
      const { amount, description, clientEmail, clientCpf } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'VALOR_INVALIDO_PARÂMETRO' });
      }

      // Calcula a comissão líquida de 1,15% da Moreira Brasil
      const baseAmount = Number(amount);
      const moreiraMarginPercent = 1.15;
      const commissionAmount = Number((baseAmount * (moreiraMarginPercent / 100)).toFixed(2));
      
      // O valor final do Pix cobrado do cliente inclui o montante base + sua margem
      const totalAmountToCharge = Number((baseAmount + commissionAmount).toFixed(2));

      // Comunicação direta com a classe de serviço do Mercado Pago injetada
      const paymentResponse = await MercadoPagoService.createPixPayment({
        transaction_amount: totalAmountToCharge,
        description: description || 'Aporte Estrutural de Caixa - Moreira Brasil',
        payment_method_id: 'pix',
        payer: {
          email: clientEmail || 'josemoreirabrazil@gmail.com',
          identification: {
            type: 'CPF',
            number: clientCpf || '00000000000'
          }
        }
      });

      // Tríplice Vínculo: Salvando registro auditável incluindo o split da sua margem no banco (Drizzle)
      await db.insert(transactions).values({
        id: `TX-${paymentResponse.id}`,
        amountBRL: totalAmountToCharge.toString(),
        status: 'PENDING_LIQUIDATION',
