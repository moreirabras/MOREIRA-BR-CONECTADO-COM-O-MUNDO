import { FirestorePersistenceService } from './FirestorePersistenceService.ts';

/**
 * Tenant / Subscriber Service
 * Gerencia os dados operacionais, fiscais e cadastrais dos clientes assinantes do sistema,
 * garantindo isolamento multitenant estrito sem interferir na governança máxima do detentor (Moreira Brasil).
 */

export interface TenantSubscriberProfile {
  id: string;
  subscriptionTier: 'ENTERPRISE_PRO' | 'CORPORATE_GOLD' | 'FINTECH_SCALE';
  status: 'ACTIVE' | 'SUSPENDED' | 'CONFIGURING';
  createdAt: string;
  lastUpdated: string;
  
  // Dados Constitucionais da Empresa do Assinante (para NF-e própria)
  company: {
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    inscricaoEstadual: string;
    inscricaoMunicipal: string;
    regimeTributario: 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | 'MEI';
    cnaePrincipal: string;
    aliquotaImpostoPercentual: number;
    emailFiscal: string;
    telefone: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      uf: string;
      cep: string;
    };
  };

  // Configuração Fiscal e SEFAZ do Assinante
  fiscalSettings: {
    ambienteSefaz: 'PRODUCAO' | 'HOMOLOGACAO';
    serieNfe: string;
    proximoNumeroLote: number;
    certificadoDigital: {
      status: 'CONFIGURADO' | 'PENDENTE' | 'EXPIRADO';
      tipo: 'A1_PKCS12';
      nomeArquivo?: string;
      validade?: string;
      fingerprint?: string;
    };
    aliquotas: {
      iss: number;
      pis: number;
      cofins: number;
      irpj: number;
      csll: number;
    };
    autoSendClientEmail: boolean;
    xmlBackupEnabled: boolean;
  };

  // Configuração Operacional do Assinante (Comando das Operações)
  operationalSettings: {
    checkoutTitle: string;
    paymentMethods: {
      pix: boolean;
      creditCard: boolean;
      boleto: boolean;
      internationalCrossBorder: boolean;
    };
    pixExpirationMinutes: number;
    creditCardMaxInstallments: number;
    boletoDueDays: number;
    dailyTransactionLimitBRL: number;
    antiFraudSensitivity: 'ALTO' | 'MEDIO' | 'PADRAO';
    webhookUrl: string;
    webhookSecret: string;
    apiPublicKey: string;
    apiSecretKey: string;
  };

  // Metadados de Separação de Autoridade (Garante não interferência no comando máximo)
  masterGovernance: {
    governanceAuthority: string;
    masterOperator: string;
    custodyBank: string;
    forensicAuditEnforced: boolean;
    nonInterferenceGuaranteed: boolean;
  };
}

export const FREE_TRIAL_DAYS = 15;

export interface SubscriptionPlan {
  id: 'STARTER_ENTERPRISE' | 'CORPORATE_GOLD' | 'FINTECH_SCALE';
  name: string;
  tagline: string;
  monthlyPriceBRL: number;
  annualPriceBRL: number;
  trialDays: number;
  trialPeriodText: string;
  recommended?: boolean;
  maxMonthlyVolumeBRL: number | 'ILIMITADO';
  features: string[];
  sefazNfeIncluded: boolean;
  bacenPldIncluded: boolean;
  dedicatedAccountManager: boolean;
  supportLevel: string;
}

