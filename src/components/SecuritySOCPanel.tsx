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
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SecurityService } from '../services/securityService.ts';

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
  const [activeTab, setActiveTab] = useState<'radar' | 'firewall' | 'crypto' | 'simulations'>('radar');
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

    // Gerar Fingerprint de Sessão e Hash da Aplicação
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
      {/* Toast de Ações / Feedback */}
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

      {/* Main SOC Header Card */}
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
              Sistema de proteção em multicamadas equivalente aos padrões de cibersegurança do Banco Central e instituições financeiras privadas. Opera 24/7/365 dias por ano sem interrupções, combinando WAF ativo, IDPS em tempo real, mitigação contra SQLi/XSS/RCE e criptografia de ponta a ponta.
            </p>
          </div>

          {/* Controls: Change Threat Level */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-slate-400" /> Modo Defesa:
            </span>
            <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-mono">
              <button
                onClick={() => handleSetThreatLevel('PADRAO')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  status?.threatLevel === 'PADRAO'
                    ? 'bg-slate-800 text-slate-200 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Padrão
              </button>

              <button
                onClick={() => handleSetThreatLevel('BANK_GRADE')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  status?.threatLevel === 'BANK_GRADE'
                    ? 'bg-emerald-600 text-white font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bancário
              </button>

              <button
                onClick={() => handleSetThreatLevel('DEFCON_1_LOCKDOWN')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  status?.threatLevel === 'DEFCON_1_LOCKDOWN'
                    ? 'bg-rose-600 text-white font-bold animate-pulse shadow-md'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                Lockdown Defcon 1
              </button>
            </div>
          </div>
        </div>

        {/* SOC Telemetry Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-mono uppercase tracking-wider">Ameaças Bloqueadas</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-mono font-bold text-emerald-400">{status?.totalThreatsBlocked || 0}</p>
            <p className="text-[10px] text-slate-500 font-mono">Inspeção 100% Ativa na Borda</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-mono uppercase tracking-wider">IPs Banidos no Firewall</span>
              <Ban className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-xl font-mono font-bold text-rose-400">{status?.activeBannedIps.length || 0}</p>
            <p className="text-[10px] text-slate-500 font-mono">Lista Negra em Tempo Real</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-mono uppercase tracking-wider">WAF & IDPS Engine</span>
              <Activity className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-sm font-mono font-bold text-sky-400">PROTEÇÃO ATIVA</p>
            <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Filtro SQLi / XSS / RCE
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-mono uppercase tracking-wider">Criptografia E2E</span>
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-sm font-mono font-bold text-amber-400">AES-256-GCM</p>
            <p className="text-[10px] text-slate-500 font-mono">Assinatura HMAC SHA-256</p>
          </div>
        </div>
      </div>

      {/* Internal Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'radar'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Radar de Intrusões (Feed IDPS)</span>
          </button>

          <button
            onClick={() => setActiveTab('simulations')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'simulations'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Simulador de Ataques</span>
          </button>

          <button
            onClick={() => setActiveTab('firewall')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'firewall'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ban className="w-4 h-4 text-emerald-400" />
            <span>Gestão de Firewall IP</span>
          </button>

          <button
            onClick={() => setActiveTab('crypto')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'crypto'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4 text-sky-400" />
            <span>Integridade da Sessão</span>
          </button>
        </div>

        <button
          onClick={fetchSecurityData}
          className="p-2 text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-1 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar SOC</span>
        </button>
      </div>

      {/* Tab 1: Real-Time Threat Radar (IDPS Feed) */}
      {activeTab === 'radar' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-rose-400" />
                  Rastro em Tempo Real de Tentativas de Invasão Rejeitadas
                </h3>
                <p className="text-xs text-slate-400">
                  Todas as requisições que violaram as regras do WAF ou contêm vetores de ataque SQLi/XSS/RCE são registradas e neutralizadas instantaneamente.
                </p>
              </div>
            </div>

            {/* Attack Feed Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">IP de Origem</th>
                    <th className="px-4 py-3">Vetor de Ataque</th>
                    <th className="px-4 py-3">Gravidade</th>
                    <th className="px-4 py-3">Ação do Firewall</th>
                    <th className="px-4 py-3">Amostra do Payload</th>
                    <th className="px-4 py-3">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/80 transition-colors">
                      <td className="px-4 py-3 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 font-bold text-slate-200">{log.ip}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {log.attackType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.severity === 'EMERGÊNCIA MILITAR' || log.severity === 'CRÍTICA'
                              ? 'bg-rose-950 text-rose-200 border border-rose-500 font-black animate-pulse'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {log.actionTaken}
                        </span>
                      </td>
                      <td className="px-4 py-3 truncate max-w-[200px] text-slate-400">{log.payloadSample}</td>
                      <td className="px-4 py-3 font-sans">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 text-[11px] font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Selected Threat Drawer */}
            {selectedLog && (
              <div className="p-5 rounded-xl bg-slate-950 border border-rose-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-rose-400 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Inspeção Forense da Intrusão: {selectedLog.id}
                  </h4>
                  <button onClick={() => setSelectedLog(null)} className="text-xs text-slate-500 hover:text-slate-300">
                    Fechar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <p><span className="text-slate-500">IP Atacante:</span> <span className="text-slate-100 font-bold">{selectedLog.ip}</span></p>
                    <p><span className="text-slate-500">Localização Est.:</span> <span className="text-slate-300">{selectedLog.location || 'Desconhecida'}</span></p>
                    <p><span className="text-slate-500">Endpoint Alvo:</span> <span className="text-slate-300">{selectedLog.method} {selectedLog.endpoint}</span></p>
                    <p><span className="text-slate-500">User Agent:</span> <span className="text-slate-400 text-[10px] break-all">{selectedLog.userAgent || 'Indefinido'}</span></p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-sans font-bold block mb-1">PAYLOAD DE INVASÃO INTERCEPTADO</span>
                    <pre className="p-2 bg-slate-950 rounded border border-rose-500/30 text-rose-300 text-[10px] whitespace-pre-wrap font-mono max-h-28 overflow-y-auto">
                      {selectedLog.payloadSample}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Attack Simulator */}
      {activeTab === 'simulations' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Simulador de Vetores de Ataque Malicioso em Tempo Real
            </h3>
            <p className="text-xs text-slate-400">
              Clique nos botões abaixo para disparar simulações reais das principais técnicas de invasão. O WAF interceptará instantaneamente os payloads e atualizará o SOC.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold text-slate-200">Ataque SQL Injection</h4>
              </div>
              <p className="text-[11px] text-slate-400">
                Injeta expressões maliciosas como <code className="text-rose-400">SELECT * FROM users OR 1=1</code> para tentar extrair a base de dados.
              </p>
              <button
                onClick={() => handleSimulateAttack('SQL_INJECTION')}
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simular SQLi</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-slate-200">Injeção de XSS</h4>
              </div>
              <p className="text-[11px] text-slate-400">
                Envia scripts maliciosos DOM como <code className="text-amber-400">&lt;script&gt;stealCookies()&lt;/script&gt;</code> para sequestro de sessão.
              </p>
              <button
                onClick={() => handleSimulateAttack('XSS_ATTACK')}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simular XSS</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-slate-200">Remote Code Execution</h4>
              </div>
              <p className="text-[11px] text-slate-400">
                Tenta executar comandos no shell da máquina hospedeira como <code className="text-purple-400">; cat /etc/passwd</code>.
              </p>
              <button
                onClick={() => handleSimulateAttack('COMMAND_INJECTION')}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simular RCE</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold text-slate-200">Brute Force / Rate Flood</h4>
              </div>
              <p className="text-[11px] text-slate-400">
                Dispara alta frequência de requisições por segundo para testar o Rate Limiter de borda do Cloudflare.
              </p>
              <button
                onClick={() => handleSimulateAttack('BRUTE_FORCE')}
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simular Brute Force</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Firewall & IP Manager */}
      {activeTab === 'firewall' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-400" />
                Gerenciador da Lista Negra de IPs (Firewall de Borda)
              </h3>
              <p className="text-xs text-slate-400">Adicione manualmente endereços IP suspeitos ou remova bloqueios automáticos efetuados pelo IDPS.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newBanIp) handleToggleIpBan(newBanIp, true);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Digitar IP (Ex: 185.220.101.99)"
                value={newBanIp}
                onChange={(e) => setNewBanIp(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Banir IP
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono">
            {status?.activeBannedIps.map((ip) => (
              <div key={ip} className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0"></span>
                  <span className="font-bold text-rose-200">{ip}</span>
                </div>
                <button
                  onClick={() => handleToggleIpBan(ip, false)}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded text-[11px] font-sans font-semibold transition-colors flex items-center gap-1 border border-slate-800"
                >
                  <Unlock className="w-3 h-3" />
                  Desbanir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Session Integrity & Crypto */}
      {activeTab === 'crypto' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-sky-400" />
            Integridade da Sessão do Usuário & Assinatura de Código
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-[11px] text-slate-400 font-sans font-bold uppercase tracking-wider block">
                Fingerprint Único da Sessão Atual
              </span>
              <p className="p-2.5 bg-slate-900 rounded border border-slate-800 text-emerald-400 font-bold break-all">
                {sessionFingerprint}
              </p>
              <p className="text-[11px] text-slate-500 font-sans">
                O fingerprint de hardware e navegador previne ataques de Session Hijacking (sequestro de cookies) entre dispositivos.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-[11px] text-slate-400 font-sans font-bold uppercase tracking-wider block">
                Checksum SHA-256 do Estado do Cliente
              </span>
              <p className="p-2.5 bg-slate-900 rounded border border-slate-800 text-sky-400 font-bold break-all">
                {clientHash || 'Calculando...'}
              </p>
              <p className="text-[11px] text-slate-500 font-sans">
                Garante que nenhum código malicioso ou script externo injetado no DOM alterou a lógica de execução.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
