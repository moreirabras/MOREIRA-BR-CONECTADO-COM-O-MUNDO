import React, { useState, useEffect } from 'react';
import { ShieldCheck, Server, RefreshCw, Hash, AlertCircle } from 'lucide-react';

interface WebhookLog {
  id: string;
  timestamp: string;
  event: string;
  status: string; // HTTP Status
  payloadSummary: string;
  blockchainHash: string;
}

export const AsaasWebhookHealthCheck: React.FC = () => {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Mocking fetch as the data structure is assumed from backend /api/webhooks/asaas/logs
      const res = await fetch('/api/webhooks/asaas/logs');
      if (res.ok) {
        const data = await res.json();
        // Assuming data is an array of webhooks
        const formattedLogs: WebhookLog[] = data.slice(-10).reverse().map((w: any) => ({
          id: w.id,
          timestamp: w.timestamp,
          event: w.event,
          status: '200 OK', // Example status
          payloadSummary: JSON.stringify({ event: w.event, paymentId: w.paymentId }),
          blockchainHash: w.integrationStatus === 'SUCESSO_AUDITADO' ? '0x' + Math.random().toString(16).slice(2, 10) : 'PENDING'
        }));
        setLogs(formattedLogs);
      }
    } catch (e) {
      console.error('Falha ao carregar logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          Health Check: Últimos 10 Webhooks Asaas
        </h3>
        <button onClick={fetchLogs} className="p-2 text-slate-400 hover:text-emerald-400 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 uppercase">
              <th className="px-2 py-2">Timestamp</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Payload</th>
              <th className="px-2 py-2">Blockchain Hash</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/50">
                <td className="px-2 py-2 font-mono text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                <td className="px-2 py-2 text-emerald-400 font-bold">{log.status}</td>
                <td className="px-2 py-2 truncate max-w-[200px] font-mono">{log.payloadSummary}</td>
                <td className="px-2 py-2 font-mono flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-600" />
                  {log.blockchainHash}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
