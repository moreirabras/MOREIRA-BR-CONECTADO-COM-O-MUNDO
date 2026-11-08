import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Target
} from 'lucide-react';

interface AsaasFlowData {
  date: string;
  realFlow: number;
  complianceTarget: number;
  predictedReceipts: number;
  projectedOutflows: number;
}

export const AsaasDailyCashFlowDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AsaasFlowData[]>([]);
  const [balance, setBalance] = useState({
    available: 142850.40,
    predicted: 85400.00,
    projected: 32100.00
  });

  const fetchData = async () => {
    setLoading(true);
    // In a real scenario, this would fetch from /api/webhooks/asaas/logs and other metrics
    // Mocking for visual fidelity and compliance target comparison
    const mockData: AsaasFlowData[] = [
      { date: '01/11', realFlow: 45000, complianceTarget: 50000, predictedReceipts: 12000, projectedOutflows: 5000 },
      { date: '02/11', realFlow: 52000, complianceTarget: 50000, predictedReceipts: 15000, projectedOutflows: 8000 },
      { date: '03/11', realFlow: 48000, complianceTarget: 50000, predictedReceipts: 10000, projectedOutflows: 4000 },
      { date: '04/11', realFlow: 55000, complianceTarget: 50000, predictedReceipts: 18000, projectedOutflows: 9000 },
      { date: '05/11', realFlow: 61000, complianceTarget: 50000, predictedReceipts: 22000, projectedOutflows: 12000 },
      { date: '06/11', realFlow: 49000, complianceTarget: 50000, predictedReceipts: 14000, projectedOutflows: 6000 },
      { date: '07/11', realFlow: 58000, complianceTarget: 50000, predictedReceipts: 20000, projectedOutflows: 10000 },
    ];
    
    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 800);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet className="w-16 h-16 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Saldo Disponível Asaas</span>
          </div>
          <p className="text-3xl font-black text-white">{formatBRL(balance.available)}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>LIQUIDEZ IMEDIATA D+0</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-16 h-16 text-sky-400" />
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <span>Recebimentos Previstos</span>
          </div>
          <p className="text-3xl font-black text-white">{formatBRL(balance.predicted)}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-sky-400 font-bold font-sans">
            <Calendar className="w-3.5 h-3.5" />
            <span>PRÓXIMOS 7 DIAS ÚTEIS</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <ArrowDownRight className="w-16 h-16 text-rose-400" />
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <span>Saídas Projetadas</span>
          </div>
          <p className="text-3xl font-black text-white">{formatBRL(balance.projected)}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-bold font-sans">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>CONTAS A PAGAR / REPASSES</span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2.5">
              <Target className="w-6 h-6 text-emerald-400" />
              Comparativo de Fluxo Real vs. Meta de Conformidade
            </h3>
            <p className="text-xs text-slate-400">
              Análise diária do volume transacionado no Asaas comparado aos limites de monitoramento preventivo Bacen.
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            Sincronizar API
          </button>
        </div>

        <div className="h-[400px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }} 
              />
              <YAxis 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickFormatter={(val) => `R$ ${val / 1000}k`}
              />
              <Tooltip 
                cursor={{ fill: '#1e293b', opacity: 0.4 }}
                contentStyle={{ 
                  backgroundColor: '#020617', 
                  border: '1px solid #1e293b', 
                  borderRadius: '12px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}
                formatter={(val: any) => formatBRL(Number(val || 0))}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              
              <ReferenceLine 
                y={50000} 
                stroke="#10b981" 
                strokeDasharray="5 5" 
                label={{ 
                  position: 'right', 
                  value: 'Target Compliance', 
                  fill: '#10b981', 
                  fontSize: 10,
                  fontFamily: 'monospace'
                }} 
              />

              <Bar 
                dataKey="realFlow" 
                name="Fluxo Real (Asaas)" 
                fill="#10b981" 
                radius={[6, 6, 0, 0]}
                barSize={32}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.realFlow > entry.complianceTarget ? '#10b981' : '#0ea5e9'} 
                  />
                ))}
              </Bar>
              
              <Bar 
                dataKey="complianceTarget" 
                name="Meta de Conformidade" 
                fill="#334155" 
                radius={[6, 6, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/50 text-[11px] font-mono">
          <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-slate-400">
              <strong className="text-white">STATUS:</strong> O volume atual está dentro das diretrizes da Norma 3.978. Sem retenções preventivas.
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-slate-400">
              <strong className="text-white">AUDITORIA:</strong> Todos os lançamentos estão selados com hash SHA-256 Moreira Brasil.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
