# DOSSIÊ DE INTEGRAÇÃO TÉCNICA E CONFORMIDADE REGULATÓRIA BACEN
## MERCADO PAGO BRASIL (BANCO 323) ➔ MOREIRA BRASIL LTDA
**Data do Documento:** 07 de Novembro de 2026  
**Finalidade:** Liberação e Homologação de Checkout Transparente Pix com Disponibilidade D+0 Imediata  
**Protocolo Forense:** `MP-SEFAZ-BR-68603032000115-2026-D0`  

---

### 1. IDENTIFICAÇÃO DO TITULAR DA CONTA (ESTABELECIMENTO PJ)
- **Razão Social:** MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA  
- **Nome Fantasia:** Moreira Brasil  
- **CNPJ:** 68.603.032/0001-15  
- **Situação Cadastral:** ATIVA (Receita Federal do Brasil)  
- **CNAE Principal:** 62.01-5-01 - Desenvolvimento de programas de computador sob encomenda  
- **CNAE Secundário:** 62.02-3-00 - Desenvolvimento e licenciamento de programas de computador customizáveis  
- **Endereço Fiscal:** Av. Tancredo Neves, 2539, Sala 1402, Caminho das Árvores, Salvador - BA, CEP 41820-021  
- **E-mail Oficial do Administrador:** `josemoreirabrazil@gmail.com`  

---

### 2. DADOS DA CONTA BANCÁRIA OFICIAL MERCADO PAGO (DESTINO DOS REPASSES D+0)
- **Instituição Financeira:** Banco Mercado Pago S.A. (Código Compensação Bacen: 323)  
- **Agência:** 0001  
- **Conta Corrente PJ:** 8731119479-4  
- **Chave Pix Oficial Vinculada:** `+5573998599213` (Telefone Corporativo PJ)  
- **Chave Pix Secundária:** `68.603.032/0001-15` (CNPJ Oficial)  
- **Tipo de Liquidação Solicitada:** **D+0 Instantâneo (Immediate Settlement)**  
- **Regime de Split:** 100% dos recursos líquidos creditados automaticamente na Conta Corrente PJ supramencionada  

---

### 3. ARQUITETURA TÉCNICA E WEBHOOKS EM TEMPO REAL
O sistema Vortex Audit Core da Moreira Brasil integra-se nativamente à API REST do Mercado Pago através dos seguintes canais certificados:

1. **Endpoint Oficial de Webhook (mTLS / SSL TLS 1.3):**
   - URL de Produção: `https://moreira-br-conectado-com-o-mundo-tf.vercel.app/v1/webhook/mercadopago`
   - URL Failover / Dev: `https://ais-dev-v4ef2ha3nqune4o3rs6di6-745731105037.us-west2.run.app/v1/webhook/mercadopago`
   - Eventos Subscritos: `payment.created`, `payment.updated`, `merchant_order.updated`

2. **Validação Criptográfica de Assinatura (HMAC SHA-256):**
   - Cabeçalhos inspecionados: `x-signature` e `x-request-id`
   - Formato do Digest: `ts=[timestamp],v1=[hmac_sha256_hash]`
   - Timestamp Window: Tolerância máxima de 300 segundos para prevenção de ataques de repetição (*replay attacks*).

3. **Mecanismo de Checkout Transparente Pix:**
   - Criação de pagamento via API `/v1/payments` (Mercado Pago SDK v3 / REST)
   - Payload Pix padrão EMVCo com CRC-16 CCITT
   - QR Code dinâmico com expiração de 15 minutos (900 segundos) e conciliação atômica via `id_transacao`.

---

### 4. CONFORMIDADE COM NORMAS BACEN E SEFAZ (TRÍPLICE VÍNCULO FORENSE)
Para garantir a máxima transparência fiscal e financeira, cada pagamento processado pelo Mercado Pago aciona instantaneamente:

1. **Norma Bacen nº 3.978 / Resolução nº 4.949 (Prevenção à Lavagem de Dinheiro - PLD):**
   - Identificação completa do pagador (CPF/CNPJ, IP de origem, timestamp UTC).
   - Análise comportamental automatizada contra fracionamento de depósitos (*smurfing*).
   - Verificação em tempo real de Pessoas Politicamente Expostas (PEP).

2. **Conformidade Fiscal SEFAZ-SP / SEFAZ Nacional (NFe v4.00):**
   - Assinatura digital A1 com certificado e-CNPJ Moreira Brasil extraído em memória (Zero-Disk).
   - Emissão da NFe com alíquota consolidada de serviços (14,45% recolhidos) e 85,55% líquidos liberados para uso.
   - Envio automático de cópias XML e PDF para `josemoreirabrazil@gmail.com`.

3. **Imutabilidade em Blockchain Forense Interno (SHA-256 Chained Hash):**
   - Cada evento de confirmação do webhook Mercado Pago gera um bloco contendo o hash do bloco anterior, o ID do pagamento Mercado Pago e a chave de acesso da NFe.

---

### 5. DECLARAÇÃO FORMAL DE TRANSPARÊNCIA E PEDIDO DE DISPONIBILIZAÇÃO IMEDIATA
Solicita-se à equipe de Compliance e Engenharia do **Mercado Pago Brasil**:
1. Homologação final do aplicativo no portal de desenvolvedores Mercado Pago sob as credenciais do CNPJ `68.603.032/0001-15`.
2. Habilitação de **disponibilidade de saldo D+0** para todos os pagamentos originados via Pix no Checkout Transparente.
3. Dispensa de retenção preventiva com base no cumprimento integral das diretrizes de segurança, auditoria e emissão fiscal concomitante.

**Responsável Legal:** MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA  
**Contato Operacional 24/7:** `josemoreirabrazil@gmail.com`  
**Chave Pix Titular:** `+5573998599213`  
