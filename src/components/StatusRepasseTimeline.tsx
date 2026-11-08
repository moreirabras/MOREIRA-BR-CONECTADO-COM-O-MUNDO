import React from 'react';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  ArrowRight,
  Zap,
  FileCheck,
  CreditCard,
  Landmark
} from 'lucide-react';

interface TransferStep {
  step: number;
  title: string;
  subtitle: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  eta: string;
  details: string;
  icon: any;
}

export const StatusRepasseTimeline: React.FC = () => {
  const steps: TransferStep[] = [
    {
      step: 1,
      title: '1. Emissão de NFe / NFSe (SEFAZ)',
      subtitle: 'Validação XSD v4.00 & Assinatura A1',
      status: 'COMPLETED',
      eta: 'Instantâneo (0.12s)',
      details: 'Nota fiscal eletrônica de exportação de serviços vinculada ao CNPJ 68.603.032/0001-15 validada e autorizada pela SEFAZ-SP.',
      icon: FileCheck
    },
    {
      step: 2,
      title: '2. Ingestão & Captura via Gateway',
      subtitle: 'Webhook Asaas, Stripe & Mercado Pago',
      status: 'COMPLETED',
      eta: 'Real-Time Webhook',
      details: 'Confirmação forense do pagamento do cliente efetuada com rastreabilidade SHA-256 e validação de assinatura WAF.',
      icon: CreditCard
    },
    {
      step: 3,
      title: '3. Split de Pagamento & Tributos',
      subtitle: 'Direcionamento Moreira Brasil & Deduções',
      status: 'COMPLETED',
      eta: 'Processamento Automático',
      details: 'Alocação de 100% dos recursos líquidos (85.55%) para a conta da Moreira Brasil e provisionamento de impostos SEFAZ (14.45%).',
      icon: Zap
    },
    {
      step: 4,
      title: '4. Compensação & Disponibilidade',
      subtitle: 'Mercado Pago (Ag 0001 • CC 8731119479-4)',
      status: 'COMPLETED',
      eta: 'Disponível em Conta (D+0 Instantâneo)',
      details: 'Valores liberados e disponíveis para saque imediato via Pix (+5573998599213) na conta corrente Mercado Pago.',
      icon: Landmark
    }
  ];

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> CICLO DE REPASSE SEFAZ ➔ BANCO
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
              CNPJ 68.603.032/0001-15
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-emerald-400" />
            Status de Repasse em Tempo Real (Linha do Tempo)
          </h3>
          <p className="text-xs text-slate-400">
            Acompanhe o ciclo de vida completo dos valores faturados, desde a autorização fiscal na SEFAZ até a disponibilidade na conta bancária oficial da Moreira Brasil.
          </p>
        </div>

        <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-right">
          <p className="text-[10px] font-mono uppercase text-slate-400">Status Bancário Oficial</p>
          <p className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 justify-end">
            <CheckCircle2 className="w-4 h-4" /> 100% LIQUIDADO & DISPONÍVEL
          </p>
        </div>
      </div>

      {/* Timeline Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
        {steps.map((s, index) => {
          const IconComp = s.icon;
          return (
            <div
              key={s.step}
              className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                s.status === 'COMPLETED'
                  ? 'bg-slate-950/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-950/50 border-slate-800 opacity-70'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl border ${
                    s.status === 'COMPLETED'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400">
                    {s.eta}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">{s.title}</h4>
                  <p className="text-xs text-slate-400 font-medium">{s.subtitle}</p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-800/80">
                  {s.details}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Etapa {s.step} de 4</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> OK
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Destination Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-wider">Conta de Destino do Repasse (Moreira Brasil)</p>
            <p className="text-xs font-mono text-emerald-400 mt-0.5">Banco Mercado Pago (323) • Agência: 0001 • CC: 8731119479-4 • Pix: +5573998599213 • CNPJ: 68.603.032/0001-15</p>
          </div>
        </div>
        <div className="text-right">
          <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500 text-slate-950">
            Split 100% Mercado Pago Ativo
          </span>
        </div>
      </div>
    </div>
  );
};