export const MARKET_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'STARTER_ENTERPRISE',
    name: 'Starter Enterprise',
    tagline: 'Ideal para PMEs, pequenas construtoras e startups em crescimento',
    monthlyPriceBRL: 499.00,
    annualPriceBRL: 4990.00,
    trialDays: FREE_TRIAL_DAYS,
    trialPeriodText: '15 Dias de Degustação Grátis',
    maxMonthlyVolumeBRL: 100000.00,
    features: [
      '15 Dias de Teste Gratuito (Sem cobrança imediata)',
      'Até R$ 100.000,00 de faturamento mensal auditado',
      'Emissão de NF-e própria SEFAZ v4.00 (Certificado A1)',
      'Checkout Pix Mercado Pago D+0 Instantâneo',
      'Tríplice Vínculo Transacional (Venda + Banco + NFe)',
      'Blockchain Forense Interno (Hash SHA-256 em cadeia)',
      'Webhooks com assinatura HMAC SHA-256',
      'Suporte via e-mail e canal de chamados (SLA 24h)'
    ],
    sefazNfeIncluded: true,
    bacenPldIncluded: true,
    dedicatedAccountManager: false,
    supportLevel: 'PADRÃO 24H'
  },
  {
    id: 'CORPORATE_GOLD',
    name: 'Corporate Gold',
    tagline: 'O plano mais escolhido por médias empresas e grandes operadoras',
    monthlyPriceBRL: 1290.00,
    annualPriceBRL: 12900.00,
    trialDays: FREE_TRIAL_DAYS,
    trialPeriodText: '15 Dias de Degustação Grátis',
    recommended: true,
    maxMonthlyVolumeBRL: 500000.00,
    features: [
      '15 Dias de Teste Gratuito com acesso total',
      'Até R$ 500.000,00 de faturamento mensal auditado',
      'Todos os recursos do Starter Enterprise',
      'Motor de Câmbio & Repatriação Bacen 3.978 PLD automatizado',
      'Operações Multimoeda (USD, EUR, AED, BRL)',
      'Antifraude com análise comportamental e IA em tempo real',
      'Split de pagamentos 100% automático para conta corporativa',
      'Saques programados Bacen em ciclos diários 24h',
      'Gerente de conta dedicado & suporte telefônico 24/7'
    ],
    sefazNfeIncluded: true,
    bacenPldIncluded: true,
    dedicatedAccountManager: true,
    supportLevel: 'DEDICADO 24/7'
  },
  {
    id: 'FINTECH_SCALE',
    name: 'FinTech Scale Global',
    tagline: 'Para grandes conglomerados, fintechs e multinacionais cross-border',
    monthlyPriceBRL: 3490.00,
    annualPriceBRL: 34900.00,
    trialDays: FREE_TRIAL_DAYS,
    trialPeriodText: '15 Dias de Degustação Grátis',
    maxMonthlyVolumeBRL: 'ILIMITADO',
    features: [
      '15 Dias de Teste Gratuito Enterprise Ilimitado',
      'Volume de faturamento auditado ILIMITADO',
      'Todos os recursos do Corporate Gold',
      'Backup de Auditoria Criptografado AES-256-GCM exportável',
      'Redundância Multi-Gateway (Mercado Pago + Stripe + Pix Direct)',
      'Disparo de comunicados massivos multilíngues (250+ idiomas)',
      'API de altíssima velocidade com SLA de 99,999%',
      'Ambiente dedicado e isolamento lógico de alta performance',
      'Consultoria mensal continuada de Compliance Bacen/SEFAZ'
    ],
    sefazNfeIncluded: true,
    bacenPldIncluded: true,
    dedicatedAccountManager: true,
    supportLevel: 'VIP PRIORITÁRIO 24/7'
  }
];

