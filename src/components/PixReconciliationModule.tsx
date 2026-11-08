import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Zap, Landmark, Lightbulb, GitMerge } from 'lucide-react';

interface PendingPix {
  id: string;
  txId: string;
  customerName: string;
  value: number;
  receivedAt: string;
  status: 'PENDENTE_CONCILIACAO';
  suggestedMatch?: {
    reason: string;
    confidence: number;
  };
}

export const PixReconciliationModule: React.FC = () => {
  const [pendingPix, setPendingPix] = useState<PendingPix[]>([]);
  const [reconciling, setReconciling] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    // Simulação: busca de Pix pendentes e cruzamento com histórico
    setPendingPix([
      { 
        id: 'p1', 
        txId: 'PIX-778899', 
        customerName: 'João Silva', 
        value: 55000, 
        receivedAt: new Date().toISOString(), 
        status: 'PENDENTE_CONCILIACAO',
        suggestedMatch: { reason: 'Valor exato correspondente a fatura #INV-2023-01', confidence: 95 }
      },
      { 
        id: 'p2', 
        txId: 'PIX-112233', 
        customerName: 'Empresa Alpha', 
        value: 120000, 
        receivedAt: new Date().toISOString(), 
        status: 'PENDENTE_CONCILIACAO' 
      }
    ]);
  }, []);

  const handleReconcile = async (id: string) => {
    setReconciling(id);
    setFeedback(null);
    try {
      await fetch('/api/pix/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setFeedback(`✅ Baixa automática confirmada para transação ${id}.`);
      setPendingPix(prev => prev.filter(p => p.id !== id));
    } catch {
      setFeedback('❌ Erro ao processar baixa.');
    } finally {
      setReconciling(null);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400">
          <Landmark className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Conciliação Bancária Inteligente</h3>
          <p className="text-xs text-slate-400">Sugestões automáticas baseadas no histórico para baixa rápida de Pix.</p>
        </div>
      </div>

      {feedback && <div className="p-3 bg-slate-950 border border-emerald-500/30 text-emerald-400 text-xs font-mono">{feedback}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 uppercase">
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Valor</th>
              <th className="px-3 py-2">Sugestão de IA</th>
              <th className="px-3 py-2">Ação</th>
            </tr>
          </thead>
          <tbody>
            {pendingPix.map(pix => (
              <tr key={pix.id} className="border-b border-slate-800/50 hover:bg-slate-800/50">
                <td className="px-3 py-3 font-bold text-slate-100">{pix.customerName}</td>
                <td className="px-3 py-3 font-mono font-bold text-emerald-400">R$ {(pix.value / 100).toFixed(2)}</td>
                <td className="px-3 py-3 font-mono">
                    {pix.suggestedMatch ? (
                        <div className="flex items-center gap-1.5 text-sky-400">
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>{pix.suggestedMatch.reason} ({pix.suggestedMatch.confidence}%)</span>
                        </div>
                    ) : <span className="text-slate-500">Sem sugestão automática</span>}
                </td>
                <td className="px-3 py-3">
                  <button onClick={() => handleReconcile(pix.id)} disabled={reconciling === pix.id} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                    {reconciling === pix.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitMerge className="w-3.5 h-3.5" />}
                    {pix.suggestedMatch ? 'Aplicar Conciliação' : 'Confirmar Baixa'}
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

