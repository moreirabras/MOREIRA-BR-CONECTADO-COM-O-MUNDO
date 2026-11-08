import React, { useState } from 'react';
import {
  CheckCircle2,
  Building2,
  CreditCard,
  QrCode,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Lock,
  Copy,
  Check,
  RefreshCw,
  Award,
  Clock,
  HelpCircle,
  FileText,
  BadgePercent
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MARKET_SUBSCRIPTION_PLANS, SubscriptionPlan, TenantSubscriberProfile, TenantService } from '../services/TenantService.ts';

interface SubscriberSignupCheckoutModuleProps {
  onSuccessSignup?: (profile: TenantSubscriberProfile) => void;
  onCompleteSignup?: () => void;
  onCancel?: () => void;
}

export const SubscriberSignupCheckoutModule: React.FC<SubscriberSignupCheckoutModuleProps> = ({
  onSuccessSignup,
  onCompleteSignup,
  onCancel
}) => {
  // Step 1: Select Plan, Step 2: Company Data, Step 3: Checkout Payment
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Billing Cycle: Monthly or Annual (with ~17% discount / 2 months free)
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('CORPORATE_GOLD');

  // Step 2: Company Data Form
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [ie, setIe] = useState('');
  const [im, setIm] = useState('');
  const [regime, setRegime] = useState<'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | 'MEI'>('SIMPLES_NACIONAL');
  const [cnae, setCnae] = useState('62.01-5-01 - Desenvolvimento de sistemas sob encomenda');
  const [emailFiscal, setEmailFiscal] = useState('');
  const [telefone, setTelefone] = useState('');
  const [responsavelNome, setResponsavelNome] = useState('');

  // Address
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('SP');
  const [cep, setCep] = useState('');

  // Step 3: Payment Checkout State
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [processing, setProcessing] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  // Credit card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Active Selected Plan Object
  const selectedPlan = MARKET_SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || MARKET_SUBSCRIPTION_PLANS[1];

  // Calculated Price
  const subscriptionPrice = billingCycle === 'MONTHLY' ? selectedPlan.monthlyPriceBRL : selectedPlan.annualPriceBRL;
  const formattedPrice = `R$ ${subscriptionPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  // Generated Pix Data for Step 3
  const [pixPayload, setPixPayload] = useState<{
    qrCodeUrl: string;
    copiaECola: string;
    expirationSeconds: number;
    transactionId: string;
  } | null>(null);

  const handleGoToStep2 = () => {
    setStep(2);
  };

  const handleGoToCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    if (!razaoSocial || !cnpj || !emailFiscal) {
      alert('Por favor, preencha pelo menos a Razão Social, CNPJ e E-mail Fiscal da sua empresa.');
      return;
    }

    // Generate Pix payload for step 3
    const cleanCnpj = cnpj.replace(/\D/g, '') || '00000000000000';
    const txId = `SUB-MP-${Date.now().toString().slice(-8)}`;
    const pixCopy = `00020126580014br.gov.bcb.pix0136+5573998599213520400005303986540${subscriptionPrice.toFixed(2).padStart(10, '0')}5802BR5925MOREIRA BRASIL FINTECH6008SALVADOR62070503***6304${Math.floor(1000 + Math.random() * 9000)}`;

    setPixPayload({
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(pixCopy)}`,
      copiaECola: pixCopy,
      expirationSeconds: 900,
      transactionId: txId
    });

    setStep(3);
  };

  const handleConfirmPayment = () => {
    setProcessing(true);

    setTimeout(() => {
      // Create new tenant profile
      const newTenantId = `TENANT-SUB-${Math.floor(1000 + Math.random() * 9000)}`;
      const newProfile: TenantSubscriberProfile = {
        id: newTenantId,
        subscriptionTier: selectedPlan.id === 'STARTER_ENTERPRISE' ? 'ENTERPRISE_PRO' : selectedPlan.id === 'CORPORATE_GOLD' ? 'CORPORATE_GOLD' : 'FINTECH_SCALE',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        company: {
          razaoSocial: razaoSocial || 'MINHA EMPRESA ASSINANTE LTDA',
          nomeFantasia: nomeFantasia || razaoSocial || 'Minha Empresa',
          cnpj: cnpj || '00.000.000/0001-00',
          inscricaoEstadual: ie || 'ISENTO',
          inscricaoMunicipal: im || 'ISENTO',
          regimeTributario: regime,
          cnaePrincipal: cnae,
          aliquotaImpostoPercentual: regime === 'SIMPLES_NACIONAL' ? 6.00 : 14.45,
          emailFiscal: emailFiscal || 'fiscal@empresa.com.br',
          telefone: telefone || '+55 11 99999-0000',
          endereco: {
            logradouro: logradouro || 'Avenida Principal',
            numero: numero || '100',
            complemento: complemento || '',
            bairro: bairro || 'Centro',
            cidade: cidade || 'São Paulo',
            uf: uf || 'SP',
            cep: cep || '01000-000'
          }
        },
        fiscalSettings: {
          ambienteSefaz: 'PRODUCAO',
          serieNfe: '1',
          proximoNumeroLote: 1001,
          certificadoDigital: {
            status: 'CONFIGURADO',
            tipo: 'A1_PKCS12',
            nomeArquivo: `certificado_${(nomeFantasia || 'empresa').toLowerCase().replace(/\s+/g, '_')}_2026.pfx`,
            validade: '2027-12-31',
            fingerprint: `SHA256:${Math.floor(10 + Math.random() * 89)}:FF:99:A1:33`
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
          checkoutTitle: `${nomeFantasia || razaoSocial} - Checkout Corporativo`,
          paymentMethods: {
            pix: true,
            creditCard: true,
            boleto: true,
            internationalCrossBorder: selectedPlan.id !== 'STARTER_ENTERPRISE'
          },
          pixExpirationMinutes: 15,
          creditCardMaxInstallments: 12,
          boletoDueDays: 3,
          dailyTransactionLimitBRL: typeof selectedPlan.maxMonthlyVolumeBRL === 'number' ? selectedPlan.maxMonthlyVolumeBRL : 1000000,
          antiFraudSensitivity: 'ALTO',
          webhookUrl: `https://api.${(nomeFantasia || 'empresa').toLowerCase().replace(/\s+/g, '')}.com.br/v1/webhook`,
          webhookSecret: `whsec_${Math.random().toString(36).slice(2, 14)}`,
          apiPublicKey: `pk_live_${newTenantId.toLowerCase()}_${Math.random().toString(36).slice(2, 8)}`,
          apiSecretKey: `sk_live_${newTenantId.toLowerCase()}_${Math.random().toString(36).slice(2, 14)}`
        },
        masterGovernance: {
          governanceAuthority: 'MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA (CNPJ 68.603.032/0001-15)',
          masterOperator: 'Jose Silva',
          custodyBank: 'Banco Mercado Pago S.A. (Código 323)',
          forensicAuditEnforced: true,
          nonInterferenceGuaranteed: true
        }
      };

      // Save to TenantService and LocalStorage
      TenantService.updateProfile(newProfile);
      localStorage.setItem('vortex_subscriber_profile', JSON.stringify(newProfile));

      setProcessing(false);
      setPaymentApproved(true);

      setTimeout(() => {
        if (onSuccessSignup) {
          onSuccessSignup(newProfile);
        }
        if (onCompleteSignup) {
          onCompleteSignup();
        }
      }, 1500);
    }, 1800);
  };

  const handleCopyPix = () => {
    if (pixPayload?.copiaECola) {
      navigator.clipboard.writeText(pixPayload.copiaECola);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-2 sm:p-4">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-sky-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold uppercase shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>🎁 15 Dias de Degustação Grátis para Testar o Sistema</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Assine a Plataforma Enterprise FinTech & Auditoria Forense
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Inscreva sua empresa em segundos e aproveite <strong className="text-amber-300 font-extrabold">15 dias de teste 100% gratuito</strong> com acesso total a todas as funcionalidades de gestão, emissão de NF-e na SEFAZ e liquidação Mercado Pago.
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
            step === 1 ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}>
            <span className="w-5 h-5 rounded-full bg-slate-950 text-emerald-400 text-[11px] flex items-center justify-center font-bold">1</span>
            <span>1. Escolha o Plano</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-600" />

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
            step === 2 ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}>
            <span className="w-5 h-5 rounded-full bg-slate-950 text-sky-400 text-[11px] flex items-center justify-center font-bold">2</span>
            <span>2. Dados da Empresa</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-600" />

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
            step === 3 ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}>
            <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 text-[11px] flex items-center justify-center font-bold">3</span>
            <span>3. Checkout Mercado Pago</span>
          </div>
        </div>
      </div>

      {/* STEP 1: PLAN SELECTION & PRICING TABLE */}
      {step === 1 && (
        <div className="space-y-8">
          {/* Cycle Switcher */}
          <div className="flex justify-center">
            <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1 font-mono text-xs">
              <button
                type="button"
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  billingCycle === 'MONTHLY'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cobrança Mensal
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle('ANNUAL')}
                className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === 'ANNUAL'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <span>Cobrança Anual</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950 text-emerald-400 font-extrabold border border-emerald-500/40">
                  2 MESES GRÁTIS
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MARKET_SUBSCRIPTION_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const price = billingCycle === 'MONTHLY' ? plan.monthlyPriceBRL : plan.annualPriceBRL;
              const formattedPlanPrice = `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between relative cursor-pointer ${
                    isSelected
                      ? plan.recommended
                        ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/50 shadow-2xl scale-[1.02]'
                        : 'bg-slate-900 border-sky-400 ring-2 ring-sky-500/50 shadow-xl'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                      <Award className="w-3.5 h-3.5" /> RECOMENDADO DA INDÚSTRIA
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                        <input
                          type="radio"
                          name="plan"
                          checked={isSelected}
                          onChange={() => setSelectedPlanId(plan.id)}
                          className="w-4 h-4 accent-emerald-500 cursor-pointer"
                        />
                      </div>
                      <p className="text-xs text-slate-400 leading-normal">{plan.tagline}</p>
                    </div>

                    <div className="border-y border-slate-800/80 py-4 font-mono space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-white">{formattedPlanPrice}</span>
                          <span className="text-xs text-slate-400">/{billingCycle === 'MONTHLY' ? 'mês' : 'ano'}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                          15 DIAS GRÁTIS
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-400 font-semibold">
                        Limite mensal: {typeof plan.maxMonthlyVolumeBRL === 'number' ? `Até R$ ${plan.maxMonthlyVolumeBRL.toLocaleString('pt-BR')}` : 'Faturamento Ilimitado'}
                      </p>
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 font-sans flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span><strong>15 dias de degustação:</strong> Teste todas as funções sem cobrança antecipada.</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider block">Recursos Incluídos:</span>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        handleGoToStep2();
                      }}
                      className={`w-full py-3 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      <span>Selecionar {plan.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="text-white font-bold">Sem Contrato de Fidelidade Forçada · Cancelamento Grátis a Qualquer Momento</p>
                <p className="text-slate-400 text-[11px]">Cobrança processada em ambiente seguro com emissão de NF-e e rastro forense.</p>
              </div>
            </div>
            <button
              onClick={handleGoToStep2}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            >
              <span>Avançar para Cadastro da Empresa</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: COMPANY DATA FORM */}
      {step === 2 && (
        <form onSubmit={handleGoToCheckout} className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase">
                PLANO SELECIONADO: {selectedPlan.name} ({formattedPrice})
              </span>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mt-1">
                <Building2 className="w-5 h-5 text-sky-400" />
                Dados Constitucionais da Sua Empresa (NF-e Própria)
              </h2>
              <p className="text-xs text-slate-400">
                Após preencher os dados cadastrais, você será redirecionado imediatamente para o checkout seguro de assinatura.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-mono text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              ← Alterar Plano Selecionado
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            <div className="space-y-1">
              <label className="text-slate-400">Razão Social Oficial *</label>
              <input
                type="text"
                required
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                placeholder="Ex: MINHA EMPRESA ENGENHARIA LTDA"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Nome Fantasia Comercial</label>
              <input
                type="text"
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                placeholder="Ex: Minha Empresa Tech"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">CNPJ (Somente números ou formatado) *</label>
              <input
                type="text"
                required
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sky-300 font-bold focus:border-sky-500 focus:outline-none"
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Inscrição Estadual (IE)</label>
              <input
                type="text"
                value={ie}
                onChange={(e) => setIe(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                placeholder="Ex: 084.921.432-SP ou ISENTO"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Inscrição Municipal (IM)</label>
              <input
                type="text"
                value={im}
                onChange={(e) => setIm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                placeholder="Ex: 439.102-1"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Regime Tributário</label>
              <select
                value={regime}
                onChange={(e: any) => setRegime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="SIMPLES_NACIONAL">Simples Nacional (CRT 1)</option>
                <option value="LUCRO_PRESUMIDO">Lucro Presumido (CRT 3)</option>
                <option value="LUCRO_REAL">Lucro Real (CRT 3)</option>
                <option value="MEI">MEI - Microempreendedor</option>
              </select>
            </div>

            <div className="space-y-1 lg:col-span-2">
              <label className="text-slate-400">CNAE Principal</label>
              <input
                type="text"
                value={cnae}
                onChange={(e) => setCnae(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                placeholder="Ex: 62.01-5-01 - Desenvolvimento de programas sob encomenda"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Nome do Responsável Legal</label>
              <input
                type="text"
                value={responsavelNome}
                onChange={(e) => setResponsavelNome(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                placeholder="Nome do administrador"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">E-mail Fiscal (Recebimento de NFe) *</label>
              <input
                type="email"
                required
                value={emailFiscal}
                onChange={(e) => setEmailFiscal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                placeholder="fiscal@suaempresa.com.br"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Telefone Corporativo com DDD</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                placeholder="+55 11 99999-0000"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-mono">
              <Building2 className="w-4 h-4 text-sky-400" /> Endereço Sede da Empresa
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-slate-400">Logradouro / Rua</label>
                <input
                  type="text"
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  placeholder="Avenida Paulista"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Número</label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  placeholder="1000"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Complemento</label>
                <input
                  type="text"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  placeholder="Sala 142"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Bairro</label>
                <input
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  placeholder="Bela Vista"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Cidade</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  placeholder="São Paulo"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">UF</label>
                <input
                  type="text"
                  maxLength={2}
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white uppercase"
                  placeholder="SP"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">CEP</label>
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  placeholder="01310-100"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
            >
              Voltar
            </button>

            <button
              type="submit"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <span>Ir para Checkout & Pagar Assinatura</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: CHECKOUT PAYMENT (MERCADO PAGO) */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary Column */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">RESUMO DA INSCRIÇÃO</span>
              <h3 className="text-base font-bold text-white">{selectedPlan.name}</h3>
              <p className="text-xs text-slate-400">{selectedPlan.tagline}</p>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300 border-b border-slate-800/60 pb-1">
                <span>Empresa Contratante:</span>
                <span className="text-white font-bold truncate max-w-[160px]">{razaoSocial || 'EMPRESA ASSINANTE'}</span>
              </div>
              <div className="flex justify-between text-slate-300 border-b border-slate-800/60 pb-1">
                <span>CNPJ:</span>
                <span className="text-sky-400">{cnpj || '00.000.000/0001-00'}</span>
              </div>
              <div className="flex justify-between text-slate-300 border-b border-slate-800/60 pb-1">
                <span>Ciclo:</span>
                <span className="text-white font-bold">{billingCycle === 'MONTHLY' ? 'Mensal' : 'Anual (2 meses grátis)'}</span>
              </div>
              <div className="flex justify-between text-slate-300 border-b border-slate-800/60 pb-1">
                <span>Subtotal:</span>
                <span className="text-slate-200">{formattedPrice}</span>
              </div>
              <div className="flex justify-between text-slate-300 border-b border-slate-800/60 pb-1">
                <span>Ativação D+0:</span>
                <span className="text-emerald-400 font-bold">GRÁTIS</span>
              </div>
              <div className="flex justify-between text-slate-300 border-b border-slate-800/60 pb-1">
                <span>Degustação Grátis:</span>
                <span className="text-amber-400 font-bold">15 DIAS (Sem Cobrança Antecipada)</span>
              </div>
              <div className="flex justify-between text-slate-100 pt-2 text-sm font-bold border-t border-slate-700">
                <span>Valor Total a Pagar:</span>
                <span className="text-emerald-400">{formattedPrice}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <span className="text-white font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Garantia de Liquidação Mercado Pago
              </span>
              <p>O valor será processado via Banco Mercado Pago S.A. (323) com disponibilização imediata do seu painel e emissão de NF-e.</p>
            </div>
          </div>

          {/* Checkout Payment Interactive Screen */}
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  Checkout Transparente de Pagamento
                </h3>
                <p className="text-xs text-slate-400">
                  Escolha o meio de pagamento para concluir a assinatura e ativar a sua empresa.
                </p>
              </div>

              {/* Payment Method Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('PIX')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'PIX' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" /> Pix Instantâneo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'CREDIT_CARD' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Cartão de Crédito
                </button>
              </div>
            </div>

            {/* Approved Screen */}
            {paymentApproved ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-8 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-4 font-mono"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 uppercase">
                    PAGAMENTO CONFIRMADO D+0
                  </span>
                  <h3 className="text-xl font-bold text-white pt-2">Assinatura Ativada com Sucesso!</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    Sua empresa <strong className="text-white">{razaoSocial || 'EMPRESA ASSINANTE'}</strong> foi inscrita com sucesso no plano {selectedPlan.name}.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2 text-left max-w-md mx-auto">
                  <div className="flex justify-between">
                    <span>Protocolo de Assinatura:</span>
                    <span className="text-emerald-400 font-bold">{pixPayload?.transactionId || 'SUB-MP-9941'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status da Conta:</span>
                    <span className="text-emerald-400 font-bold">100% ATIVA (D+0)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Banco Processador:</span>
                    <span className="text-white">Mercado Pago S.A. (323)</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 pt-2 animate-pulse">
                  Redirecionando para o seu Painel de Comando do Assinante...
                </p>
              </motion.div>
            ) : (
              <div>
                {/* PAYMENT METHOD: PIX */}
                {paymentMethod === 'PIX' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-center">
                      <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                        <QrCode className="w-4 h-4" /> Escaneie com o app do seu Banco
                      </span>

                      {pixPayload && (
                        <div className="p-3 bg-white rounded-xl shadow-lg border-2 border-emerald-500">
                          <img
                            src={pixPayload.qrCodeUrl}
                            alt="QR Code Pix Mercado Pago"
                            className="w-48 h-48 object-contain mx-auto"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Expira em 15 minutos (Validação D+0)</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2 font-mono">
                        <label className="text-xs text-slate-300 font-bold block">Código Pix Copia e Cola:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={pixPayload?.copiaECola || ''}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-400 font-mono truncate"
                          />
                          <button
                            type="button"
                            onClick={handleCopyPix}
                            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                        <span className="text-white font-bold block">Como Funciona a Ativação D+0:</span>
                        <ol className="list-decimal list-inside space-y-1 text-[11px]">
                          <li>Abra o aplicativo do seu banco e escolha a opção Pix.</li>
                          <li>Escaneie o QR Code ou cole o código acima.</li>
                          <li>Após pagar, clique no botão de confirmação abaixo para simular a liquidação instantânea.</li>
                        </ol>
                      </div>

                      <button
                        type="button"
                        onClick={handleConfirmPayment}
                        disabled={processing}
                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                      >
                        {processing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Confirmando Pagamento com Mercado Pago...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirmar Pagamento Pix ({formattedPrice})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* PAYMENT METHOD: CREDIT CARD */}
                {paymentMethod === 'CREDIT_CARD' && (
                  <form onSubmit={(e) => { e.preventDefault(); handleConfirmPayment(); }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-slate-400">Número do Cartão de Crédito</label>
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                          placeholder="0000 0000 0000 0000"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-400">Nome Impresso no Cartão</label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono uppercase"
                          placeholder="NOME COMO NO CARTAO"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-slate-400">Validade</label>
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-center"
                            placeholder="MM/AA"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400">CVC / CVV</label>
                          <input
                            type="text"
                            required
                            maxLength={4}
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-center"
                            placeholder="123"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={processing}
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                    >
                      {processing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Processando Cartão com Mercado Pago...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Pagar Assinatura no Cartão ({formattedPrice})</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