export const defaultTenantProfile: TenantSubscriberProfile = {
  id: 'TENANT-SUB-9941',
  subscriptionTier: 'ENTERPRISE_PRO',
  status: 'ACTIVE',
  createdAt: '2026-01-15T10:00:00.000Z',
  lastUpdated: new Date().toISOString(),
  company: {
    razaoSocial: 'ALPHA ENGENHARIA E CONSTRUCOES LTDA',
    nomeFantasia: 'Alpha Tech Engenharia Global',
    cnpj: '41.892.404/0001-28',
    inscricaoEstadual: '084.921.432-SP',
    inscricaoMunicipal: '439.102-1',
    regimeTributario: 'SIMPLES_NACIONAL',
    cnaePrincipal: '62.01-5-01 - Desenvolvimento de programas de computador sob encomenda',
    aliquotaImpostoPercentual: 6.00,
    emailFiscal: 'fiscal@alphatechglobal.com.br',
    telefone: '+55 11 98844-2211',
    endereco: {
      logradouro: 'Avenida Paulista',
      numero: '1000',
      complemento: 'Andar 14, Conjunto 142',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
      cep: '01310-100'
    }
  },
  fiscalSettings: {
    ambienteSefaz: 'PRODUCAO',
    serieNfe: '1',
    proximoNumeroLote: 1420,
    certificadoDigital: {
      status: 'CONFIGURADO',
      tipo: 'A1_PKCS12',
      nomeArquivo: 'certificado_alpha_engenharia_2026.pfx',
      validade: '2027-04-18',
      fingerprint: 'SHA256:7B:8A:99:E1:44:22:90:3A:FF:11:00:99'
    },
    aliquotas: {
      iss: 3.50,
      pis: 0.65,
      cofins: 3.00,
      irpj: 1.20,
      csll: 1.00
    },
    autoSendClientEmail: true,
    xmlBackupEnabled: true
  },
  operationalSettings: {
    checkoutTitle: 'Alpha Tech - Checkout Corporativo Seguro',
    paymentMethods: {
      pix: true,
      creditCard: true,
      boleto: true,
      internationalCrossBorder: true
    },
    pixExpirationMinutes: 15,
    creditCardMaxInstallments: 12,
    boletoDueDays: 3,
    dailyTransactionLimitBRL: 150000.00,
    antiFraudSensitivity: 'ALTO',
    webhookUrl: 'https://api.alphatechglobal.com.br/v1/webhooks/payments',
    webhookSecret: 'whsec_alpha_live_99214488a7b1',
    apiPublicKey: 'pk_live_tenant_alpha_9941_a721b',
    apiSecretKey: 'sk_live_tenant_alpha_9941_secure_prod'
  },
  masterGovernance: {
    governanceAuthority: 'MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA (CNPJ 68.603.032/0001-15)',
    masterOperator: 'Jose Silva',
    custodyBank: 'Banco Mercado Pago S.A. (Código 323)',
    forensicAuditEnforced: true,
    nonInterferenceGuaranteed: true
  }
};

let currentTenantProfile: TenantSubscriberProfile = { ...defaultTenantProfile };

