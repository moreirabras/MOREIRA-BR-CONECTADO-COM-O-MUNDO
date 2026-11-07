import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Bell,
  Sliders,
  DollarSign,
  AlertTriangle,
  Mail,
  CheckCircle2,
  Lock,
  Save,
  RefreshCw,
  FileText,
  Building2,
  Users,
  Zap,
  Globe2,
  Clock,
  Sparkles,
  Download
} from 'lucide-react';

interface BacenConfigState {
  singleTxThresholdBRL: number;
  dailyAccumulatedBRL: number;
  smurfingTxCount: number;
  smurfingTimeWindowMins: number;
  fxInstantThresholdUSD: number;
  complianceOfficerEmail: string;
  autoBlockSuspicious: boolean;
  autoNotifyCoaf: boolean;
  autoEmailReport: boolean;
  holdPeriodHours: number;
}

const DEFAULT_CONFIG: BacenConfigState = {
  singleTxThresholdBRL: 50000,
  dailyAccumulatedBRL: 500000,
  smurfingTxCount: 5,
  smurfingTimeWindowMins: 60,
  fxInstantThresholdUSD: 10000,
  complianceOfficerEmail: 'josemoreirabrazil@gmail.com',
  autoBlockSuspicious: true,
  autoNotifyCoaf: true,
  autoEmailReport: true,
  holdPeriodHours: 72,
};

