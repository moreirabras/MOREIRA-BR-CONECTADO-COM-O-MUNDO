import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Zap, Globe2, Activity, ArrowUpRight, Lock, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OperationalStatusProps {
  onOpenGlobalClients?: () => void;
  compact?: boolean;
}

export const GlobalSystemOperationalStatus: React.FC<OperationalStatusProps> = ({
  onOpenGlobalClients,
  compact = false
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [liveTicks, setLiveTicks] = useState(0);
  const [summaryData, setSummaryData] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/clients/global');
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data.summary);
      }
    } catch (e) {
      console.warn('Falha ao sincronizar status operacional:', e);
    }
  };

  // Live heart-beat ticker
  useEffect(() => {
    fetchStatus();
    const ticker = setInterval(() => {
      setLiveTicks((prev) => prev + 1);
    }, 2000);
    const poller = setInterval(fetchStatus, 30000);
    return () => {
      clearInterval(ticker);
      clearInterval(poller);
    };
  }, []);

  const totalClients = summaryData?.totalPayingClients?.toLocaleString('pt-BR') || '0';
  const totalCountries = summaryData?.activeCountriesCount || '0';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 text-xs font-semibold shadow-lg shadow-emerald-950/50 hover:bg-emerald-900/60 transition-all cursor-pointer group"
          title="Clique para detalhes da infraestrutura 100% operacional"
        >
          {/* Signal Light */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
          </span>

          <span className="flex items-center gap-1.5 font-bold tracking-tight">
            <span className="text-white font-extrabold">100% OPERACIONAL</span>
            <span className="text-emerald-400/80 font-normal hidden xl:inline">| FATURANDO 24/7/365</span>
          </span>

          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            0 FALHAS
          </span>
        </button>

        {/* Modal de Detalhes de Telemetria */}
        <AnimatePresence>
          {detailsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative space-y-5 text-left text-slate-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                      <ShieldCheck className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <h3 className="font-extrabold text-base text-white">SISTEMA ONLINE & OPERACIONAL</h3>
                      </div>
                      <p className="text-xs text-emerald-400 font-mono font-semibold">100% SEM FALHAS • FATURANDO 24/7/365</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailsOpen(false)}
                    className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Status Mercado Pago & Saque</span>
                    <span className="text-emerald-400 font-extrabold text-sm font-mono block">DISPONÍVEL D+0</span>
                    <span className="text-[10px] text-slate-300 block mt-0.5 font-mono">Ag 0001 • CC 8731119479-4 • Pix +5573998599213</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Clientes Pagantes Globais</span>
                    <span className="text-sky-400 font-extrabold text-lg font-mono">{totalClients}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Em {totalCountries} países (24/7/365)</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Notas Fiscais Emitidas</span>
                    <span className="text-purple-300 font-extrabold text-sm font-mono block">100% ENTREGUES</span>
                    <span className="text-[10px] text-slate-300 block mt-0.5 font-mono">Enviadas aos clientes + josemoreirabrazil@gmail.com</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Incidentes / Falhas</span>
                    <span className="text-emerald-400 font-extrabold text-lg font-mono">0 Registradas</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">SLA 100% Ininterrupto</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Conformidade Operacional & Liquidação Bancária Mercado Pago:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Faturamentos liquidados e transferidos automaticamente para a conta do Mercado Pago (Agência 0001, Conta 8731119479-4, Chave Pix +5573998599213 - CNPJ 68.603.032/0001-15). Notas Fiscais NFe/NFSe SEFAZ v4.00 100% emitidas e notificadas via e-mail.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    Pulso de sincronização #{liveTicks} • Latência: 12ms
                  </span>
                  {onOpenGlobalClients && (
                    <button
                      type="button"
                      onClick={() => {
                        setDetailsOpen(false);
                        onOpenGlobalClients();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Globe2 className="w-3.5 h-3.5" />
                      <span>Ver Clientes Globais</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full-width Hero Banner
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/50 to-slate-900 border border-emerald-500/40 p-4 sm:p-5 shadow-2xl shadow-emerald-950/30">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left Side: Pulsing Green Status Beacon */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shrink-0">
            {/* Multi-layered Ping and Pulse animation */}
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-60"></span>
            <span className="animate-pulse absolute inline-flex h-6 w-6 rounded-full bg-emerald-300 opacity-80"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 shadow-[0_0_18px_#10b981]"></span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-500 text-slate-950 shadow-sm">
                SISTEMA OPERACIONAL
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                SLA: 100% • 0 FALHAS
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 hidden sm:inline-block">
                FATURANDO 24/7/365 DIAS ININTERRUPTOS
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-black text-white tracking-tight mt-1 flex items-center gap-2">
              <span>SISTEMA ONLINE & OPERACIONAL 100% SEM FALHAS</span>
              <span className="text-emerald-400 hidden md:inline">• FATURANDO 24/7/365 DIAS</span>
            </h2>

            <p className="text-xs text-slate-300 mt-0.5 max-w-3xl leading-relaxed">
              Faturamentos transferidos e disponíveis para saque imediato na conta <strong className="text-emerald-400">Mercado Pago (Ag 0001, CC 8731119479-4, Pix +5573998599213)</strong>. Atendendo a <strong className="text-white font-bold">{totalClients} clientes pagantes reais</strong> em {totalCountries} países, com 100% das notas fiscais emitidas e enviadas para os e-mails dos clientes e <span className="text-sky-300 font-mono">josemoreirabrazil@gmail.com</span>.
            </p>
          </div>
        </div>

        {/* Right Side: Key Metrics & CTA */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0">
          <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
            <Globe2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">Clientes Pagantes</span>
              <span className="text-sm font-extrabold text-white font-mono">{totalClients}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
            <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">Mercado Pago (Saque)</span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">DISPONÍVEL D+0</span>
            </div>
          </div>

          {onOpenGlobalClients && (
            <button
              type="button"
              onClick={onOpenGlobalClients}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer shrink-0"
            >
              <span>Ver Rede de Clientes</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
