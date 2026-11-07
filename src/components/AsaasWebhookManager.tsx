import React, { useState } from 'react';
import { Webhook, RefreshCw, Zap, Save } from 'lucide-react';

export const AsaasWebhookManager: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState('https://moreira-br-conectado-com-o-mundo-tf.vercel.app/api/webhooks/asaas');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/webhooks/asaas/test-connectivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl })
      });
      if (res.ok) {
        setTestResult('✅ Conectividade validada com sucesso!');
      } else {
        setTestResult('❌ Falha na conexão com a URL configurada.');
      }
    } catch {
      setTestResult('❌ Erro de rede ao testar URL.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <Webhook className="w-4 h-4 text-sky-400" />
        Configuração de Webhook Asaas
      </h3>
      <div className="space-y-2">
        <label className="text-xs text-slate-400">Webhook URL:</label>
        <input 
          type="text" 
          value={webhookUrl} 
          onChange={(e) => setWebhookUrl(e.target.value)}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200"
        />
      </div>
      <div className="flex gap-2">
        <button onClick={handleTestConnection} disabled={testing} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" />
          {testing ? 'Testando...' : 'Testar Conexão'}
        </button>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-2">
          <Save className="w-3.5 h-3.5" />
          Salvar Configuração
        </button>
      </div>
      {testResult && <p className="text-xs font-mono text-slate-300">{testResult}</p>}
    </div>
  );
};
