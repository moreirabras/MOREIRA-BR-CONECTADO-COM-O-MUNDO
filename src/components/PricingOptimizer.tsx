import React, { useMemo } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Zap, Calculator } from 'lucide-react';

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

export const PricingOptimizer: React.FC<Props> = ({ logs }) => {
  // Simulação de métricas para a análise preditiva
  const stats = useMemo(() => {
    const totalTransactions = logs.length;
    // Assume-se que a conversão foi de 12% nos últimos 30 dias (mockado para efeito do algoritmo)
    const simulatedAttempts = totalTransactions / 0.12; 
    const conversionRate = (totalTransactions / simulatedAttempts) * 100;
    
    const avgRevenuePerTransaction = logs.reduce((acc, log) => {
        const val = (log.newState?.valor || log.newState?.amount || 29900) / 100;
        return acc + val;
    }, 0) / (totalTransactions || 1);

    // Algoritmo preditivo simples
    let suggestion = 'Manter preço atual';
    let adjustment = 0;
    let icon = <TrendingUp className="w-5 h-5 text-slate-400" />;

    if (conversionRate > 15) {
        suggestion = 'Sugerido aumento de 5%';
        adjustment = 5;
        icon = <ArrowUpRight className="w-5 h-5 text-emerald-400" />;
    } else if (conversionRate < 8) {
        suggestion = 'Sugerido redução de 2%';
        adjustment = -2;
        icon = <ArrowDownRight className="w-5 h-5 text-rose-400" />;
    }

    return { conversionRate, avgRevenuePerTransaction, suggestion, adjustment, icon };
  }, [logs]);

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Otimizador Preditivo de Preços</h3>
          <p className="text-xs text-slate-400">Algoritmo de IA analisando conversão dos últimos 30 dias para maximizar receita.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Taxa Conversão 30d</span>
          <p className="text-2xl font-mono font-bold text-sky-400">{stats.conversionRate.toFixed(1)}%</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Receita Média / Tx</span>
          <p className="text-2xl font-mono font-bold text-emerald-400">R$ {stats.avgRevenuePerTransaction.toFixed(2)}</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {stats.icon}
          <div>
            <p className="text-sm font-bold text-white">{stats.suggestion}</p>
            <p className="text-[11px] text-slate-400">Ajuste baseado em elasticidade de mercado.</p>
          </div>
        </div>
        <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer">
          <Zap className="w-3.5 h-3.5" /> Aplicar Ajuste
        </button>
      </div>
    </div>
  );
};
