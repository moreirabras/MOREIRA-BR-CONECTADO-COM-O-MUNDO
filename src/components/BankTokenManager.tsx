import React, { useState } from 'react';
import { Key, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';

export const BankTokenManager: React.FC = () => {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [message, setMessage] = useState('');

  const validateToken = async () => {
    setStatus('validating');
    setMessage('Validando conexão com banco parceiro...');
    
    try {
      const response = await fetch('/api/security/validate-bank-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await response.json();
      
      if (data.valid) {
        setStatus('valid');
        setMessage('✅ Token validado e conexão estabelecida com sucesso.');
      } else {
        setStatus('invalid');
        setMessage('❌ Falha na validação: ' + (data.message || 'Token inválido.'));
      }
    } catch (error) {
      setStatus('invalid');
      setMessage('❌ Erro de conexão com o serviço de validação.');
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/30 text-sky-400">
          <Key className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gestão BANK_PARTNER_AUTH_TOKEN</h3>
          <p className="text-xs text-slate-400">Validação em tempo real com endpoints bancários.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-medium">Auth Token do Parceiro</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-sky-500"
            placeholder="Insira o token de autorização..."
          />
        </div>

        <button
          onClick={validateToken}
          disabled={status === 'validating'}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {status === 'validating' ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5" />
          )}
          {status === 'validating' ? 'Validando...' : 'Validar Conexão'}
        </button>
      </div>

      {status !== 'idle' && (
        <div className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
          status === 'valid' ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 
          status === 'invalid' ? 'bg-rose-950/40 border-rose-500/50 text-rose-300' :
          'bg-sky-950/40 border-sky-500/50 text-sky-300'
        }`}>
          {status === 'valid' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};
