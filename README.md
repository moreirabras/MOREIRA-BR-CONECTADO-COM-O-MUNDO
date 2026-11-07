# 🛡️ FINTECH SLP & CÂMBIO ERGONOMICS BACEN 3.978
### **MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA — CNPJ 68.603.032/0001-15**

> **Sistema de Auditoria Financeira Imutável, Liquidação de Cobranças, Split de Pagamentos Asaas, Emissão Fiscal SEFAZ e Defesa Ativa Militar SOC (SLA 99.999% · 24/7/365 Dias)**

---

## 📌 Visão Geral do Sistema

O **FINTECH SLP & CÂMBIO ERGONOMICS** é uma plataforma financeira de alta disponibilidade projetada para operar ininterruptamente durante os 365 dias do ano (8.760 horas/ano) sem janelas de parada. 

A arquitetura combina liquidação multi-gateway de vendas (Asaas, Mercado Pago, Stripe UAE/EUA, Razorpay Índia), repasse automático via **Split de Pagamentos Asaas** para a conta bancária da **Moreira Brasil (CNPJ 68.603.032/0001-15)**, repatriação de câmbio conforme a **Normativa BACEN nº 3.978**, validação de Invoices de exportação de tecnologia com o **XSD Oficial da SEFAZ (NFe v4.00)** e rastreabilidade forense imutável com encadeamento de hashes **SHA-256**.

---

## 🚀 Principais Módulos do Sistema

### 1. 🚀 Central de Prontidão Go-Live (Audit 10/10)
- Score de prontidão em tempo real para implantação em nuvem.
- Validador automatizado dos 10 requisitos críticos de produção (Dockerfile, XSD SEFAZ, Certificado A1, SOC WAF, Rastro Forense, Health Checks, Câmbio BACEN, Gateways Live, PostgreSQL HA e SLA 24/7/365).

### 2. 💳 Ingestão de Webhooks & Split de Pagamento Asaas
- **Ingestão em Tempo Real:** Processamento de webhooks para Pix Direct, Boleto Bancário e Cartão de Crédito com validação de token `asaas-access-token`.
- **Split de Pagamentos:** Direcionamento automático de 100% (ou percentual configurado) do faturamento das cobranças de clientes para a conta bancária da **Moreira Brasil LTDA**.
- **Painel de Logs Auditados:** Monitor de eventos (`PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`) com busca por CNPJ/CPF e exportação.

### 3. 📄 Certificado e-CNPJ A1 & Conformidade Fiscal SEFAZ
- **Entrada Protegida de Senha:** Campo seguro com ocultação visual e armazenamento criptografado na sessão local do navegador para o parâmetro `SEFAZ_CERT_PASSWORD`.
- **Validação em Memória (RAM):** Extração de chaves criptográficas RSA 2048-bit sem gravação em disco (Zero-Disk Storage).
- **Validador XSD SEFAZ NFe v4.00:** Verificação estrutural de XMLs de exportação de serviços de tecnologia (CFOP 7xxx).

### 4. 📊 Painel Executivo de Faturamento Real & Impostos SEFAZ
- **Dados Estritamente Reais:** Monitoramento de fluxo de caixa e faturamento acumulado baseado unicamente em transações reais liquidadas (sem simulações fictícias).
- **Apuração de Impostos:** Detalhamento do recolhimento fiscal SEFAZ (ISS 6%, PIS/COFINS 3.65%, IRPJ/CSLL 4.8%).
- **Gráficos Recharts:** Visualização de receitas brutas, saldo líquido e atribuição por gateway.

### 5. 🛡️ Escudo de Segurança Militar SOC (Defesa Ativa IDPS)
- **WAF & IDPS:** Sanitização contra injeção SQL, XSS, Command Injection, Path Traversal e ataques de Força Bruta.
- **Firewall & Rate Limiting:** Limitação de requisições (120 req/min por IP) e banlist automatizado de IPs invasores.
- **Headers Bancários Estritos:** Exigência de HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff e CORS configurado.

### 6. ⚡ Barramento de Mensageria Apache Kafka
- Monitoramento da saúde de tópicos (`vendas-globais-pendentes`, `webhooks-asaas-ingest`, `audit-logs-stream`, `sefaz-invoices-queue`).
- Leitura dos parâmetros do `.env` (`ENABLE_KAFKA` e `KAFKA_BROKERS`), medição de latência sub-milissegundo e monitor de lag de Consumer Groups.

---

## 🛠️ Stack Tecnológica

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide Icons, Motion (Framer Motion).
- **Backend:** Node.js 20, Express, WebSockets (`ws`), KafkaJS, Drizzle ORM.
- **Banco de Dados:** PostgreSQL / Cloud SQL / CockroachDB com suporte SSL e pool de conexões.
- **Infraestrutura & Nuvem:** Docker Multi-stage, Google Cloud Run (Region `southamerica-east1` São Paulo), Cloudflare WAF Enterprise.

---

## ⚙️ Variáveis de Ambiente (`.env`)

```env
# ==============================================================================
# 🏢 DADOS DA EMPRESA E SEFAZ (MOREIRA BRASIL)
# ==============================================================================
BACEN_REGISTERED_CNPJ=68603032000115
SEFAZ_ENV=PRODUCAO
SEFAZ_UF_EMISSOR=SP

# ==============================================================================
# 🔑 CERTIFICADO DIGITAL e-CNPJ A1 (SEFAZ)
# ==============================================================================
SEFAZ_CERT_PASSWORD=8RPM758ZL3AVZ6
SEFAZ_CERT_PFX_BASE64=MIIKIgIBAz...

# ==============================================================================
# 💳 INTEGRAÇÃO ASAAS (PRODUÇÃO)
# ==============================================================================
ASAAS_API_KEY=$aact_prod_SUA_CHAVE_AQUI
ASAAS_WEBHOOK_SECRET=seu_token_de_autenticacao_do_webhook

# ==============================================================================
# 🔒 SEGURANÇA E LIMITES DE REDE
# ==============================================================================
WAF_SECURITY_SHIELD_ENABLED=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=300
INTEGRITY_SALT_SECRET=b63c8a92f10e47d891b2c5e4a7f3d9e0123456789abcdef0123456789abcdef

# ==============================================================================
# 🚀 MENSAGERIA APACHE KAFKA
# ==============================================================================
ENABLE_KAFKA=false
KAFKA_BROKERS=localhost:9092