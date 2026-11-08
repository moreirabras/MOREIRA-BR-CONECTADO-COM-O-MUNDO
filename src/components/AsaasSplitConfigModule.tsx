import React, { useState, useEffect } from 'react';
import {
  Coins,
  Building2,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Zap,
  ArrowRight,
  Landmark,
  KeyRound,
  Percent,
  Check,
  CreditCard
} from 'lucide-react';

interface BankInfo {
  bankName: string;
  bankCode: string;
  agency: string;
  account: string;
  accountType: string;
  pixKey: string;
}

interface SplitConfig {
  walletId: string;
  recipientName: string;
  cnpj: string;
  splitType: 'PERCENTAGE' | 'FIXED';
  fixedValue: number;
  percentualValue: number;
  bankInfo: BankInfo;
  autoTransfer: boolean;
  status: string;
  lastUpdated?: string;
}

export const AsaasSplitConfigModule: React.FC = () => {
  const [config, setConfig] = useState<SplitConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form Fields
  const [walletId, setWalletId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [splitType, setSplitType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [percentualValue, setPercentualValue] = useState(100.0);
  const [fixedValue, setFixedValue] = useState(0);
  const [bankName, setBankName] = useState('');
  const [agency, setAgency] = useState('');
  const [account, setAccount] = useState('');
  const [pixKey, setPixKey] = useState('');

  const fetchSplitConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/asaas/split-config');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data: SplitConfig = await res.json();
        setConfig(data);
        setWalletId(data.walletId);
        setRecipientName(data.recipientName);
        setCnpj(data.cnpj);
        setSplitType(data.splitType);
        setPercentualValue(data.percentualValue);
        setFixedValue(data.fixedValue);
        setBankName(data.bankInfo?.bankName || '');
        setAgency(data.bankInfo?.agency || '');
        setAccount(data.bankInfo?.account || '');
        setPixKey(data.bankInfo?.pixKey || '');
      }
    } catch (e) {
      console.warn('Erro ao carregar configuração de split:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSplitConfig();
  }, []);

  const handleSaveSplitConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/asaas/split-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId,
          recipientName,
          cnpj,
          splitType,
          percentualValue,
          fixedValue,
          bankInfo: {
            bankName,
            agency,
            account,
            pixKey
          }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback('✅ Configuração de Split de Pagamentos Asaas salva com sucesso! Conta Moreira Brasil ativa.');
        fetchSplitConfig();
      } else {
        setFeedback(`❌ Falha ao salvar: ${data.message || 'Erro no servidor'}`);
      }
    } catch {
      setFeedback('❌ Erro de conexão com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSplit = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/asaas/split/test-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalValue: 500.00,
          paymentMethod: 'PIX'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(`✅ Teste de Split executado! R$ ${(data.splitPayload.split[0].valueAllocated).toFixed(2)} direcionados para a carteira ${data.splitPayload.split[0].walletId}.`);
      } else {
        setFeedback('❌ Falha no teste de split.');
      }
    } catch {
      setFeedback('❌ Erro na comunicação de teste.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" /> REPOSITÓRIO E SPLIT DE PAGAMENTOS ASAAS
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
              CONTA BANCÁRIA MOREIRA BRASIL
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
            <Landmark className="w-5 h-5 text-emerald-400" />
            Configuração da Conta de Recebimento & Split de Pagamentos
          </h3>
          <p className="text-xs text-slate-400">
            Garante que 100% do faturamento liquidados nas cobranças dos clientes pagantes seja automaticamente repassado para a conta da Moreira Brasil.
          </p>
        </div>

        <button
          onClick={handleTestSplit}
          disabled={testing}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Zap className="w-4 h-4" />
          <span>{testing ? 'Calculando Split...' : 'Testar Split Asaas (R$ 500)'}</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between ${
          feedback.startsWith('✅')
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
        }`}>
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-400 font-bold text-xs hover:underline">OK</button>
        </div>
      )}

      {/* Summary Metrics */}
      {config && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">CARTEIRA / WALLET ID ASAAS</span>
            <p className="text-xs font-mono font-bold text-emerald-400 truncate pt-1">{config.walletId}</p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Status: {config.status}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">REPASSE DIRETO</span>
            <p className="text-2xl font-mono font-black text-sky-400">{config.percentualValue}%</p>
            <p className="text-[11px] text-slate-400 font-mono">Do Faturamento Liquidadas</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">TITULAR DA CONTA</span>
            <p className="text-xs font-mono font-bold text-white truncate pt-1">{config.recipientName}</p>
            <p className="text-[11px] text-emerald-400 font-mono">CNPJ: {config.cnpj}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">CHAVE PIX CADASTRA</span>
            <p className="text-xs font-mono font-bold text-amber-400 truncate pt-1">{config.bankInfo?.pixKey}</p>
            <p className="text-[11px] text-slate-400 font-mono">{config.bankInfo?.bankName}</p>
          </div>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSaveSplitConfig} className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Building2 className="w-4 h-4 text-emerald-400" />
          Dados da Conta Beneficiária do Split no Asaas
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="block text-slate-400 mb-1">Wallet ID Asaas (Chave da Conta)</label>
            <input
              type="text"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
              placeholder="wallet_..."
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Razão Social Recebedora</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">CNPJ da Empresa Recebedora</label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Tipo de Split</label>
            <select
              value={splitType}
              onChange={(e) => setSplitType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="PERCENTAGE">PERCENTUAL (% do Faturamento Total)</option>
              <option value="FIXED">VALOR FIXO (R$ por Cobrança)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Porcentagem de Repasse (%)</label>
            <input
              type="number"
              step="0.1"
              value={percentualValue}
              onChange={(e) => setPercentualValue(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-bold text-emerald-400"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Chave Pix para Liquidação</label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Salvando Regra...' : 'Salvar & Ativar Split de Pagamento Asaas'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
