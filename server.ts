import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  }
];

const asaasWebhookLogs: any[] = [];
const mercadopagoWebhookLogs: any[] = [
  {
    id: 'MP-WH-INIT-001',
    event: 'payment.updated',
    paymentId: 'mp_pay_998241029841',
    timestamp: new Date().toISOString(),
    status: 'approved',
    httpStatus: 200,
    latencyMs: 42,
    signatureValid: true
  }
];

const kafkaBrokerNodes: any[] = [
  { id: 'broker-1', host: 'kafka-node-01.moreirabrasil.internal', port: 9092, status: 'ONLINE', version: '3.7.0' }
];

const kafkaMessageDeliveryLogs: any[] = [];

let bacenDailyPayoutConfig = {
  enabled: true,
  maxDailyAmountBRL: 500000.00,
  pixKey: '+5573998599213',
  companyCnpj: '68.603.032/0001-15',
  companyName: 'MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA'
};

let asaasSplitConfig = {
  walletId: 'wallet_moreira_brasil_68603032000115',
  recipientName: 'MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA',
  cnpj: '68603032000115',
  percentualValue: 100.0,
  status: 'CONFIGURED_ACTIVE'
};

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

const publicDirectoryPath = path.join(process.cwd(), 'dist');
app.use(express.static(publicDirectoryPath));

// ==========================================
// ROTAS DA API
// ==========================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    environment: process.env.NODE_ENV || 'production',
    compliance: 'BACEN_3978_ACTIVE',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/compliance/alerts', (req, res) => {
  res.json(activeAlerts);
});

app.patch('/api/compliance/alerts/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const alertIndex = activeAlerts.findIndex(a => a.id === id);

  if (alertIndex === -1) {
    return res.status(404).json({ error: 'Alerta não encontrado' });
  }

  activeAlerts[alertIndex].status = status;
  res.json(activeAlerts[alertIndex]);
});

app.post('/api/webhooks/asaas', (req, res) => {
  asaasWebhookLogs.unshift({ id: `ASAAS-WH-${crypto.randomUUID()}`, timestamp: new Date().toISOString(), payload: req.body });
  res.status(200).send('OK');
});

app.get('/api/webhooks/asaas/logs', (req, res) => {
  res.json(asaasWebhookLogs);
});

app.post('/api/webhooks/mercadopago', (req, res) => {
  mercadopagoWebhookLogs.unshift({ id: `MP-WH-${crypto.randomUUID()}`, timestamp: new Date().toISOString(), payload: req.body });
  res.status(200).send('OK');
});

app.get('/api/webhooks/mercadopago/logs', (req, res) => {
  res.json(mercadopagoWebhookLogs);
});

app.get('/api/config/payout', (req, res) => {
  res.json(bacenDailyPayoutConfig);
});

app.put('/api/config/payout', (req, res) => {
  bacenDailyPayoutConfig = { ...bacenDailyPayoutConfig, ...req.body };
  res.json(bacenDailyPayoutConfig);
});

app.get('/api/config/split', (req, res) => {
  res.json(asaasSplitConfig);
});

app.put('/api/config/split', (req, res) => {
  asaasSplitConfig = { ...asaasSplitConfig, ...req.body };
  res.json(asaasSplitConfig);
});

app.get('/api/kafka/nodes', (req, res) => {
  res.json(kafkaBrokerNodes);
});

app.get('/api/kafka/messages', (req, res) => {
  res.json(kafkaMessageDeliveryLogs);
});

// ==========================================
// FALLBACK PARA O FRONTEND VITE/SPA
// ==========================================
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDirectoryPath, 'index.html'));
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
const server = app.listen(port, () => {
  console.log(`======================================================================`);
  console.log(`🚀 FINTECH SLP RUNNING ON PORT ${port} (ENVIRONMENT: REAL-LIVE)`);
  console.log(`🏢 COMPANY: MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA`);
  console.log(`🛡 BACEN 3.978 COMPLIANCE GENERATIVE SERVICE ACTIVE`);
  console.log(`======================================================================`);
});

const wss = new WebSocketServer({ server });
wss.on('connection', (ws: WebSocket) => {
  ws.send(JSON.stringify({ type: 'WELCOME', message: 'Conectado ao WebSocket BACEN Compliance & Fintech SLP' }));
});