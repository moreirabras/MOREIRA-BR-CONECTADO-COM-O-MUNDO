import React, { useState } from 'react';
import {
  TrendingUp,
  Coins,
  ShieldCheck,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Sliders,
  Sparkles,
  ArrowUpRight,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';

export const DailyLiquidityProjectionChart: React.FC = () => {
  // Slots de R$ 50.000,00 executados no ciclo 24h atual (0 a 10)
  const [executedSlots, setExecutedSlots] = useState<number>(6); // Padrão: 6 lotes = R$ 300.000,00

  const PJ_DAILY_CEILING = 500000.00; // R$ 500.000,00
  const SLOT_UNIT_VALUE = 50000.00;   // R$ 50.000,00
  const TOTAL_SLOTS = 10;

  // Montagem da projeção dos 10 passos de R$ 50.000,00
  const projectionData = Array.from({ length: TOTAL_SLOTS + 1 }, (_, index) => {
    const accumulatedTransferred = index * SLOT_UNIT_VALUE;
    const remainingLiquidity = Math.max(0, PJ_DAILY_CEILING - accumulatedTransferred);
    const percentageUsed = ((accumulatedTransferred / PJ_DAILY_CEILING) * 100).toFixed(0);

    return {
      slotIndex: index,
      label: index === 0 ? 'Início (R$ 0)' : `Lote ${index} (R$ ${index * 50}k)`,
      transferredAccumulated: accumulatedTransferred,
      remainingLiquidity: remainingLiquidity,
      ceilingLimit: PJ_DAILY_CEILING,
      percentageUsed: Number(percentageUsed),
      isExecuted: index <= executedSlots
    };
  });

  const currentAccumulated = executedSlots * SLOT_UNIT_VALUE;
  const currentRemaining = Math.max(0, PJ_DAILY_CEILING - currentAccumulated);
  const remainingSlots = TOTAL_SLOTS - executedSlots;
  const percentUsed = ((currentAccumulated / PJ_DAILY_CEILING) * 100).toFixed(1);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleExecuteNextSlot = () => {
    if (executedSlots < TOTAL_SLOTS) {
      setExecutedSlots((prev) => prev + 1);
    }
  };

  const handleResetSlots = () => {
    setExecutedSlots(0);
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> PROJEÇÃO DE LIQUIDEZ BACEN PJ
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
              LOTES DE R$ 50.000,00
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
              TETO R$ 500.000,00 / 24H
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <span>Projeção de Liquidez Diária • Lotes de R$ 50.000,00</span>
          </h2>
          <p className="text-xs text-slate-400">
            Cálculo progressivo do saldo acumulado e capacidade de liquidação restante para <strong className="text-emerald-400">Pessoa Jurídica (PJ)</strong> antes do atingimento do teto de <strong className="text-rose-400">R$ 500.000,00 em 24h</strong>.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExecuteNextSlot}
            disabled={executedSlots >= TOTAL_SLOTS}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-slate-950" />
            <span>Simular Lote R$ 50k (+1)</span>
          </button>

          <button
            type="button"
            onClick={handleResetSlots}
            className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Reiniciar contagem de 24h"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset 24h</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Teto Regulatório */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase">TETO REGULATÓRIO PJ 24H</span>
          <p className="text-2xl font-mono font-black text-rose-400">{formatBRL(PJ_DAILY_CEILING)}</p>
          <p className="text-[11px] text-slate-400 font-mono">10 Lotes de R$ 50.000,00</p>
        </div>

        {/* Saldo Acumulado Executado */}
        <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1">
          <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">SALDO ACUMULADO HOJE</span>
          <p className="text-2xl font-mono font-black text-emerald-400">{formatBRL(currentAccumulated)}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{executedSlots} de {TOTAL_SLOTS} Lotes ({percentUsed}%)</span>
          </div>
        </div>

        {/* Liquidez Restante */}
        <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/30 space-y-1">
          <span className="text-[10px] font-mono text-sky-400 uppercase font-bold">LIQUIDEZ RESTANTE ATÉ TETO</span>
          <p className="text-2xl font-mono font-black text-sky-400">{formatBRL(currentRemaining)}</p>
          <p className="text-[11px] text-slate-400 font-mono">{remainingSlots} Lote(s) de R$ 50k Disponíveis</p>
        </div>

        {/* Status da Margem */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase">MARGEM DE SEGURANÇA BACEN</span>
          <p className={`text-2xl font-mono font-black ${executedSlots >= 10 ? 'text-rose-500' : (executedSlots >= 8 ? 'text-amber-400' : 'text-purple-300')}`}>
            {(100 - Number(percentUsed)).toFixed(1)}%
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            {executedSlots >= 10 ? '⚠️ TETO 500K ATINGIDO' : '✔ Operação Regular sem Bloqueio'}
          </p>
        </div>
      </div>

      {/* Recharts Projection Graph */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              Gráfico de Acúmulo Progressivo de Liquidez (Passos de R$ 50.000,00)
            </h3>
            <p className="text-[11px] text-slate-400">
              Linha verde: Acúmulo transferido • Linha azul: Capacidade restante até o teto de R$ 500.000,00.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Acumulado</span>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 ml-2" />
            <span>Restante</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ml-2" />
            <span>Teto 500k</span>
          </div>
        </div>

        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={projectionData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorRestante" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={10} fontFamily="monospace" />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                fontFamily="monospace"
                tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                domain={[0, 550000]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                formatter={(value: any, name: any) => [
                  formatBRL(Number(value)),
                  name === 'transferredAccumulated' ? 'Saldo Acumulado Executado' : (name === 'remainingLiquidity' ? 'Liquidez Restante' : 'Teto PJ')
                ]}
              />
              <ReferenceLine
                y={PJ_DAILY_CEILING}
                label={{ value: 'TETO MAX PJ R$ 500.000,00', fill: '#f43f5e', fontSize: 10, position: 'top', fontWeight: 'bold' }}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="transferredAccumulated"
                name="Saldo Acumulado"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorAcumulado)"
              />
              <Area
                type="monotone"
                dataKey="remainingLiquidity"
                name="Liquidez Restante"
                stroke="#0284c7"
                strokeWidth={2}
                strokeDasharray="3 3"
                fillOpacity={1}
                fill="url(#colorRestante)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Slots Table Ticker */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between">
          <span>Detalhamento dos 10 Lotes de R$ 50.000,00 (Ciclo Diário 24h)</span>
          <span className="text-[11px] text-emerald-400">MOREIRA BRASIL LTDA</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 font-mono text-xs">
          {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
            const slotNum = i + 1;
            const slotVal = slotNum * SLOT_UNIT_VALUE;
            const isDone = slotNum <= executedSlots;

            return (
              <button
                key={slotNum}
                onClick={() => setExecutedSlots(slotNum)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  isDone
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-950/50'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] uppercase block font-sans">Lote {slotNum}</span>
                <span className="font-bold block text-xs">R$ 50k</span>
                <span className="text-[9px] block text-slate-400">R$ {slotNum * 50}k ac.</span>
                <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded ${isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {isDone ? '✓ EXECUTADO' : 'DISPONÍVEL'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
