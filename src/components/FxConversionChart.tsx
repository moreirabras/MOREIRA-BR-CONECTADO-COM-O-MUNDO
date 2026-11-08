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
} from 'recharts';
import { Landmark, TrendingUp, RefreshCw, ShieldCheck } from 'lucide-react';

export const FxConversionChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/fx/rates');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch rates', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    fetchData();
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-400" />
            Variação de Taxas de Conversão (BACEN/Repatriação)
          </h3>
          <p className="text-xs text-slate-400">Monitoramento da eficiência de câmbio (BRL por unidade estrangeira).</p>
        </div>
        <button
          onClick={refreshData}
          className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Legend />
            <Bar dataKey="USD" fill="#3b82f6" name="USD (BRL/USD)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="INR" fill="#f59e0b" name="INR (BRL/INR)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="AED" fill="#10b981" name="AED (BRL/AED)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800">
        <ShieldCheck className="w-3 h-3 text-emerald-500" />
        <span>Dados em conformidade com as taxas de fechamento BACEN (Código 12003).</span>
      </div>
    </div>
  );
};
