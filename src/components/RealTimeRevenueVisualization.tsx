import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

interface TransactionLog {
  id: string;
  transactionId: string;
  action: string;
  newState?: any;
  timestamp: string;
  actor: string;
}

interface Props {
  logs: TransactionLog[];
}

export const RealTimeRevenueVisualization: React.FC<Props> = ({ logs }) => {
  // Processar dados para as visualizações
  const chartData = useMemo(() => {
    // Pegar os últimos 20 logs para um efeito de "tempo real"
    return logs.slice(-20).map(log => {
      const amount = (log.newState?.valor || log.newState?.amount || 29900) / 100;
      return {
        time: new Date(log.timestamp).toLocaleTimeString(),
        volume: amount,
        revenue: amount,
        projectedProfit: amount * 0.7 // Margem de 70% como projeção
      };
    });
  }, [logs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Volume de Transações Real-Time */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-slate-100">Volume de Transações (Real-Time)</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="volume" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Receita Bruta vs Margem Projetada */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-slate-100">Receita Bruta vs Margem Projetada</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              <Legend />
              <Area type="monotone" dataKey="revenue" name="Receita Bruta" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.2} />
              <Line type="monotone" dataKey="projectedProfit" name="Margem Projetada" stroke="#f59e0b" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
