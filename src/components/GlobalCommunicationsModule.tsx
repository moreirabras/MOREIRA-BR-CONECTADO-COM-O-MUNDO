import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, Globe2, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import { motion } from 'motion/react';

export const GlobalCommunicationsModule: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleBroadcast = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/communications/broadcast-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: 'Jose Silva',
          copyEmail: 'josemoreirabrazil@gmail.com'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ success: true, message: data.message });
      } else {
        setFeedback({ success: false, message: data.details || 'Falha ao processar comunicado.' });
      }
    } catch (e) {
      setFeedback({ success: false, message: 'Erro de conexão com o motor de mensageria.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/30 text-sky-400">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Comunicado Global de Boas-vindas & Agradecimentos
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                142 PAÍSES · 250 IDIOMAS
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Disparo automático de mensagens personalizadas para a base de clientes ativos da <strong className="text-white">Moreira Brasil</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Dados Constitucionais do Remetente
            </h4>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between border-b border-slate-800/50 pb-1 text-slate-300">
                <span>Empresa:</span>
                <span className="text-white">MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1 text-slate-300">
                <span>CNPJ:</span>
                <span className="text-white">68.603.032/0001-15</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1 text-slate-300">
                <span>Assinado por:</span>
                <span className="text-sky-400 font-bold">Jose Silva</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Cópia de Segurança:</span>
                <span className="text-slate-400">josemoreirabrazil@gmail.com</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-500/20 space-y-2">
            <div className="flex items-center gap-2 text-sky-300 text-xs font-bold uppercase">
              <Globe2 className="w-4 h-4" />
              Estratégia Multilíngue
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              O sistema detecta a região de origem de cada transação real e aplica o template correspondente (Português, Inglês, Espanhol, Árabe, Hindi, etc.) garantindo que cada um dos clientes receba a mensagem em seu idioma nativo.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center items-center p-8 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-4">
          <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <Send className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Disparo Massivo Seguro</h4>
            <p className="text-xs text-slate-400 max-w-[250px] mx-auto mt-1">
              Clique no botão abaixo para iniciar o processamento do comunicado para toda a rede global.
            </p>
          </div>

          <button
            onClick={handleBroadcast}
            disabled={loading}
            className="w-full max-w-[240px] py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Processando Envio...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Enviar Comunicado Agora</span>
              </>
            )}
          </button>

          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-3 rounded-lg text-xs font-mono w-full ${feedback.success ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300' : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'}`}
            >
              {feedback.message}
            </motion.div>
          )}
        </div>
      </div>
      
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[11px] text-amber-200 leading-relaxed">
          <strong className="block text-xs mb-0.5 uppercase">Aviso de Compliance & Rastro Forense:</strong>
          Esta ação será registrada permanentemente nos logs de auditoria forense do sistema, vinculada ao CPF/CNPJ dos clientes reais processados. Cópias integras serão enviadas para <span className="font-bold underline">josemoreirabrazil@gmail.com</span> para fins de conferência legal.
        </div>
      </div>
    </div>
  );
};
