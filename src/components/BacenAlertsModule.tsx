import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Info, Bell, Save, CheckCircle2 } from 'lucide-react';

export const BacenAlertsModule: React.FC = () => {
  const [thresholds, setThresholds] = useState({
    maxTransactionAmount: 50000.00,
    dailyTransactionLimit: 500000.00,
  });

  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // In a real app, this would poll a backend or use WebSockets
    const interval = setInterval(() => {
      // Simulate checking for compliance exceedances
      const mockAlert = {
        id: Math.random().toString(),
        timestamp: new Date().toISOString(),
        message: 'Movimentação transacional excede o limite de conformidade BACEN 3.978',
        amount: 60000.00,
        type: 'CRITICAL',
      };
      
      if (mockAlert.amount > thresholds.maxTransactionAmount) {
        setAlerts(prev => [mockAlert, ...prev.slice(0, 4)]);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [thresholds]);

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/30 text-rose-400">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Alertas Preventivos Bacen 3.978</h3>
          <p className="text-xs text-slate-400">Monitoramento em tempo real de limites transacionais para conformidade regulatória.</p>
        </div>
      </div>

      <div className="space-y-4">
        {alerts.map(alert => (
          <div key={alert.id} className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/50 flex items-center gap-4">
            <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="text-xs font-bold text-rose-200">{alert.message}</p>
              <p className="text-[10px] text-rose-300/70 font-mono">{alert.timestamp} · Valor: R$ {alert.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <button className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold">
              Investigar
            </button>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="p-6 text-center text-slate-500 text-xs italic">
            Nenhum alerta preventivo ativo no momento.
          </div>
        )}
      </div>
    </div>
  );
};
