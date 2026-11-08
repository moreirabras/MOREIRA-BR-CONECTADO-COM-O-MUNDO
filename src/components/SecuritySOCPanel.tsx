import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Zap,
  Activity,
  AlertTriangle,
  Terminal,
  Radio,
  Eye,
  Trash2,
  Plus,
  RefreshCw,
  Cpu,
  KeyRound,
  FileCode2,
  Server,
  Crosshair,
  Unlock,
  Ban,
  CheckCircle2,
  Siren,
  Sliders,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SecurityService } from '../services/securityService.ts';
import { BankTokenManager } from './BankTokenManager.tsx';

interface SecurityThreatLog {
  id: string;
  timestamp: string;
  ip: string;
  attackType: 'SQL_INJECTION' | 'XSS_ATTACK' | 'COMMAND_INJECTION' | 'PATH_TRAVERSAL' | 'BRUTE_FORCE' | 'PROTOTYPE_POLLUTION' | 'SESSION_HIJACK_ATTEMPT';
  severity: 'MÉDIA' | 'ALTA' | 'CRÍTICA' | 'EMERGÊNCIA MILITAR';
  endpoint: string;
  method: string;
  payloadSample: string;
  actionTaken: 'BLOQUEADO_NA_BORDA' | 'IP_BANIDO_AUTOMATICAMENTE' | 'DESVIADO_PARA_HONEYPOT' | 'CHALLENGE_CAPTCHA';
  location?: string;
  userAgent?: string;
}

interface SecurityStatus {
  threatLevel: 'PADRAO' | 'ELEVADO' | 'BANK_GRADE' | 'DEFCON_1_LOCKDOWN';
  activeBannedIps: string[];
  totalThreatsBlocked: number;
  lastAttackTimestamp?: string;
  isWafActive: boolean;
  isIdpsActive: boolean;
  isE2eEncryptionActive: boolean;
  isAntiTamperActive: boolean;
  blockedCountsByType: Record<string, number>;
}

export const SecuritySOCPanel: React.FC = () => {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [logs, setLogs] = useState<SecurityThreatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SecurityThreatLog | null>(null);
  const [newBanIp, setNewBanIp] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'radar' | 'firewall' | 'crypto' | 'simulations' | 'bank_token'>('radar');
  const [sessionFingerprint, setSessionFingerprint] = useState('');
  const [clientHash, setClientHash] = useState('');

  const fetchSecurityData = async () => {
    try {
      const resStats = await fetch('/api/security/stats');
      const statsContentType = resStats.headers.get('content-type') || '';
      if (resStats.ok && statsContentType.includes('application/json')) {
        const data = await resStats.json();
        setStatus(data);
      }

      const resLogs = await fetch('/api/security/logs');
      const logsContentType = resLogs.headers.get('content-type') || '';
      if (resLogs.ok && logsContentType.includes('application/json')) {
        const data = await resLogs.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Falha ao obter dados do SOC:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 4000);

    setSessionFingerprint(SecurityService.generateSessionFingerprint());
    SecurityService.calculateSha256(window.location.href + Date.now().toString()).then(setClientHash);

    return () => clearInterval(interval);
  }, []);

  const handleSimulateAttack = async (type: string) => {
    try {
      setFeedback('⚡ Disparando simulação de intrusão bancária...');
      const res = await fetch('/api/security/simulate-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(`🛡️ [DEFESA ATIVA] Invasão '${type}' detectada e neutralizada! Ação: ${data.attack.actionTaken}`);
        fetchSecurityData();
      }
    } catch {
      setFeedback('❌ Erro ao enviar simulação.');
    }
  };

  const handleSetThreatLevel = async (level: string) => {
    try {
      const res = await fetch('/api/security/threat-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level })
      });
      if (res.ok) {
        setFeedback(`🚨 Nível de segurança do sistema alterado para: ${level}`);
        fetchSecurityData();
      }
    } catch {
      setFeedback('❌ Falha ao alterar nível de segurança.');
    }
  };

  const handleToggleIpBan = async (ip: string, ban: boolean) => {
    try {
      const res = await fetch('/api/security/ban-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, ban })
      });
      if (res.ok) {
        setFeedback(ban ? `⛔ IP ${ip} adicionado à Lista Negra do Firewall.` : `✅ IP ${ip} removido da Lista Negra.`);
        setNewBanIp('');
        fetchSecurityData();
      }
    } catch {
      setFeedback('❌ Erro na operação de IP no Firewall.');
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-200 font-bold text-xs ml-4">
            FECHAR
          </button>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-slate-950 border-2 border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                <Siren className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                SOC MILITAR & MONITORAÇÃO CONTÍNUA 24/7/365 DIAS
              </span>

              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40">
                SLA CONTINUIDADE 99,999% (ZERO DOWN)
              </span>

              {status?.threatLevel === 'DEFCON_1_LOCKDOWN' && (
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-600 text-white animate-bounce shadow-lg shadow-rose-900/50">
                  LOCKDOWN MILITAR ATIVO (DEFCON 1)
                </span>
              )}

              {status?.threatLevel === 'BANK_GRADE' && (
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  PROTEÇÃO NÍVEL BANCÁRIO BRASIL (AES-256 + HMAC)
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-7 h-7 text-rose-500" />
              Escudo de Segurança Militar & Anti-Invasão Bancária 24/7/365
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl">
              Sistema de proteção em multicamadas equivalente aos padrões de cibersegurança do Banco Central e instituições financeiras privadas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-slate-400" /> Modo Defesa:
            </span>
            <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-mono">
              <button
                onClick={() => handleSetThreatLevel('PADRAO')}
                className={`px-3 py-1.5 rounded-lg transition-all ${status?.threatLevel === 'PADRAO' ? 'bg-slate-800 text-slate-200 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Padrão
              </button>
              <button
                onClick={() => handleSetThreatLevel('BANK_GRADE')}
                className={`px-3 py-1.5 rounded-lg transition-all ${status?.threatLevel === 'BANK_GRADE' ? 'bg-emerald-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Bancário
              </button>
              <button
                onClick={() => handleSetThreatLevel('DEFCON_1_LOCKDOWN')}
                className={`px-3 py-1.5 rounded-lg transition-all ${status?.threatLevel === 'DEFCON_1_LOCKDOWN' ? 'bg-rose-600 text-white font-bold animate-pulse shadow-md' : 'text-slate-400 hover:text-rose-400'}`}
              >
                Lockdown Defcon 1
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'radar' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Radar de Intrusões</span>
          </button>
          <button
            onClick={() => setActiveTab('simulations')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'simulations' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Simulador de Ataques</span>
          </button>
          <button
            onClick={() => setActiveTab('firewall')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'firewall' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Ban className="w-4 h-4 text-emerald-400" />
            <span>Gestão de Firewall IP</span>
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'crypto' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <KeyRound className="w-4 h-4 text-sky-400" />
            <span>Integridade da Sessão</span>
          </button>
          <button
            onClick={() => setActiveTab('bank_token')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'bank_token' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Key className="w-4 h-4 text-sky-400" />
            <span>Gestão Token Bancário</span>
          </button>
        </div>
      </div>

      {activeTab === 'radar' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
             {/* IDPS Feed Table would go here */}
        </div>
      )}

      {activeTab === 'simulations' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
             {/* Simulator would go here */}
        </div>
      )}

      {activeTab === 'firewall' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
             {/* Firewall management would go here */}
        </div>
      )}

      {activeTab === 'crypto' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
             {/* Crypto/Session integrity would go here */}
        </div>
      )}

      {activeTab === 'bank_token' && (
        <BankTokenManager />
      )}
    </div>
  );
};
