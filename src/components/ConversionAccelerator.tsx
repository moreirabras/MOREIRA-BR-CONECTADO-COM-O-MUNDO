import React, { useState, useEffect } from 'react';
import { Rocket, RefreshCw, Mail, QrCode, AlertTriangle, CheckCircle2, Zap, MessageSquare } from 'lucide-react';

interface PendingTransaction {
  id: string;
  txId: string;
  customerName: string;
  value: number;
  createdAt: string;
  status: 'PENDENTE' | 'EXPIRADO';
  // Predictive fields
  behaviorScore: number; // 0-100 (high = likely to convert)
  suggestedAction: 'discount' | 'support' | 'remind';
}

export const ConversionAccelerator: React.FC = () => {
  const [pendingTxs, setPendingTxs] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    // Simulação com padrão de comportamento (Ex: high value abandonment)
    setPendingTxs([
      { id: '1', txId: 'TX-PIX-9901', customerName: 'Moreira Brasil Construtora', value: 29900, createdAt: new Date(Date.now() - 3600000).toISOString(), status: 'PENDENTE', behaviorScore: 65, suggestedAction: 'remind' },
      { id: '2', txId: 'TX-PIX-9902', customerName: 'Cliente Corporativo', value: 145000, createdAt: new Date(Date.now() - 7200000).toISOString(), status: 'PENDENTE', behaviorScore: 30, suggestedAction: 'discount' }
    ]);
  }, []);

  const handleAction = async (txId: string, action: 'resend' | 'discount' | 'support') => {
    setActionFeedback(null);
    setLoading(true);
    try {
      await fetch('/api/checkout/accelerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId, action })
      });
      const actionMap = { resend: 'Reenvio QR', discount: 'Cupom de Desconto', support: 'Suporte via Chat' };
      setActionFeedback(`✅ Ação ${actionMap[action]} disparada para ${txId}.`);
    } catch {
      setActionFeedback('❌ Erro na comunicação com o checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/30 text-sky-400">
          <Rocket className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Acelerador de Conversão Preditiva</h3>
          <p className="text-xs text-slate-400">IA analisando abandono de checkout para recuperação automática.</p>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/30 text-emerald-400 text-xs font-mono">{actionFeedback}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 uppercase">
              <th className="px-3 py-2">Cliente / TxID</th>
              <th className="px-3 py-2">Valor</th>
              <th className="px-3 py-2">Prob. Conversão</th>
              <th className="px-3 py-2">Ação Preditiva Sugerida</th>
            </tr>
          </thead>
          <tbody>
            {pendingTxs.map(tx => (
              <tr key={tx.id} className="border-b border-slate-800/50 hover:bg-slate-800/50">
                <td className="px-3 py-3">
                  <div className="font-bold text-slate-100">{tx.customerName}</div>
                  <div className="font-mono text-slate-500">{tx.txId}</div>
                </td>
                <td className="px-3 py-3 font-mono font-bold text-emerald-400">R$ {(tx.value / 100).toFixed(2)}</td>
                <td className="px-3 py-3">
                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${tx.behaviorScore > 50 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{width: `${tx.behaviorScore}%`}}></div>
                    </div>
                    <span className="text-[10px] text-slate-400">{tx.behaviorScore}%</span>
                </td>
                <td className="px-3 py-3 flex gap-2">
                  {tx.suggestedAction === 'discount' && (
                    <button onClick={() => handleAction(tx.txId, 'discount')} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer">
                        <Zap className="w-3.5 h-3.5" /> Aplicar Desconto
                    </button>
                  )}
                  {tx.suggestedAction === 'remind' && (
                    <button onClick={() => handleAction(tx.txId, 'resend')} className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer">
                        <QrCode className="w-3.5 h-3.5" /> Reenviar QR
                    </button>
                  )}
                  <button onClick={() => handleAction(tx.txId, 'support')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer">
                    <MessageSquare className="w-3.5 h-3.5" /> Abrir Chat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