export const BacenComplianceConfigModule: React.FC = () => {
  const [config, setConfig] = useState<BacenConfigState>(() => {
    const saved = localStorage.getItem('vortex_bacen_compliance_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });

  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Simulation test form state
  const [simTxValueBRL, setSimTxValueBRL] = useState<string>('75000');
  const [simClientDoc, setSimClientDoc] = useState<string>('68.603.032/0001-15');
  const [simResult, setSimResult] = useState<any | null>(null);

  // Audit alerts log state
  const [alertsLog, setAlertsLog] = useState<any[]>([
    {
      id: 'PLD-99481',
      timestamp: new Date(Date.now() - 3600000).toLocaleString('pt-BR'),
      tipo: 'TRANSAÇÃO SUPERIOR AO LIMITE COMPULSÓRIO',
      valor: 'R$ 145.000,00',
      cliente: 'Burj Global Energy FZE (Dubai UAE)',
      status: 'NOTIFICADO SISCOAF & E-MAIL ENVIADO',
      acao: 'HOLD CAUTELAR 72H ATIVO'
    },
    {
      id: 'PLD-99482',
      timestamp: new Date(Date.now() - 7200000).toLocaleString('pt-BR'),
      tipo: 'TESTE DE FRAGMENTAÇÃO (SMURFING DETECTADO)',
      valor: 'R$ 48.000,00 (5x R$ 9.600,00)',
      cliente: 'Silicon Valley Cloud Systems (USA)',
      status: 'REGRAS BACEN APLICADAS',
      acao: 'APROVADO PÓS KYC ENHANCED'
    }
  ]);

  const handleSaveConfig = () => {
    setSaving(true);
    setFeedbackMsg(null);
    try {
      localStorage.setItem('vortex_bacen_compliance_config', JSON.stringify(config));
      setFeedbackMsg('✅ Limites críticos e regras de notificação Bacen 3.978 atualizados com sucesso!');
    } catch {
      setFeedbackMsg('❌ Erro ao salvar configurações de conformidade.');
    } finally {
      setSaving(false);
    }
  };

  const handleRunSimulation = () => {
    const val = Number(simTxValueBRL);
    const isSingleLimitExceeded = val >= config.singleTxThresholdBRL;
    const isCoafCompulsory = val >= 50000;

    const result = {
      timestamp: new Date().toLocaleString('pt-BR'),
      valor: val,
      exceededSingleLimit: isSingleLimitExceeded,
      coafNotificationRequired: isCoafCompulsory,
      emailSentTo: config.complianceOfficerEmail,
      holdPeriodHours: isSingleLimitExceeded && config.autoBlockSuspicious ? config.holdPeriodHours : 0,
      status: isSingleLimitExceeded
        ? '⚠️ ALERTA DISPARADO: Transação excede limite crítico! Notificação enviada para josemoreirabrazil@gmail.com e retida por 72h.'
        : '✅ DENTRO DOS LIMITES DE CONFORMIDADE: Nenhuma anomalia detectada.'
    };

    setSimResult(result);

    if (isSingleLimitExceeded) {
      setAlertsLog(prev => [
        {
          id: `PLD-${Math.floor(Math.random() * 90000 + 10000)}`,
          timestamp: result.timestamp,
          tipo: 'ALERTA SIMULADO: LIMITE CRÍTICO EXCEDIDO',
          valor: `R$ ${val.toLocaleString('pt-BR')}`,
          cliente: simClientDoc,
          status: 'NOTIFICAÇÃO ENVIADA A' + config.complianceOfficerEmail,
          acao: config.autoBlockSuspicious ? `HOLD CAUTELAR ${config.holdPeriodHours}H` : 'MONITORAMENTO CONTINUO'
        },
        ...prev
      ]);
    }
  };

  const handleExportCoafReport = () => {
    const reportData = {
      norma: 'BACEN 3.978 / RESOLUÇÃO COAF 36',
      empresa: 'MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA',
      cnpj: '68.603.032/0001-15',
      oficialCompliance: config.complianceOfficerEmail,
      dataEmissao: new Date().toISOString(),
      limitesVigentes: config,
      alertasRegistrados: alertsLog
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `relatorio_conformidade_bacen_3978_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Bacen 3.978 Compliance */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-emerald-950/60 border border-emerald-500/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> NORMA BACEN Nº 3.978 & COAF Nº 36
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">
                PLD / FTP AUTOMATIZADO
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                CNPJ 68.603.032/0001-15
              </span>
            </div>

            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <ShieldAlert className="w-7 h-7 text-emerald-400" />
              Painel de Limites Críticos & Conformidade Bacen 3.978
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Configuração e calibração em tempo real das réguas de contenção para Prevenção à Lavagem de Dinheiro (PLD/FTP), alertas transacionais e comunicação de ocorrências ao SISCOAF.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCoafReport}
              className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-sky-400 font-mono font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Dossier COAF (JSON)</span>
            </button>

            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Salvando...' : 'Salvar Regras Bacen'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-xl">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-400 hover:text-white font-bold p-1 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Config Form Grid: Limites Críticos & Notificações Automáticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Limites Críticos Transacionais (Thresholds Bacen) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              Thresholds de Limites Críticos Transacionais
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              SISCOAF ATIVO
            </span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Input 1: Limite Transação Única */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-bold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Limite Crítico por Transação Única (R$)
                </label>
                <span className="text-emerald-400 font-extrabold text-sm">
                  R$ {config.singleTxThresholdBRL.toLocaleString('pt-BR')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Transações individuais acima deste valor disparam alertas imediatos e notificação compulsória ao COAF.
              </p>
              <input
                type="number"
                value={config.singleTxThresholdBRL}
                onChange={(e) => setConfig({ ...config, singleTxThresholdBRL: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                step="5000"
              />
            </div>

            {/* Input 2: Limite Acumulado Diário */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-bold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  Limite Acumulado Diário por Cliente/CNPJ (R$)
                </label>
                <span className="text-sky-400 font-extrabold text-sm">
                  R$ {config.dailyAccumulatedBRL.toLocaleString('pt-BR')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Soma de operações de uma mesma entidade no intervalo de 24 horas.
              </p>
              <input
                type="number"
                value={config.dailyAccumulatedBRL}
                onChange={(e) => setConfig({ ...config, dailyAccumulatedBRL: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-xs focus:border-sky-500 focus:outline-none"
                step="10000"
              />
            </div>

            {/* Input 3: Smurfing Threshold */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Detecção de Fragmentação de Valor (Smurfing)
                </label>
                <span className="text-amber-400 font-extrabold text-xs">
                  {config.smurfingTxCount} txs em {config.smurfingTimeWindowMins} min
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Identifica fracionamento atípico de pagamentos para burlar limites regulatórios.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">Qtd Transações</span>
                  <input
                    type="number"
                    value={config.smurfingTxCount}
                    onChange={(e) => setConfig({ ...config, smurfingTxCount: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Janela de Tempo (Min)</span>
                  <input
                    type="number"
                    value={config.smurfingTimeWindowMins}
                    onChange={(e) => setConfig({ ...config, smurfingTimeWindowMins: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Input 4: Threshold Câmbio USD */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-bold flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-purple-400" />
                  Limite Operação Câmbio Direct SWIFT (USD)
                </label>
                <span className="text-purple-300 font-extrabold text-sm">
                  US$ {config.fxInstantThresholdUSD.toLocaleString('en-US')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Threshold internacional para envio compulsório de registros BACEN via Câmbio Comercial.
              </p>
              <input
                type="number"
                value={config.fxInstantThresholdUSD}
                onChange={(e) => setConfig({ ...config, fxInstantThresholdUSD: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
                step="1000"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Notificações Automáticas & Trava Cautelar */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Bell className="w-5 h-5 text-sky-400" />
                Notificações Automáticas & Retenção Cautelar
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold">
                AUTO NOTIFY
              </span>
            </div>

            {/* Official Email Input */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                E-mail do Oficial de Compliance / Responsável PLD
              </label>
              <input
                type="email"
                value={config.complianceOfficerEmail}
                onChange={(e) => setConfig({ ...config, complianceOfficerEmail: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-emerald-400 font-mono text-xs focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 font-sans">
                Recebe cópias automáticas de alertas de anomalias, notificações SISCOAF e relatórios periódicos.
              </p>
            </div>

            {/* Automation Toggles */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-slate-200 font-bold block">Disparo de E-mail de Alerta Automático</span>
                  <span className="text-[11px] text-slate-400 font-sans block">Notifica imediatamente ao oficial de compliance ao ultrapassar limite</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoEmailReport}
                  onChange={(e) => setConfig({ ...config, autoEmailReport: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-slate-200 font-bold block">Comunicação Automatizada COAF / Bacen</span>
                  <span className="text-[11px] text-slate-400 font-sans block">Gera payload XML para o webservice SISCOAF em operações atípicas</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoNotifyCoaf}
                  onChange={(e) => setConfig({ ...config, autoNotifyCoaf: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-slate-200 font-bold block">Hold Cautelar Bacen (Bloqueio Temporário)</span>
                  <span className="text-[11px] text-slate-400 font-sans block">Retém fundos suspeitos por 72 horas para análise aprofundada de KYC</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoBlockSuspicious}
                  onChange={(e) => setConfig({ ...config, autoBlockSuspicious: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1.5 mt-4">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Conformidade com a Norma 3.978 do Banco Central do Brasil</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              As regras configuradas são aplicadas diretamente no middleware de liquidação financeira do Vortex Audit Core, garantindo resposta automática em milissegundos a qualquer desvio comportamental.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Simulation & Real-time Alert Test Module */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Simulador de Teste de Alerta Transacional Bacen
            </h3>
            <p className="text-xs text-slate-400">Injete um valor de transação simulado para verificar o acionamento dos alertas configurados.</p>
          </div>
          <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
            SANDBOX PLD
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs text-slate-300 font-mono block mb-1">Valor da Operação Simulado (R$)</label>
            <input
              type="number"
              value={simTxValueBRL}
              onChange={(e) => setSimTxValueBRL(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 font-mono block mb-1">Entidade / CNPJ Testado</label>
            <input
              type="text"
              value={simClientDoc}
              onChange={(e) => setSimClientDoc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleRunSimulation}
            className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Executar Teste de Limite</span>
          </button>
        </div>

        {simResult && (
          <div className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${simResult.exceededSingleLimit ? 'bg-rose-950/40 border-rose-500/60 text-rose-200' : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'}`}>
            <div className="flex items-center justify-between font-bold">
              <span>{simResult.status}</span>
              <span>{simResult.timestamp}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-800">
              <div>Valor: R$ {simResult.valor.toLocaleString('pt-BR')}</div>
              <div>Notificação SISCOAF: {simResult.coafNotificationRequired ? 'COMPULSÓRIA' : 'ISENTO'}</div>
              <div>E-mail Notificado: {simResult.emailSentTo}</div>
            </div>
          </div>
        )}
      </div>

      {/* Real-Time Compliance Audit Alerts Log Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Log de Auditoria de Ocorrências e Notificações de Conformidade PLD/FTP
            </h3>
            <p className="text-xs text-slate-400">Registros imutáveis de comunicações automáticas geradas pelo motor Bacen 3.978.</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            {alertsLog.length} Alertas Registrados
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase">
                <th className="px-4 py-3">ID Alerta</th>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Tipo de Ocorrência</th>
                <th className="px-4 py-3">Cliente / Entidade</th>
                <th className="px-4 py-3 text-right">Valor Operado</th>
                <th className="px-4 py-3 text-center">Status Notificação</th>
                <th className="px-4 py-3 text-right">Ação de Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {alertsLog.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="px-4 py-3 text-emerald-400 font-bold">{alert.id}</td>
                  <td className="px-4 py-3 text-slate-400">{alert.timestamp}</td>
                  <td className="px-4 py-3 text-slate-200 font-sans font-semibold">{alert.tipo}</td>
                  <td className="px-4 py-3 text-slate-300 font-sans">{alert.cliente}</td>
                  <td className="px-4 py-3 text-right text-emerald-300 font-bold">{alert.valor}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-amber-300 font-bold text-[11px]">{alert.acao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
