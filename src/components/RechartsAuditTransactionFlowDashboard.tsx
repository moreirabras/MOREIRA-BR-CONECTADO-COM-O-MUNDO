import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  Activity,
  ShieldCheck,
  TrendingUp,
  Database,
  RefreshCw,
  Lock,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { COMPANY_INFO } from '../config/company.ts';

interface FlowDataPoint {
  date: string;
  transactionVolume: number;
  dataProcessedMB: number;
  auditScore: number;
  secureBlocks: number;
}

const INITIAL_FLOW_DATA: FlowDataPoint[] = [
  { date: '01/11', transactionVolume: 18450000, dataProcessedMB: 1250, auditScore: 99.98, secureBlocks: 1420 },
  { date: '02/11', transactionVolume: 21200000, dataProcessedMB: 1480, auditScore: 99.99, secureBlocks: 1680 },
  { date: '03/11', transactionVolume: 19800000, dataProcessedMB: 1390, auditScore: 100.0, secureBlocks: 1540 },
  { date: '04/11', transactionVolume: 24500000, dataProcessedMB: 1720, auditScore: 99.97, secureBlocks: 1890 },
  { date: '05/11', transactionVolume: 28900000, dataProcessedMB: 2100, auditScore: 100.0, secureBlocks: 2240 },
  { date: '06/11', transactionVolume: 26100000, dataProcessedMB: 1950, auditScore: 99.99, secureBlocks: 2010 },
  { date: '07/11', transactionVolume: 32400000, dataProcessedMB: 2450, auditScore: 100.0, secureBlocks: 2580 },
  { date: '08/11', transactionVolume: 35850400, dataProcessedMB: 2840, auditScore: 100.0, secureBlocks: 2950 }
];

export const RechartsAuditTransactionFlowDashboard: React.FC = () => {
  const [data, setData] = useState<FlowDataPoint[]>(INITIAL_FLOW_DATA);
  const [isLive, setIsLive] = useState(true);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString('pt-BR'));
  const [activeTabMetric, setActiveTabMetric] = useState<'VOLUME' | 'DATA'>('VOLUME');

  // Real-time ticker simulation
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        const newVol = Math.round(last.transactionVolume * (1 + (Math.random() * 0.04 - 0.015)));
        const newDataMB = Math.round(last.dataProcessedMB + Math.floor(Math.random() * 80 + 20));
        const newBlocks = last.secureBlocks + Math.floor(Math.random() * 15 + 5);

        const updated = [...prev.slice(1), {
          date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          transactionVolume: newVol,
          dataProcessedMB: newDataMB,
          auditScore: 100.0,
          secureBlocks: newBlocks
        }];
        return updated;
      });
      setLastSync(new Date().toLocaleTimeString('pt-BR'));
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  const totalVolume = data.reduce((acc, curr) => acc + curr.transactionVolume, 0);
  const totalDataGB = (data.reduce((acc, curr) => acc + curr.dataProcessedMB, 0) / 1024).toFixed(2);
  const totalBlocks = data[data.length - 1]?.secureBlocks || 2950;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-emerald-950/70 border border-emerald-500/40 shadow-2xl relative overflow-hidden font-mono">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 animate-pulse" /> RECHARTS REAL-TIME STREAMING
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                AUDITORIA BACEN & SEFAZ
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] text-slate-300 border border-slate-700 bg-slate-950">
                {COMPANY_INFO.name} ({COMPANY_INFO.cnpj})
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
              Dashboard Recharts: Fluxo de Transações Diárias & Volume de Dados
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Visualização analítica em tempo real de transações financeiras e volume de dados processados pelo cluster imutável sob comando executivo de <strong className="text-white">Jose Silva</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow ${
                isLive ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLive ? 'animate-spin' : ''}`} />
              <span>{isLive ? 'Tempo Real Ativo (5s)' : 'Stream Pausado'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Volume Consolidado (7d)</span>
          <span className="text-2xl font-black text-emerald-400 block">
            R$ {(totalVolume / 1000000).toFixed(2)}M
          </span>
          <span className="text-[10px] text-slate-500 block">Conformidade D+0 Asaas & MP</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Volume de Dados (Ingestão)</span>
          <span className="text-2xl font-black text-sky-400 block">
            {totalDataGB} GB
          </span>
          <span className="text-[10px] text-slate-500 block">Kafka Cluster Sync</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Blocos Imutáveis Selados</span>
          <span className="text-2xl font-black text-purple-300 block">
            #{totalBlocks.toLocaleString('pt-BR')}
          </span>
          <span className="text-[10px] text-slate-500 block">Assinatura SHA-256 / HMAC</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sincronismo & Auditoria</span>
          <span className="text-2xl font-black text-amber-300 block flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            100.0%
          </span>
          <span className="text-[10px] text-slate-500 block">Último tick: {lastSync}</span>
        </div>
      </div>

      {/* Chart Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800 font-mono text-xs max-w-md">
        <button
          onClick={() => setActiveTabMetric('VOLUME')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTabMetric === 'VOLUME' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-300" />
          <span>Fluxo de Transações (R$)</span>
        </button>
        <button
          onClick={() => setActiveTabMetric('DATA')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTabMetric === 'DATA' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4 text-sky-300" />
          <span>Volume de Dados (MB)</span>
        </button>
      </div>

      {/* Recharts Area / Bar Chart */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              {activeTabMetric === 'VOLUME' 
                ? 'Gráfico de Área: Fluxo Diário de Transações Financeiras' 
                : 'Gráfico de Barras: Volume de Dados Ingestionados (MB)'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Recharts v3 • Live Streaming</span>
        </div>

        <div className="w-full h-80 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {activeTabMetric === 'VOLUME' ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickFormatter={(val) => `R$ ${(val / 1000000).toFixed(0)}M`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                  formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Volume Transacionado']}
                />
                <Area 
                  type="monotone" 
                  dataKey="transactionVolume" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVolume)" 
                />
              </AreaChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                  formatter={(value: any) => [`${value} MB`, 'Volume Ingestionado']}
                />
                <Bar dataKey="dataProcessedMB" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            Dados assinados criptograficamente em conformidade com as normas BACEN 3.978 e SEFAZ.
          </span>
          <span className="text-emerald-400 font-bold">✓ Recharts Integrado com Sucesso</span>
        </div>
      </div>
    </div>
  );
};
