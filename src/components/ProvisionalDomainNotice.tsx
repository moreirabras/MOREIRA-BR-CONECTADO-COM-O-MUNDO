import React, { useState } from 'react';
import { Globe, Copy, Check, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ProvisionalDomainNotice: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const provisionalUrl = 'https://moreirabrconectword.onrender.com/';

  const handleCopy = () => {
    navigator.clipboard.writeText(provisionalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 left-5 z-[9999] p-3 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-2xl flex items-center justify-center transition-all cursor-pointer ring-4 ring-amber-500/30 animate-bounce"
        title="Ver Aviso de Domínio Provisório"
      >
        <Globe className="w-5 h-5" />
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-5 left-5 z-[9999] max-w-sm w-full p-4 rounded-2xl bg-slate-900/95 border-2 border-amber-500/60 shadow-2xl backdrop-blur-xl text-slate-100 font-sans space-y-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/40 text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-amber-500 text-slate-950 uppercase">
                Aviso Importante
              </span>
              <h4 className="text-xs font-black text-white mt-1">Domínio Provisório Ativo</h4>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Minimizar Aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          Este ambiente está operando atualmente através do domínio provisório oficial de homologação/produção:
        </p>

        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono text-amber-300 truncate select-all">
            {provisionalUrl}
          </span>
          <button
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer transition-all shadow-md"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-400 border-t border-slate-800/80">
          <span>Moreira Brasil & FinTech Global</span>
          <span className="text-emerald-400 font-semibold">24/7/365 Sincronizado</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
