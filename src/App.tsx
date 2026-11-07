import React, { useEffect, useState } from 'react';
import { Shield, TrendingUp, ShieldCheck, Lock, BellRing, FileCode2, Activity, Coins, Globe2, QrCode } from 'lucide-react';
import { COMPANY_INFO } from './config/company.ts';
import { AdminMasterPanel, TabType } from './components/AdminMasterPanel.tsx';
import { GlobalSystemOperationalStatus } from './components/GlobalSystemOperationalStatus.tsx';
import { DeployStatusMonitor } from './components/DeployStatusMonitor.tsx';

interface AuditLog {
  id: string;
  transactionId: string;
  action: string;
  newState: any;
  timestamp: string;
  actor: string;
}

export default function App() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [_loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('revenue');

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        return;
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (error) {
      console.warn('Logs de auditoria temporariamente indisponíveis:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Header Contract */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
              Vortex Audit Core <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">v3.978</span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">Sistema FinTech 24/7/365 & Auditoria Forense SEFAZ/Bacen</p>
          </div>
        </div>
        
        {/* Interactive Top Navbar buttons for direct tab switching */}
        <nav className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Visão Geral</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('revenue')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'revenue'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Faturamento & DRE</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'clients'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                : 'text-sky-400 bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Clientes Globais (2.8M+)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('checkout')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'checkout'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                : 'text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Checkout Pix MP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'security'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>SOC Defesa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compliance')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'compliance'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                : 'text-purple-300 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Bacen 3.978 PLD</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                : 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Auditoria & Backup AES-256</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'alerts'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Alertas Bacen</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoice')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'invoice'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Invoice SEFAZ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fx')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'fx'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Câmbio</span>
          </button>
        </nav>

        {/* Sinal Verde Operacional 100% Sem Falhas & 24/7/365 */}
        <div className="flex items-center gap-2">
          <DeployStatusMonitor compact />
          <GlobalSystemOperationalStatus compact onOpenGlobalClients={() => setActiveTab('clients')} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
        {/* Banner de Status de Deploy Vercel & Local */}
        <DeployStatusMonitor />

        {/* Banner de Sinal Verde Operacional e Faturamento Ininterrupto */}
        <GlobalSystemOperationalStatus onOpenGlobalClients={() => setActiveTab('clients')} />

        {/* Global Admin Master Control Center */}
        <AdminMasterPanel logs={logs} onRefreshLogs={fetchLogs} activeTab={activeTab} onTabChange={setActiveTab} />
      </main>

      <footer className="max-w-7xl mx-auto p-8 border-t border-slate-900 text-slate-600 text-[10px] flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <p className="font-bold text-slate-400 mb-1">{COMPANY_INFO.name}</p>
          <p>CNPJ: {COMPANY_INFO.cnpj} · {COMPANY_INFO.address.city}, {COMPANY_INFO.address.state}</p>
          <p className="mt-1 opacity-50">{COMPANY_INFO.address.street}, {COMPANY_INFO.address.number} - {COMPANY_INFO.address.neighborhood}</p>
          <p className="mt-1 text-emerald-500 font-mono font-semibold">⚡ Operação Contínua 24/7/365 Dias por Ano (Garantia SLA 99,999%)</p>
        </div>
        <div className="flex flex-wrap gap-6 uppercase tracking-widest font-semibold">
          <button onClick={() => setActiveTab('compliance')} className="hover:text-emerald-400 transition-colors">Privacidade & CNPJ</button>
          <button onClick={() => setActiveTab('fx')} className="hover:text-emerald-400 transition-colors">Conformidade BACEN</button>
          <button onClick={() => setActiveTab('alerts')} className="hover:text-emerald-400 transition-colors">Norma Bacen 3.978</button>
          <button onClick={() => setActiveTab('overview')} className="hover:text-sky-400 transition-colors font-mono">24/7/365 SLA 99.999%</button>
        </div>
      </footer>
    </div>
  );
}

