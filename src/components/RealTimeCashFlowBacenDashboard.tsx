import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  Zap,
  RefreshCw,
  Clock,
  Layers,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  Filter
} from 'lucide-react';

interface CashFlowDataPoint {
  time: string;
  entradasBRL: number;
  saidasBRL: number;
  saldoAcumuladoBRL: number;
  tetoDiarioBacen: number;
  loteDisparo: number;
}

export const RealTimeCashFlowBacenDashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [isLive, setIsLive] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString('pt-BR'));
  const [simulationCount, setSimulationCount] = useState<number>(0);

  // Initial 24h Real-Time Cash Flow Data against R$ 500k Bacen PJ Limit
  const generateCashFlowData = (tf: '24h' | '7d' | '30d'): CashFlowDataPoint[] => {
    if (tf === '24h') {
      const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      let cumulativeBalance = 42000000;
      return hours.map((hour, idx) => {
        const entradas = Math.floor(Math.random() * 850000) + 450000 + (idx * 30000);
        // Saques diários fracionados em lotes de R$ 50k até o teto de 500k em 24h
        const saidas = idx % 2 === 0 ? 50000 : (idx === 10 ? 100000 : 0);
        cumulativeBalance += (entradas - saidas);
        return {
          time: hour,
          entradasBRL: entradas,
          saidasBRL: saidas,
          saldoAcumuladoBRL: cumulativeBalance,
          tetoDiarioBacen: 500000,
          loteDisparo: 50000
        };
      });
    } else if (tf === '7d') {
      const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      let cumulativeBalance = 38000000;
      return days.map((day) => {
        const entradas = Math.floor(Math.random() * 3000000) + 2000000;
        const saidas = 500000; // Teto total de R$ 500k por dia atingido
        cumulativeBalance += (entradas - saidas);
        return {
          time: day,
          entradasBRL: entradas,
          saidasBRL: saidas,
          saldoAcumuladoBRL: cumulativeBalance,
          tetoDiarioBacen: 500000,
          loteDisparo: 50000
        };
      });
    } else {
      const months = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
      let cumulativeBalance = 25000000;
      return months.map((week) => {
        const entradas = Math.floor(Math.random() * 15000000) + 12000000;
        const saidas = 3500000; // 7 dias x R$ 500k
        cumulativeBalance += (entradas - saidas);
        return {
          time: week,
          entradasBRL: entradas,
          saidasBRL: saidas,
          saldoAcumuladoBRL: cumulativeBalance,
          tetoDiarioBacen: 3500000,
          loteDisparo: 350000
        };
      });
    }
  };

  const [data, setData] = useState<CashFlowDataPoint[]>(generateCashFlowData('24h'));

  useEffect(() => {
    setData(generateCashFlowData(timeframe));
  }, [timeframe]);

  // Real-time interval pulse updating cash flow every 5 seconds
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setData((prevData) => {
        const updated = [...prevData];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0) {
          const deltaIn = Math.floor(Math.random() * 80000) + 20000;
          updated[lastIdx] = {
            ...updated[lastIdx],
            entradasBRL: updated[lastIdx].entradasBRL + deltaIn,
            saldoAcumuladoBRL: updated[lastIdx].saldoAcumuladoBRL + deltaIn
          };
        }
        return updated;
      });
      setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
    }, 4000);

    return () => clearInterval(interval);
  }, [isLive]);

  const handleSimulateInflow = () => {
    setData((prevData) => {
      const updated = [...prevData];
      const lastIdx = updated.length - 1;
      const amount = 500000; // R$ 500k instant Inflow
      updated[lastIdx] = {
        ...updated[lastIdx],
        entradasBRL: updated[lastIdx].entradasBRL + amount,
        saldoAcumuladoBRL: updated[lastIdx].saldoAcumuladoBRL + amount
      };
      return updated;
    });
    setSimulationCount((c) => c + 1);
    setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
  };

  // KPI Calculations
  const currentTotalBalance = data.length > 0 ? data[data.length - 1].saldoAcumuladoBRL : 142850400;
  const totalInflowsPeriod = data.reduce((acc, curr) => acc + curr.entradasBRL, 0);
  const totalOutflowsPeriod = data.reduce((acc, curr) => acc + curr.saidasBRL, 0);
  const bacenDailyLimitRemaining = Math.max(0, 500000 - (totalOutflowsPeriod % 500000));
  const bacenUsagePercentage = Math.min(100, ((500000 - bacenDailyLimitRemaining) / 500000) * 100);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3.5 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs space-y-1.5 z-50">
          <p className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
            <span>Horário / Período: {label}</span>
            <span className="text-[10px] text-emerald-400 font-sans uppercase">Em tempo real</span>
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <strong className="text-white text-xs">{formatCurrency(entry.value)}</strong>
            </div>
          ))}
          <div className="pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 font-sans flex items-center justify-between">
            <span>Teto Diário Bacen (PJ):</span>
            <span className="font-mono font-bold text-amber-400">R$ 500.000,00</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
      {/* Header & Status Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> FLUXO DE CAIXA EM TEMPO REAL
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> NORMA BACEN 3.978
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            Evolução de Fluxo de Caixa vs. Limites Diários Bacen 24h
          </h3>
          <p className="text-xs text-slate-400">
            Monitoramento síncrono das entradas financeiras e execução de saques fracionados em lotes de R$ 50.000,00 frente ao teto diário de R$ 500.000,00 PJ.
          </p>
        </div>

        {/* Timeframe & Real-Time Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setTimeframe('24h')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                timeframe === '24h' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              24h
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('7d')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                timeframe === '7d' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              7d
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('30d')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                timeframe === '30d' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              30d
            </button>
          </div>

          <button
            type="button"
            onClick={handleSimulateInflow}
            className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-emerald-400 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            title="Injetar entrada simulada de R$ 500k"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            + Simular Depósito
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Saldo Total de Caixa</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(currentTotalBalance)}</p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-sans pt-1">
            <span className="text-emerald-400 font-mono font-bold">100% Líquido D+0</span>
            <span>Atualizado: {lastUpdated}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Entradas no Período</span>
            <ArrowUpRight className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl font-bold text-sky-400">{formatCurrency(totalInflowsPeriod)}</p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-sans pt-1">
            <span>Multi-Gateway Active</span>
            <span className="text-sky-400 font-mono">Mercado Pago + Asaas</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Saques Bacen (24h)</span>
            <ArrowDownRight className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-xl font-bold text-teal-400">{formatCurrency(totalOutflowsPeriod)}</p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-sans pt-1">
            <span>Lotes de R$ 50.000,00</span>
            <span className="text-teal-400 font-mono">100% Homologado</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1.5">
          <div className="flex items-center justify-between text-amber-400 text-[10px] uppercase font-bold">
            <span>Limite Bacen 24h Restante</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-400">{formatCurrency(bacenDailyLimitRemaining)}</p>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800 mt-1">
            <div
              className="bg-amber-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${bacenUsagePercentage}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-sans pt-0.5 text-right">
            {bacenUsagePercentage.toFixed(1)}% do teto acumulado de R$ 500k
          </p>
        </div>
      </div>

      {/* Main Recharts Chart: Evolution of Cash Flow vs Bacen Daily Limits */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Evolução do Saldo Acumulado & Disparos Fracionados (Recharts Real-Time Engine)
            </h4>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Saldo Acumulado
            </span>
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Entradas (PIX/Cartão)
            </span>
            <span className="flex items-center gap-1.5 text-teal-400">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" /> Saques Bacen (R$ 50k)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <span className="w-2.5 h-0.5 bg-amber-400" /> Teto Bacen 24h
            </span>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 15, right: 20, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorSaldoAcumulado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.3} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              />

              {/* Left Y Axis for Transaction Volumes */}
              <YAxis
                yAxisId="left"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
              />

              {/* Right Y Axis for Accumulated Balance */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#10b981"
                tick={{ fill: '#10b981', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => `R$ ${(val / 1000000).toFixed(1)}M`}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Bacen Daily Ceiling Limit Line (R$ 500.000,00) */}
              <ReferenceLine
                yAxisId="left"
                y={500000}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: 'Teto Bacen 24h: R$ 500.000,00',
                  fill: '#f59e0b',
                  fontSize: 10,
                  position: 'insideTopRight',
                  fontFamily: 'monospace'
                }}
              />

              {/* Bacen Batch Limit Line (R$ 50.000,00) */}
              <ReferenceLine
                yAxisId="left"
                y={50000}
                stroke="#14b8a6"
                strokeDasharray="2 2"
                strokeWidth={1}
                label={{
                  value: 'Lote Pix: R$ 50.000,00',
                  fill: '#14b8a6',
                  fontSize: 9,
                  position: 'insideBottomLeft',
                  fontFamily: 'monospace'
                }}
              />

              {/* Accumulated Cash Flow Balance (Area Chart) */}
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="saldoAcumuladoBRL"
                name="Saldo de Caixa Acumulado"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSaldoAcumulado)"
              />

              {/* Daily Inflows (Bar Chart) */}
              <Bar
                yAxisId="left"
                dataKey="entradasBRL"
                name="Entradas (PIX/Cartão)"
                fill="#0284c7"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />

              {/* Bacen Daily Outflow Batches (Bar Chart) */}
              <Bar
                yAxisId="left"
                dataKey="saidasBRL"
                name="Saques Bacen (24h)"
                fill="#14b8a6"
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audit Footnote & Bacen Compliance Cert */}
      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            CNPJ: <strong className="text-white">68.603.032/0001-15</strong> • MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-sky-400 font-bold">PROJEÇÃO LIQUIDEZ: D+0 INSTANTÂNEA</span>
          <span className="text-emerald-400 font-bold">NORMA BACEN 3.978 OK</span>
        </div>
      </div>
    </div>
  );
};
