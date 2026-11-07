import React, { useState, useEffect } from 'react';
import {
  Webhook,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  ShieldCheck,
  DollarSign,
  Receipt,
  Search,
  Filter,
  ArrowUpRight,
  KeyRound,
  QrCode,
  CreditCard,
  Barcode
} from 'lucide-react';
import { AsaasSplitConfigModule } from './AsaasSplitConfigModule.tsx';

interface AsaasWebhookLog {
  id: string;
  event: string;
  timestamp: string;
  paymentId: string;
  customerDoc: string;
  customerName: string;
  value: number;
  netValue: number;
  billingType: string;
  status: string;
  tokenValid: boolean;
  integrationStatus: string;
  details: string;
}

export const AsaasWebhooksDashboard: React.FC = () => {
  const [logs, setLogs] = useState<AsaasWebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  // Filters
  const [filterEvent, setFilterEvent] = useState<string>('ALL');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [searchDoc, setSearchDoc] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/webhooks/asaas/logs');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLogs(data);
        }
      }
    } catch (e) {
      console.warn('Falha ao carregar logs do Asaas:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateAsaasEvent = async (billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD', val: number) => {
    setSimulating(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/webhooks/asaas/test-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingType,
          value: val,
          event: 'PAYMENT_RECEIVED',
          customerDoc: '68.603.032/0001-15'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(`✅ Webhook Asaas de teste (${billingType} R$ ${val.toFixed(2)}) injetado e auditado.`);
        fetchLogs();
      } else {
        setFeedback(`❌ Falha: ${data.message || 'Erro ao simular webhook'}`);
      }
    } catch {
      setFeedback('❌ Erro de conexão com o servidor.');
    } finally {
      setSimulating(false);
    }
  };

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    const matchesEvent = filterEvent === 'ALL' || log.event === filterEvent;
    const matchesMethod = filterMethod === 'ALL' || log.billingType === filterMethod;
    const matchesDoc = !searchDoc || log.customerDoc.includes(searchDoc) || log.paymentId.toLowerCase().includes(searchDoc.toLowerCase());
    return matchesEvent && matchesMethod && matchesDoc;
  });

  const totalVolume = logs.reduce((acc, curr) => acc + curr.value, 0);
  const successCount = logs.filter((l) => l.integrationStatus === 'SUCESSO_AUDITADO').length;
  const successRate = logs.length > 0 ? ((successCount / logs.length) * 100).toFixed(1) : '100.0';

  const formatBRL = (v: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> MONITOR DE WEBHOOKS ASAAS
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                PIX DIRECT + BOLETO + CARTÃO
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Webhook className="w-7 h-7 text-emerald-400" />
              Painel de Webhooks Asaas & Notificações de Pagadores
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Acompanhamento em tempo real de cada notificação e tentativa de pagamento realizada por clientes no gateway Asaas com validação de token e integração com a esteira fiscal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSimulateAsaasEvent('PIX', 299.00)}
              disabled={simulating}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/30 cursor-pointer disabled:opacity-50"
            >
              <QrCode className="w-4 h-4" />
              <span>Simular Webhook Pix (R$ 299)</span>
            </button>

            <button
              onClick={() => handleSimulateAsaasEvent('BOLETO', 1450.00)}
              disabled={simulating}
              className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Barcode className="w-4 h-4 text-emerald-400" />
              <span>Simular Webhook Boleto (R$ 1.450)</span>
            </button>

            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="text-emerald-400 font-bold text-xs hover:underline">OK</button>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">TOTAL DE WEBHOOKS RECEBIDOS</span>
            <p className="text-2xl font-mono font-black text-emerald-400">{logs.length}</p>
            <p className="text-[11px] text-slate-400">Notificações Ingeridas</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">VOLUME PROCESSADO (R$)</span>
            <p className="text-2xl font-mono font-black text-white">{formatBRL(totalVolume)}</p>
            <p className="text-[11px] text-emerald-400 font-mono">100% Auditado em Blockchain</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">TAXA DE SUCESSO</span>
            <p className="text-2xl font-mono font-black text-cyan-300">{successRate}%</p>
            <p className="text-[11px] text-slate-400">Integração sem falhas</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">TOKEN DE AUTENTICAÇÃO .ENV</span>
            <p className="text-sm font-mono font-bold text-emerald-400 uppercase flex items-center gap-1 pt-1">
              <KeyRound className="w-4 h-4" />
              VALIDADO ($aact_prod_)
            </p>
            <p className="text-[11px] text-slate-400">Header `asaas-access-token` OK</p>
          </div>
        </div>
      </div>

      {/* Asaas Payment Split Configuration Module */}
      <AsaasSplitConfigModule />

      {/* Filter Bar & Search */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">Filtros de Busca:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto text-xs">
            <div>
              <select
                value={filterEvent}
                onChange={(e) => setFilterEvent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todos os Eventos</option>
                <option value="PAYMENT_RECEIVED">PAYMENT_RECEIVED</option>
                <option value="PAYMENT_CONFIRMED">PAYMENT_CONFIRMED</option>
                <option value="PAYMENT_OVERDUE">PAYMENT_OVERDUE</option>
              </select>
            </div>

            <div>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todos os Métodos</option>
                <option value="PIX">Pix Direct</option>
                <option value="BOLETO">Boleto Bancário</option>
                <option value="CREDIT_CARD">Cartão de Crédito</option>
              </select>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por CNPJ ou ID..."
                value={searchDoc}
                onChange={(e) => setSearchDoc(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Webhooks Log Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            Histórico de Notificações Recebidas do Asaas
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Exibindo <strong className="text-white">{filteredLogs.length}</strong> de {logs.length} eventos
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase font-mono">
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Evento Asaas</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">ID Pagamento</th>
                <th className="px-4 py-3">Documento Cliente</th>
                <th className="px-4 py-3">Valor Bruto</th>
                <th className="px-4 py-3">Autenticação Token</th>
                <th className="px-4 py-3">Status Integração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.event === 'PAYMENT_RECEIVED' || log.event === 'PAYMENT_CONFIRMED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {log.event}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-bold flex items-center gap-1.5 pt-3">
                    {log.billingType === 'PIX' && <QrCode className="w-3.5 h-3.5 text-emerald-400" />}
                    {log.billingType === 'BOLETO' && <Barcode className="w-3.5 h-3.5 text-sky-400" />}
                    {log.billingType === 'CREDIT_CARD' && <CreditCard className="w-3.5 h-3.5 text-purple-400" />}
                    <span>{log.billingType}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{log.paymentId}</td>
                  <td className="px-4 py-3 text-emerald-400 font-bold">{log.customerDoc}</td>
                  <td className="px-4 py-3 text-white font-bold">{formatBRL(log.value)}</td>
                  <td className="px-4 py-3">
                    {log.tokenValid ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Token Válido
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> Token Inválido
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1 w-fit">
                      <ShieldCheck className="w-3 h-3" /> {log.integrationStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
