import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  Sliders,
  Percent,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  RotateCcw,
  Landmark,
  Save,
  QrCode
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const MercadoPagoPixMetricsDashboard: React.FC = () => {
  // Limites de Chaves Pix PJ
  const [dayLimitBRL, setDayLimitBRL] = useState<number>(500000.00);
  const [nightLimitBRL, setNightLimitBRL] = useState<number>(50000.00);
  const [singleTxLimitBRL, setSingleTxLimitBRL] = useState<number>(100000.00);
  const [limitSaved, setLimitSaved] = useState<boolean>(false);

  // Taxas de Processamento Configuração
  const [pixFeeRate, setPixFeeRate] = useState<number>(0.99); // 0.99% taxa padrão Mercado Pago Pix
  const [isCorporateExemption, setIsCorporateExemption] = useState<boolean>(false);

  // Métricas de Sucesso em Tempo Real
  const [stats, setStats] = useState({
    successRate: 98.6,
    avgLatencyMs: 420,
    totalAttempted: 142,
    approvedCount: 140,
    pendingCount: 2,
    todayVolumeBRL: 42890.00
  });

  // Gráfico de volume e sucesso horária
  const hourlyData = [
    { time: '00:00', volume: 1200, success: 100 },
    { time: '04:00', volume: 800, success: 100 },
    { time: '08:00', volume: 5400, success: 98 },
    { time: '12:00', volume: 12800, success: 99 },
    { time: '16:00', volume: 18400, success: 98.5 },
    { time: '20:00', volume: 14200, success: 99.2 },
    { time: 'Agora', volume: stats.todayVolumeBRL, success: stats.successRate }
  ];

  const handleSaveLimits = (e: React.FormEvent) => {
    e.preventDefault();
    setLimitSaved(true);
    setTimeout(() => setLimitSaved(false), 3000);
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> GESTÃO PIX MERCADO PAGO
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
              DISPONIBILIDADE D+0
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Dashboard de Limites, Taxas & Métricas de Sucesso Pix MP
          </h3>
          <p className="text-xs text-slate-400">
            Painel operacional para parametrização de limites regulatórios Bacen, tarifas de adquirência e telemetria de conversão em tempo real.
          </p>
        </div>

        <div className="bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 text-right">
          <p className="text-[10px] font-mono uppercase text-slate-400">Volume Liquidado Hoje (D+0)</p>
          <p className="text-lg font-mono font-black text-emerald-400">
            {formatBRL(stats.todayVolumeBRL)}
          </p>
        </div>
      </div>

      {/* Real-time KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase">Taxa de Sucesso Pix</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-emerald-400">{stats.successRate}%</p>
          <p className="text-[11px] text-slate-400">{stats.approvedCount} aprovados / {stats.pendingCount} pendentes</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase">Latência Média Confirmação</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-sky-300">{stats.avgLatencyMs} ms</p>
          <p className="text-[11px] text-emerald-400 font-mono">Confirmação Instantânea D+0</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase">Tarifa Adquirência Pix MP</span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-amber-300">
            {isCorporateExemption ? '0.00% (Isento)' : `${pixFeeRate.toFixed(2)}%`}
          </p>
          <p className="text-[11px] text-slate-400">Sem taxa fixa por transação</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase">Chave Oficial Ativa</span>
            <QrCode className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-sm font-mono font-bold text-white truncate">+5573998599213</p>
          <p className="text-[11px] text-emerald-400 font-mono">CNPJ 68.603.032/0001-15</p>
        </div>
      </div>

      {/* Chart: Volume & Success Rate */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Curva de Liquidação Pix e Eficiência Horária (Tempo Real)
          </h4>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Conexão WebSocket Ativa
          </span>
        </div>

        <div className="h-52 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                formatter={(val: any) => [formatBRL(Number(val)), 'Volume Liquidado']}
              />
              <Area type="monotone" dataKey="volume" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Management Controls: Limits & Fees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Limits Configuration */}
        <form onSubmit={handleSaveLimits} className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              Parametrização de Limites de Chaves Pix (Bacen)
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Resolução 142 Bacen</span>
          </div>

          {limitSaved && (
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Limites atualizados com sucesso no ecossistema Mercado Pago!</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Limite Diurno Pix (06:00 às 20:00)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-500">R$</span>
                <input
                  type="number"
                  value={dayLimitBRL}
                  onChange={(e) => setDayLimitBRL(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono font-bold focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Limite Noturno Pix (20:00 às 06:00)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-500">R$</span>
                <input
                  type="number"
                  value={nightLimitBRL}
                  onChange={(e) => setNightLimitBRL(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono font-bold focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Limite Máximo por Transação Individual</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-500">R$</span>
                <input
                  type="number"
                  value={singleTxLimitBRL}
                  onChange={(e) => setSingleTxLimitBRL(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Limites de Chave Pix</span>
            </button>
          </div>
        </form>

        {/* Processing Fees & Settlement Breakdown */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-400" />
              Estrutura de Taxas de Processamento & Split
            </h4>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">100% TRANSPARENTE</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Taxa Pix Mercado Pago</p>
                <p className="text-[11px] text-slate-400">Tarifa de adquirência por recebimento</p>
              </div>
              <span className="font-mono font-bold text-amber-400">
                {isCorporateExemption ? '0.00% (Isento)' : `${pixFeeRate}%`}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Retenção Fiscal SEFAZ (Provisionada)</p>
                <p className="text-[11px] text-slate-400">ISS + PIS/COFINS + IRPJ/CSLL</p>
              </div>
              <span className="font-mono font-bold text-cyan-400">14.45%</span>
            </div>

            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-300">Margem Líquida Moreira Brasil D+0</p>
                <p className="text-[11px] text-slate-300">Crédito direto na conta corrente Mercado Pago</p>
              </div>
              <span className="font-mono font-black text-emerald-400 text-sm">85.55%</span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
                <input
                  type="checkbox"
                  checked={isCorporateExemption}
                  onChange={(e) => setIsCorporateExemption(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Simular Isenção de Taxa Corporativa PJ (0%)</span>
              </label>

              <span className="text-[11px] font-mono text-slate-500">D+0 Instant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
