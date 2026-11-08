/**
 * Configuration for sensitive bank and payment integration keys.
 * 
 * WARNING: This configuration file relies on process.env and is designed for 
 * server-side use only. Do not import these values into client-side code
 * to prevent leaking sensitive credentials.
 */

export const bankConfig = {
  partnerAuthToken: process.env.BANK_PARTNER_AUTH_TOKEN || '',
  mercadopago: {
    publicKey: process.env.MERCADO_PAGO_PROD_PUBLIC_KEY || '',
    accessToken: process.env.MERCADO_PAGO_PROD_ACCESS_TOKEN || '',
    sandboxAccessToken: process.env.MERCADO_PAGO_SANDBOX_ACCESS_TOKEN || '',
    apiUrl: process.env.MERCADOPAGO_API_URL || 'https://api.mercadopago.com',
  },
  asaas: {
    apiKey: process.env.ASAAS_API_KEY || '',
  },
  officialAccount: {
    bankName: 'Banco Mercado Pago S.A.',
    bankCode: '323',
    agency: '0001',
    accountNumber: '8731119479-4',
    accountType: 'CONTA_CORRENTE',
    pixKey: '+5573998599213',
    pixKeyType: 'TELEFONE',
    cnpj: '68.603.032/0001-15',
    beneficiary: 'MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA',
    settlementType: 'D0_IMEDIATO',
  },
  stripe: {
    publicKey: process.env.STRIPE_PUBLIC_KEY || '',
    apiKey: process.env.STRIPE_API_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
};