export const TenantService = {
  getProfile(): TenantSubscriberProfile {
    return { ...currentTenantProfile };
  },

  updateProfile(updates: Partial<TenantSubscriberProfile>): TenantSubscriberProfile {
    currentTenantProfile = {
      ...currentTenantProfile,
      ...updates,
      company: {
        ...currentTenantProfile.company,
        ...(updates.company || {})
      },
      fiscalSettings: {
        ...currentTenantProfile.fiscalSettings,
        ...(updates.fiscalSettings || {})
      },
      operationalSettings: {
        ...currentTenantProfile.operationalSettings,
        ...(updates.operationalSettings || {})
      },
      // Garante que o comando máximo do detentor nunca seja sobrescrito pelo assinante
      masterGovernance: { ...defaultTenantProfile.masterGovernance },
      lastUpdated: new Date().toISOString()
    };
    
    // Save to Firestore & LocalStorage
    FirestorePersistenceService.saveTenantProfile(currentTenantProfile);

    return { ...currentTenantProfile };
  },

  generateTestInvoice(amountBRL: number = 2500.00) {
    const timestamp = new Date();
    const cleanCnpj = currentTenantProfile.company.cnpj.replace(/\D/g, '');
    const serie = currentTenantProfile.fiscalSettings.serieNfe.padStart(3, '0');
    const lote = String(currentTenantProfile.fiscalSettings.proximoNumeroLote).padStart(9, '0');
    const ufCode = currentTenantProfile.company.endereco.uf === 'SP' ? '35' : '29';
    const yearMonth = timestamp.toISOString().slice(2, 7).replace('-', '');
    
    // Gerar Chave de Acesso de 44 dígitos padrão SEFAZ
    const random8 = Math.floor(10000000 + Math.random() * 90000000);
    const rawKey = `${ufCode}${yearMonth}${cleanCnpj.padStart(14, '0')}55${serie}${lote}1${random8}`;
    const checkDigit = (rawKey.split('').reduce((acc, curr) => acc + parseInt(curr), 0) % 9) + 1;
    const accessKey = `${rawKey}${checkDigit}`;

    currentTenantProfile.fiscalSettings.proximoNumeroLote += 1;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${accessKey}" versao="4.00">
    <ide>
      <cUF>${ufCode}</cUF>
      <cNF>${random8}</cNF>
      <natOp>PRESTACAO DE SERVICOS SOB DEMANDA</natOp>
      <mod>55</mod>
      <serie>${currentTenantProfile.fiscalSettings.serieNfe}</serie>
      <nNF>${lote}</nNF>
      <dhEmi>${timestamp.toISOString()}</dhEmi>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <tpAmb>${currentTenantProfile.fiscalSettings.ambienteSefaz === 'PRODUCAO' ? '1' : '2'}</tpAmb>
    </ide>
    <emit>
      <CNPJ>${cleanCnpj}</CNPJ>
      <xNome>${currentTenantProfile.company.razaoSocial}</xNome>
      <xFant>${currentTenantProfile.company.nomeFantasia}</xFant>
      <enderEmit>
        <xLgr>${currentTenantProfile.company.endereco.logradouro}</xLgr>
        <nro>${currentTenantProfile.company.endereco.numero}</nro>
        <xBairro>${currentTenantProfile.company.endereco.bairro}</xBairro>
        <cMun>3550308</cMun>
        <xMun>${currentTenantProfile.company.endereco.cidade}</xMun>
        <UF>${currentTenantProfile.company.endereco.uf}</UF>
        <CEP>${currentTenantProfile.company.endereco.cep.replace(/\D/g, '')}</CEP>
      </enderEmit>
      <IE>${currentTenantProfile.company.inscricaoEstadual}</IE>
      <IM>${currentTenantProfile.company.inscricaoMunicipal}</IM>
      <CRT>${currentTenantProfile.company.regimeTributario === 'SIMPLES_NACIONAL' ? '1' : '3'}</CRT>
    </emit>
    <total>
      <ICMSTot>
        <vProd>${amountBRL.toFixed(2)}</vProd>
        <vNF>${amountBRL.toFixed(2)}</vNF>
        <vTotTrib>${(amountBRL * (currentTenantProfile.company.aliquotaImpostoPercentual / 100)).toFixed(2)}</vTotTrib>
      </ICMSTot>
    </total>
  </infNFe>
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <SignedInfo>
      <Reference URI="#NFe${accessKey}">
        <DigestValue>SHA256_SEALED_${Date.now()}</DigestValue>
      </Reference>
    </SignedInfo>
  </Signature>
</NFe>`;

    return {
      success: true,
      accessKey,
      nfeNumber: lote,
      serie: currentTenantProfile.fiscalSettings.serieNfe,
      issuerCompany: currentTenantProfile.company.razaoSocial,
      issuerCnpj: currentTenantProfile.company.cnpj,
      status: 'AUTORIZADA_USO_SEFAZ',
      sefazProtocol: `13526${Date.now().toString().slice(-8)}`,
      amountBRL,
      taxCollectedBRL: amountBRL * (currentTenantProfile.company.aliquotaImpostoPercentual / 100),
      xml,
      timestamp: timestamp.toISOString()
    };
  }
};
