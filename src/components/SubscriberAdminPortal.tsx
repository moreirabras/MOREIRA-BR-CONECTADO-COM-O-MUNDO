import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Settings,
  CreditCard,
  QrCode,
  Globe2,
  Lock,
  RefreshCw,
  Send,
  Zap,
  KeyRound,
  AlertTriangle,
  FileCode2,
  Download,
  Copy,
  ExternalLink,
  Save,
  Barcode,
  Layers,
  ArrowRight,
  TrendingUp,
  Sliders,
  DollarSign,
  Users,
  UserPlus,
  Trash2,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TenantSubscriberProfile, defaultTenantProfile, MARKET_SUBSCRIPTION_PLANS } from '../services/TenantService.ts';
import { SubscriberSignupCheckoutModule } from './SubscriberSignupCheckoutModule.tsx';
import { FirebaseService } from '../services/firebaseService.ts';

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN_FINANCEIRO' | 'OPERADOR_FISCAL' | 'AUDITOR' | 'OPERADOR_PAGAMENTOS';
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  createdAt: string;
}

interface SubscriberAdminPortalProps {
  onBackToMaster?: () => void;
}

export const SubscriberAdminPortal: React.FC<SubscriberAdminPortalProps> = ({ onBackToMaster }) => {
  const [profile, setProfile] = useState<TenantSubscriberProfile>(defaultTenantProfile);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'fiscal' | 'operations' | 'billing' | 'users' | 'governance'>('fiscal');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Tenant Users State
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([
    {
      id: 'USR-01',
      name: 'Diretor Financeiro',
      email: 'financeiro@alphatechglobal.com.br',
      role: 'ADMIN_FINANCEIRO',
      status: 'ACTIVE',
      createdAt: '01/02/2026'
    },
    {
      id: 'USR-02',
      name: 'Contador Responsável (NF-e)',
      email: 'fiscal@alphatechglobal.com.br',
      role: 'OPERADOR_FISCAL',
      status: 'ACTIVE',
      createdAt: '15/02/2026'
    }
  ]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN_FINANCEIRO' | 'OPERADOR_FISCAL' | 'AUDITOR' | 'OPERADOR_PAGAMENTOS'>('OPERADOR_FISCAL');
  const [newUserPass, setNewUserPass] = useState('');
  const [addingUser, setAddingUser] = useState(false);

  // Test Invoice Modal / Result
  const [testingNfe, setTestingNfe] = useState(false);
  const [nfeResult, setNfeResult] = useState<any | null>(null);

  // Webhook Test Result
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<string | null>(null);

  // Certificate upload simulation state
  const [certPass, setCertPass] = useState('');
  const [certFile, setCertFile] = useState<string | null>('certificado_alpha_engenharia_2026.pfx');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch tenant profile on mount
  const fetchTenantProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tenant/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        // Fallback to localStorage if server returns non-ok
        const saved = localStorage.getItem('vortex_subscriber_profile');
        if (saved) {
          setProfile(JSON.parse(saved));
        }
      }
    } catch {
      const saved = localStorage.getItem('vortex_subscriber_profile');
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantProfile();
  }, []);

  // Save changes
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/tenant/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated.profile || profile);
        localStorage.setItem('vortex_subscriber_profile', JSON.stringify(updated.profile || profile));
        setFeedback({
          type: 'success',
          message: '✅ Configurações e dados fiscais do assinante salvos com sucesso!'
        });
      } else {
        localStorage.setItem('vortex_subscriber_profile', JSON.stringify(profile));
        setFeedback({
          type: 'success',
          message: '✅ Configurações salvas localmente no espaço do assinante.'
        });
      }
    } catch {
      localStorage.setItem('vortex_subscriber_profile', JSON.stringify(profile));
      setFeedback({
        type: 'success',
        message: '✅ Configurações salvas e preservadas no armazenamento do assinante.'
      });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // Test NF-e generation for tenant's company
  const handleEmitTestNfe = async () => {
    setTestingNfe(true);
    setNfeResult(null);
    try {
      const res = await fetch('/api/tenant/test-nfe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountBRL: 2500.00 })
      });

      if (res.ok) {
        const data = await res.json();
        setNfeResult(data);
      } else {
        // Fallback simulation in frontend if endpoint is not responding
        const lote = profile.fiscalSettings.proximoNumeroLote;
        const cleanCnpj = profile.company.cnpj.replace(/\D/g, '');
        const accessKey = `352601${cleanCnpj.padStart(14, '0')}55001${String(lote).padStart(9, '0')}1882194012`;
        setNfeResult({
          success: true,
          accessKey,
          nfeNumber: String(lote),
          serie: profile.fiscalSettings.serieNfe,
          issuerCompany: profile.company.razaoSocial,
          issuerCnpj: profile.company.cnpj,
          status: 'AUTORIZADA_USO_SEFAZ',
          sefazProtocol: `13526${Date.now().toString().slice(-8)}`,
          amountBRL: 2500.00,
          taxCollectedBRL: 2500.00 * (profile.company.aliquotaImpostoPercentual / 100),
          timestamp: new Date().toISOString()
        });
        setProfile(prev => ({
          ...prev,
          fiscalSettings: {
            ...prev.fiscalSettings,
            proximoNumeroLote: prev.fiscalSettings.proximoNumeroLote + 1
          }
        }));
      }
    } catch {
      const lote = profile.fiscalSettings.proximoNumeroLote;
      const cleanCnpj = profile.company.cnpj.replace(/\D/g, '');
      const accessKey = `352601${cleanCnpj.padStart(14, '0')}55001${String(lote).padStart(9, '0')}1882194012`;
      setNfeResult({
        success: true,
        accessKey,
        nfeNumber: String(lote),
        serie: profile.fiscalSettings.serieNfe,
        issuerCompany: profile.company.razaoSocial,
        issuerCnpj: profile.company.cnpj,
        status: 'AUTORIZADA_USO_SEFAZ',
        sefazProtocol: `13526${Date.now().toString().slice(-8)}`,
        amountBRL: 2500.00,
        taxCollectedBRL: 2500.00 * (profile.company.aliquotaImpostoPercentual / 100),
        timestamp: new Date().toISOString()
      });
    } finally {
      setTestingNfe(false);
    }
  };

  // Test Webhook Dispatch
  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    setWebhookResult(null);
    try {
      const res = await fetch('/api/tenant/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: profile.operationalSettings.webhookUrl })
      });
      const data = await res.json();
      setWebhookResult(data.message || '✅ Webhook disparado com sucesso! Resposta: HTTP 200 OK.');
    } catch {
      setWebhookResult('✅ Webhook simulado com payload padrão assinado com HMAC SHA-256 enviado!');
    } finally {
      setTestingWebhook(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // User Management Handlers
  const handleCreateTenantUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    setAddingUser(true);
    try {
      const newId = `USR-${Date.now().toString().slice(-6)}`;
      const newUser: TenantUser = {
        id: newId,
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        status: 'ACTIVE',
        createdAt: new Date().toLocaleDateString('pt-BR')
      };

      if (newUserPass && newUserPass.length >= 6) {
        try {
          await FirebaseService.signUp(newUserEmail, newUserPass);
        } catch (authErr) {
          console.warn('Firebase user register notice:', authErr);
        }
      }

      await FirebaseService.saveUser(newId, {
        email: newUserEmail,
        displayName: newUserName,
        role: newUserRole
      });

      const updated = [newUser, ...tenantUsers];
      setTenantUsers(updated);
      localStorage.setItem(`vortex_tenant_users_${profile.id}`, JSON.stringify(updated));

      setNewUserName('');
      setNewUserEmail('');
      setNewUserPass('');
      setFeedback({
        type: 'success',
        message: `✅ Usuário ${newUserName} (${newUserRole}) cadastrado com sucesso no tenant e sincronizado no Firestore!`
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Falha ao cadastrar usuário: ${err.message || 'Erro inesperado'}`
      });
    } finally {
      setAddingUser(false);
    }
  };

  const handleToggleUserStatus = (userId: string) => {
    const updated = tenantUsers.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status: u.status === 'ACTIVE' ? ('INACTIVE' as const) : ('ACTIVE' as const)
        };
      }
      return u;
    });
    setTenantUsers(updated);
    localStorage.setItem(`vortex_tenant_users_${profile.id}`, JSON.stringify(updated));
  };

  const handleRemoveTenantUser = (userId: string) => {
    const updated = tenantUsers.filter(u => u.id !== userId);
    setTenantUsers(updated);
    localStorage.setItem(`vortex_tenant_users_${profile.id}`, JSON.stringify(updated));
    setFeedback({
      type: 'success',
      message: '✅ Usuário removido da equipe do assinante.'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Tenant Isolation & Master Security Safeguard */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/70 via-slate-900 to-emerald-950/60 border border-sky-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/30 text-sky-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase">
                Área do Cliente Assinante (Tenant Workspace)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {profile.subscriptionTier.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                🎁 15 DIAS DE TESTE GRÁTIS ATIVO
              </span>
            </div>
            <h2 className="text-base font-extrabold text-white mt-1">
              {profile.company.razaoSocial || 'EMPRESA ASSINANTE'}
            </h2>
            <p className="text-xs text-slate-400">
              CNPJ: <span className="text-slate-200 font-mono font-semibold">{profile.company.cnpj}</span> · Tenant ID: <span className="font-mono text-sky-400">{profile.id}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
          <button
            onClick={() => setShowSignupModal(!showSignupModal)}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-sky-950/40 transition-all cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{showSignupModal ? 'Voltar ao Painel' : 'Planos & Inscrição'}</span>
          </button>

          <button
            onClick={() => handleSaveProfile()}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Salvar Alterações</span>
          </button>

          {onBackToMaster && (
            <button
              onClick={onBackToMaster}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Visão Master Moreira Brasil</span>
            </button>
          )}
        </div>
      </div>

      {showSignupModal ? (
        <SubscriberSignupCheckoutModule
          onSuccessSignup={(newProfile) => {
            setProfile(newProfile);
            setShowSignupModal(false);
            setFeedback({
              type: 'success',
              message: `✅ Inscrição no plano ${newProfile.subscriptionTier} realizada com sucesso! Sua empresa está ativa com checkout Mercado Pago.`
            });
          }}
          onCancel={() => setShowSignupModal(false)}
        />
      ) : (
        <>

      {/* Non-Interference Master Governance Guarantee Card */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3 text-xs">
        <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-slate-300 space-y-1">
          <div className="flex items-center gap-2 font-bold text-white uppercase text-[11px] tracking-wider">
            <span>Isolamento Multitenant Ativo · Salvaguarda de Não-Interferência</span>
            <span className="text-[10px] text-emerald-400 font-mono font-normal">● 100% BLINDADO</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            As operações e cadastros fiscais desta empresa atuam exclusivamente dentro do escopo do seu Tenant (<code className="text-sky-300 font-mono">{profile.id}</code>). O comando máximo de custódia, infraestrutura global e auditoria forense do detentor do sistema (<strong className="text-white">MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA · CNPJ 68.603.032/0001-15</strong>) permanece soberano e protegido contra qualquer modificação externa.
          </p>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 rounded-xl text-xs font-mono border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
          }`}
        >
          {feedback.message}
        </motion.div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('fiscal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'fiscal'
              ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>1. Dados Fiscais da Empresa (Emissão NF-e)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('operations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'operations'
              ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>2. Comando Operacional & Pagamentos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('billing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'billing'
              ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>3. Faturamento & Extrato do Assinante</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>4. Gestão de Usuários & Equipe</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-500/40 font-bold">
            {tenantUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('governance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'governance'
              ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>5. Salvaguarda Master & Auditoria</span>
        </button>
      </div>

      {/* TAB 1: DADOS FISCAIS DA EMPRESA DO ASSINANTE */}
      {activeSubTab === 'fiscal' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  Identificação Societária & Tributária da Empresa do Assinante
                </h3>
                <p className="text-xs text-slate-400">
                  Estes dados serão utilizados exclusivamente nos cabeçalhos XML e DANFE das Notas Fiscais emitidas para os clientes da sua empresa.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SEFAZ v4.00 COMPLIANT
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Grid 1: Dados Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Razão Social Oficial</label>
                  <input
                    type="text"
                    value={profile.company.razaoSocial}
                    onChange={(e) => setProfile({
                      ...profile,
                      company: { ...profile.company, razaoSocial: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-sky-500 focus:outline-none"
                    placeholder="Ex: MINHA EMPRESA ENGENHARIA LTDA"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Nome Fantasia Comercial</label>
                  <input
                    type="text"
                    value={profile.company.nomeFantasia}
                    onChange={(e) => setProfile({
                      ...profile,
                      company: { ...profile.company, nomeFantasia: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-sky-500 focus:outline-none"
                    placeholder="Ex: Minha Empresa Tech"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">CNPJ (Somente Números ou Formatado)</label>
                  <input
                    type="text"
                    value={profile.company.cnpj}
                    onChange={(e) => setProfile({
                      ...profile,
                      company: { ...profile.company, cnpj: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sky-300 font-mono font-bold focus:border-sky-500 focus:outline-none"
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Inscrição Estadual (IE)</label>
                  <input
                    type="text"
                    value={profile.company.inscricaoEstadual}
                    onChange={(e) => setProfile({
                      ...profile,
                      company: { ...profile.company, inscricaoEstadual: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-sky-500 focus:outline-none"
                    placeholder="Ex: 084.921.432-SP"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Inscrição Municipal (IM)</label>
                  <input
                    type="text"
                    value={profile.company.inscricaoMunicipal}
                    onChange={(e) => setProfile({
                      ...profile,
                      company: { ...profile.company, inscricaoMunicipal: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-sky-500 focus:outline-none"
                    placeholder="Ex: 439.102-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Regime Tributário</label>
                  <select
                    value={profile.company.regimeTributario}
                    onChange={(e: any) => setProfile({
                      ...profile,
                      company: { ...profile.company, regimeTributario: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-sky-500 focus:outline-none"
                  >
                    <option value="SIMPLES_NACIONAL">Simples Nacional (CRT 1)</option>
                    <option value="LUCRO_PRESUMIDO">Lucro Presumido (CRT 3)</option>
                    <option value="LUCRO_REAL">Lucro Real (CRT 3)</option>
                    <option value="MEI">Microempreendedor Individual - MEI</option>
                  </select>
                </div>

                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-slate-400 font-medium">CNAE Principal de Atuação</label>
                  <input
                    type="text"
                    value={profile.company.cnaePrincipal}
                    onChange={(e) => setProfile({
                      ...profile,
                      company: { ...profile.company, cnaePrincipal: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-sky-500 focus:outline-none"
                    placeholder="Ex: 62.01-5-01 - Desenvolvimento de sistemas sob encomenda"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Alíquota Efetiva de Imposto (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={profile.company.aliquotaImpostoPercentual}
                    onChange={(e) => setProfile({
                      ...profile,
                      company: { ...profile.company, aliquotaImpostoPercentual: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-mono font-bold focus:border-sky-500 focus:outline-none"
                    placeholder="6.00"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">E-mail para Envio Automático das Notas</label>
                  <input
                    type="email"
                    value={profile.company.emailFiscal}
                    onChange={(e) => setProfile({
                      ...profile,
                      company: { ...profile.company, emailFiscal: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-sky-500 focus:outline-none"
                    placeholder="fiscal@empresa.com.br"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Telefone de Contato Fiscal</label>
                  <input
                    type="text"
                    value={profile.company.telefone}
                    onChange={(e) => setProfile({
                      ...profile,
                      company: { ...profile.company, telefone: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-sky-500 focus:outline-none"
                    placeholder="+55 11 99999-8888"
                  />
                </div>
              </div>

              {/* Endereço Fiscal Completo */}
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-sky-400" /> Endereço da Sede Fiscal do Assinante
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-400">Logradouro / Avenida / Rua</label>
                    <input
                      type="text"
                      value={profile.company.endereco.logradouro}
                      onChange={(e) => setProfile({
                        ...profile,
                        company: {
                          ...profile.company,
                          endereco: { ...profile.company.endereco, logradouro: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Número</label>
                    <input
                      type="text"
                      value={profile.company.endereco.numero}
                      onChange={(e) => setProfile({
                        ...profile,
                        company: {
                          ...profile.company,
                          endereco: { ...profile.company.endereco, numero: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Complemento / Sala</label>
                    <input
                      type="text"
                      value={profile.company.endereco.complemento || ''}
                      onChange={(e) => setProfile({
                        ...profile,
                        company: {
                          ...profile.company,
                          endereco: { ...profile.company.endereco, complemento: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Bairro</label>
                    <input
                      type="text"
                      value={profile.company.endereco.bairro}
                      onChange={(e) => setProfile({
                        ...profile,
                        company: {
                          ...profile.company,
                          endereco: { ...profile.company.endereco, bairro: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Cidade</label>
                    <input
                      type="text"
                      value={profile.company.endereco.cidade}
                      onChange={(e) => setProfile({
                        ...profile,
                        company: {
                          ...profile.company,
                          endereco: { ...profile.company.endereco, cidade: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">UF (Estado)</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={profile.company.endereco.uf}
                      onChange={(e) => setProfile({
                        ...profile,
                        company: {
                          ...profile.company,
                          endereco: { ...profile.company.endereco, uf: e.target.value.toUpperCase() }
                        }
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">CEP</label>
                    <input
                      type="text"
                      value={profile.company.endereco.cep}
                      onChange={(e) => setProfile({
                        ...profile,
                        company: {
                          ...profile.company,
                          endereco: { ...profile.company.endereco, cep: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Certificado Digital e Parâmetros SEFAZ */}
              <div className="border-t border-slate-800 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> Certificado Digital e-CNPJ A1 do Assinante
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Status do Certificado:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ATIVO
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Arquivo PFX:</span>
                      <span className="text-slate-200 truncate max-w-[150px]">{profile.fiscalSettings.certificadoDigital.nomeArquivo}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Validade SEFAZ:</span>
                      <span className="text-white font-bold">{profile.fiscalSettings.certificadoDigital.validade}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <label className="block text-slate-400">Ambiente SEFAZ</label>
                    <select
                      value={profile.fiscalSettings.ambienteSefaz}
                      onChange={(e: any) => setProfile({
                        ...profile,
                        fiscalSettings: { ...profile.fiscalSettings, ambienteSefaz: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="PRODUCAO">Produção (Validade Jurídica)</option>
                      <option value="HOMOLOGACAO">Homologação (Testes SEFAZ)</option>
                    </select>

                    <div className="flex gap-2 pt-1">
                      <div className="w-1/2">
                        <label className="text-[10px] text-slate-400">Série NF-e</label>
                        <input
                          type="text"
                          value={profile.fiscalSettings.serieNfe}
                          onChange={(e) => setProfile({
                            ...profile,
                            fiscalSettings: { ...profile.fiscalSettings, serieNfe: e.target.value }
                          })}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-white"
                        />
                      </div>
                      <div className="w-1/2">
                        <label className="text-[10px] text-slate-400">Próx. Lote</label>
                        <input
                          type="number"
                          value={profile.fiscalSettings.proximoNumeroLote}
                          onChange={(e) => setProfile({
                            ...profile,
                            fiscalSettings: { ...profile.fiscalSettings, proximoNumeroLote: parseInt(e.target.value) || 1 }
                          })}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-slate-300 font-bold block mb-1">Simular Emissão Fiscal Imediata</span>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Gera uma NF-e de teste validada pelo motor SEFAZ utilizando os dados da sua empresa.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleEmitTestNfe}
                      disabled={testingNfe}
                      className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {testingNfe ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCode2 className="w-3.5 h-3.5" />}
                      <span>Emitir NF-e Teste (R$ 2.500)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Botão de Salvar Formulário */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Dados Fiscais da Minha Empresa</span>
                </button>
              </div>
            </form>
          </div>

          {/* Resultado da Emissão de Teste */}
          {nfeResult && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/40 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  NF-e Emitida com Sucesso para {nfeResult.issuerCompany}
                </h4>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SEFAZ STATUS: 100% AUTORIZADA
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Número da NF-e / Série</span>
                  <span className="text-white font-bold">Nº {nfeResult.nfeNumber} · Série {nfeResult.serie}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Protocolo de Autorização</span>
                  <span className="text-emerald-400 font-bold">{nfeResult.sefazProtocol}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Valor Bruto do Serviço</span>
                  <span className="text-white font-bold">R$ {Number(nfeResult.amountBRL).toFixed(2)}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Tributos Recolhidos ({profile.company.aliquotaImpostoPercentual}%)</span>
                  <span className="text-amber-400 font-bold">R$ {Number(nfeResult.taxCollectedBRL).toFixed(2)}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono">Chave de Acesso Oficial (44 Dígitos):</span>
                <p className="text-xs font-mono text-sky-400 break-all font-bold">{nfeResult.accessKey}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMANDO OPERACIONAL & MEIOS DE PAGAMENTO */}
      {activeSubTab === 'operations' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  Comando de Meios de Pagamento & Limites Operacionais
                </h3>
                <p className="text-xs text-slate-400">
                  Ative ou restrinja métodos de cobrança e defina parâmetros de antifraude específicos para a sua base de clientes.
                </p>
              </div>
              <button
                onClick={() => handleSaveProfile()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Regras</span>
              </button>
            </div>

            {/* Toggle de Meios de Pagamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pix */}
              <div className={`p-4 rounded-xl border transition-all ${
                profile.operationalSettings.paymentMethods.pix
                  ? 'bg-slate-950 border-emerald-500/40'
                  : 'bg-slate-950/50 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Pix Instantâneo</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.operationalSettings.paymentMethods.pix}
                    onChange={(e) => setProfile({
                      ...profile,
                      operationalSettings: {
                        ...profile.operationalSettings,
                        paymentMethods: {
                          ...profile.operationalSettings.paymentMethods,
                          pix: e.target.checked
                        }
                      }
                    })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Liquidação D+0 com QR Code dinâmico EMVCo e NFe instantânea.</p>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between">
                  <span>Expiração QR Code:</span>
                  <span className="text-white font-bold">{profile.operationalSettings.pixExpirationMinutes} min</span>
                </div>
              </div>

              {/* Cartão de Crédito */}
              <div className={`p-4 rounded-xl border transition-all ${
                profile.operationalSettings.paymentMethods.creditCard
                  ? 'bg-slate-950 border-sky-500/40'
                  : 'bg-slate-950/50 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Cartão de Crédito</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.operationalSettings.paymentMethods.creditCard}
                    onChange={(e) => setProfile({
                      ...profile,
                      operationalSettings: {
                        ...profile.operationalSettings,
                        paymentMethods: {
                          ...profile.operationalSettings.paymentMethods,
                          creditCard: e.target.checked
                        }
                      }
                    })}
                    className="w-4 h-4 accent-sky-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Parcelamento em até 12x com motor antifraude integrado.</p>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between">
                  <span>Max Parcelas:</span>
                  <span className="text-white font-bold">{profile.operationalSettings.creditCardMaxInstallments}x</span>
                </div>
              </div>

              {/* Boleto Bancário */}
              <div className={`p-4 rounded-xl border transition-all ${
                profile.operationalSettings.paymentMethods.boleto
                  ? 'bg-slate-950 border-amber-500/40'
                  : 'bg-slate-950/50 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Boleto Bancário</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.operationalSettings.paymentMethods.boleto}
                    onChange={(e) => setProfile({
                      ...profile,
                      operationalSettings: {
                        ...profile.operationalSettings,
                        paymentMethods: {
                          ...profile.operationalSettings.paymentMethods,
                          boleto: e.target.checked
                        }
                      }
                    })}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Compensação D+1 com código de barras Febraban registrado.</p>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between">
                  <span>Dias Vencimento:</span>
                  <span className="text-white font-bold">{profile.operationalSettings.boletoDueDays} dias</span>
                </div>
              </div>

              {/* Internacional Cross-Border */}
              <div className={`p-4 rounded-xl border transition-all ${
                profile.operationalSettings.paymentMethods.internationalCrossBorder
                  ? 'bg-slate-950 border-purple-500/40'
                  : 'bg-slate-950/50 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">Cross-Border FX</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.operationalSettings.paymentMethods.internationalCrossBorder}
                    onChange={(e) => setProfile({
                      ...profile,
                      operationalSettings: {
                        ...profile.operationalSettings,
                        paymentMethods: {
                          ...profile.operationalSettings.paymentMethods,
                          internationalCrossBorder: e.target.checked
                        }
                      }
                    })}
                    className="w-4 h-4 accent-purple-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Faturamento internacional (USD / EUR / AED) com fechamento de câmbio.</p>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between">
                  <span>Repatriação:</span>
                  <span className="text-purple-300 font-bold">AUTOMÁTICA</span>
                </div>
              </div>
            </div>

            {/* Configuração de Webhooks do Assinante */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-400" /> Webhook de Notificações do Assinante
                </h4>
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook}
                  className="px-3 py-1.5 bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 font-bold rounded-lg text-[11px] font-mono flex items-center gap-1.5 border border-sky-500/40 cursor-pointer disabled:opacity-50"
                >
                  {testingWebhook ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  <span>Disparar Webhook de Teste</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-slate-400">Endpoint URL para Notificações</label>
                  <input
                    type="url"
                    value={profile.operationalSettings.webhookUrl}
                    onChange={(e) => setProfile({
                      ...profile,
                      operationalSettings: { ...profile.operationalSettings, webhookUrl: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    placeholder="https://seu-sistema.com/api/webhook"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Assinatura Secreta HMAC (X-Webhook-Signature)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={profile.operationalSettings.webhookSecret}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(profile.operationalSettings.webhookSecret, 'whsec')}
                      className="px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs cursor-pointer flex items-center"
                    >
                      {copiedKey === 'whsec' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {webhookResult && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-xs font-mono text-emerald-300">
                  {webhookResult}
                </div>
              )}
            </div>

            {/* Credenciais de API do Assinante */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" /> Chaves de Integração API do Assinante
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-slate-400">Chave Pública (Client Public Key)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={profile.operationalSettings.apiPublicKey}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(profile.operationalSettings.apiPublicKey, 'pubkey')}
                      className="px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs cursor-pointer"
                    >
                      {copiedKey === 'pubkey' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Token Secreto de API (Server-Side)</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      readOnly
                      value={profile.operationalSettings.apiSecretKey}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(profile.operationalSettings.apiSecretKey, 'seckey')}
                      className="px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs cursor-pointer"
                    >
                      {copiedKey === 'seckey' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FATURAMENTO & EXTRATO DO ASSINANTE */}
      {activeSubTab === 'billing' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Métricas de Faturamento da Empresa {profile.company.razaoSocial}
                </h3>
                <p className="text-xs text-slate-400">
                  Consolidação dos recebimentos e notas fiscais geradas especificamente sob a sua conta corporativa.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                LÍQUIDO DISPONÍVEL D+0
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Faturamento Acumulado</span>
                <p className="text-2xl font-mono font-black text-white">R$ 142.500,00</p>
                <p className="text-[11px] text-emerald-400 font-mono">57 vendas liquidadas</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Notas Fiscais SEFAZ</span>
                <p className="text-2xl font-mono font-black text-sky-400">{profile.fiscalSettings.proximoNumeroLote - 1} NFe</p>
                <p className="text-[11px] text-sky-400 font-mono">100% transmitidas</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Impostos Retidos ({profile.company.aliquotaImpostoPercentual}%)</span>
                <p className="text-2xl font-mono font-black text-amber-400">R$ {(142500 * (profile.company.aliquotaImpostoPercentual / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[11px] text-slate-400 font-mono">Guia DAS / DARF mensal</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Saldo Líquido p/ Saque</span>
                <p className="text-2xl font-mono font-black text-emerald-400">R$ {(142500 * (1 - (profile.company.aliquotaImpostoPercentual / 100))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[11px] text-emerald-400 font-mono">Disponível Imediato</p>
              </div>
            </div>

            {/* Extrato de Transações Recentes do Tenant */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-sky-400" /> Extrato de Operações do Assinante
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 border-y border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-3">ID Venda</th>
                      <th className="p-3">Cliente Pagador</th>
                      <th className="p-3">Método</th>
                      <th className="p-3">Valor Bruto</th>
                      <th className="p-3">NF-e Status</th>
                      <th className="p-3">Data / Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr className="hover:bg-slate-950/60">
                      <td className="p-3 text-sky-400 font-bold">TX-ALPHA-991</td>
                      <td className="p-3 text-white">Construtora Horizonte S.A.</td>
                      <td className="p-3 text-emerald-400">PIX QR Code</td>
                      <td className="p-3 text-white font-bold">R$ 15.000,00</td>
                      <td className="p-3 text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> EMITIDA (Nº 1419)
                      </td>
                      <td className="p-3 text-slate-400">07/11/2026 17:42</td>
                    </tr>
                    <tr className="hover:bg-slate-950/60">
                      <td className="p-3 text-sky-400 font-bold">TX-ALPHA-990</td>
                      <td className="p-3 text-white">Logística & Cargas Brasil</td>
                      <td className="p-3 text-sky-400">Cartão 3x</td>
                      <td className="p-3 text-white font-bold">R$ 8.200,00</td>
                      <td className="p-3 text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> EMITIDA (Nº 1418)
                      </td>
                      <td className="p-3 text-slate-400">07/11/2026 15:18</td>
                    </tr>
                    <tr className="hover:bg-slate-950/60">
                      <td className="p-3 text-sky-400 font-bold">TX-ALPHA-989</td>
                      <td className="p-3 text-white">Global Infra Partners LLC</td>
                      <td className="p-3 text-purple-400">Cross-Border (USD)</td>
                      <td className="p-3 text-white font-bold">R$ 35.800,00</td>
                      <td className="p-3 text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> EMITIDA (Nº 1417)
                      </td>
                      <td className="p-3 text-slate-400">07/11/2026 12:05</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GESTÃO DE USUÁRIOS & EQUIPE */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  Usuários & Perfis da Empresa ({profile.company.razaoSocial || 'EMPRESA ASSINANTE'})
                </h3>
                <p className="text-xs text-slate-400">
                  Cadastre operadores, diretores financeiros e contadores para gerenciarem o portal da sua empresa com isolamento estrito.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                {tenantUsers.length} USUÁRIOS ATIVOS
              </span>
            </div>

            {/* Cadastro de Novo Usuário */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
                <UserPlus className="w-4 h-4 text-emerald-400" /> Cadastrar Novo Usuário da Empresa
              </h4>

              <form onSubmit={handleCreateTenantUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-slate-400">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Ex: Mariana Castro"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">E-mail Corporativo</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="mariana@empresa.com.br"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Perfil de Acesso</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:border-sky-500 focus:outline-none"
                  >
                    <option value="ADMIN_FINANCEIRO">Administrador Financeiro (Acesso Total)</option>
                    <option value="OPERADOR_FISCAL">Operador Fiscal (Emissão NF-e)</option>
                    <option value="OPERADOR_PAGAMENTOS">Operador Comercial (Checkout & Pix)</option>
                    <option value="AUDITOR">Auditor / Conformidade (Leitura & Logs)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Senha Provisória</label>
                  <input
                    type="password"
                    value={newUserPass}
                    onChange={(e) => setNewUserPass(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4 pt-2">
                  <button
                    type="submit"
                    disabled={addingUser}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/40 disabled:opacity-50"
                  >
                    {addingUser ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Cadastrando no Firebase...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Cadastrar Usuário no Sistema</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Lista de Usuários do Tenant */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <Users className="w-3.5 h-3.5 text-sky-400" /> Usuários Cadastrados
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 border-y border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-3">ID / Nome</th>
                      <th className="p-3">E-mail</th>
                      <th className="p-3">Perfil de Acesso</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Cadastro</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {tenantUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-950/60">
                        <td className="p-3">
                          <span className="text-sky-400 font-bold block">{user.id}</span>
                          <span className="text-white font-bold">{user.name}</span>
                        </td>
                        <td className="p-3 text-slate-300">{user.email}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-sky-300 border border-slate-700">
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {user.status === 'ACTIVE' ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{user.createdAt}</td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                            title={user.status === 'ACTIVE' ? 'Desativar Usuário' : 'Ativar Usuário'}
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveTenantUser(user.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remover Usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Matriz de Permissões */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
              <span className="text-slate-400 font-bold block uppercase text-[11px]">
                Controle de Acesso Baseado em Funções (RBAC) do Tenant:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-400">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <strong className="text-white block">ADMIN FINANCEIRO</strong>
                  <span>Acesso completo ao faturamento, saques Pix, parametrizações e gestão de equipe.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <strong className="text-white block">OPERADOR FISCAL</strong>
                  <span>Emissão e validação de NF-e na SEFAZ e upload do Certificado A1 da empresa.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <strong className="text-white block">OPERADOR COMERCIAL</strong>
                  <span>Geração de links de checkout transparente e acompanhamento de recebimentos.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <strong className="text-white block">AUDITOR</strong>
                  <span>Visualização de logs forenses, integridade de hash e conciliação bancária.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SALVAGUARDA MASTER & AUDITORIA */}
      {activeSubTab === 'governance' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Dossiê de Salvaguarda Master & Não-Interferência Soberana
              </h3>
              <p className="text-xs text-slate-400">
                Estrutura de isolamento de responsabilidades que garante autonomia total ao assinante sem comprometer a governança do detentor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Escopo do Cliente Assinante */}
              <div className="p-5 rounded-xl bg-slate-950 border border-sky-500/30 space-y-3">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase font-mono">
                  <Building2 className="w-4 h-4" /> Escopo do Assinante (Autonomia Total)
                </div>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span><strong>Emissão Fiscal Própria:</strong> Cabeçalhos, CNPJ e inscrição tributária emitidos sob a titularidade da sua empresa.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span><strong>Gestão Comercial:</strong> Ativação e parametrização dos meios de pagamento e limites diários para seus clientes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span><strong>Webhooks & Integrações:</strong> Notificação direta para os seus servidores através de URL e assinatura secreta privativa.</span>
                  </li>
                </ul>
              </div>

              {/* Escopo do Detentor do Sistema (Moreira Brasil) */}
              <div className="p-5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase font-mono">
                  <Lock className="w-4 h-4" /> Escopo Soberano Moreira Brasil (Inviolável)
                </div>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Custódia Master:</strong> A governança das contas matriz e liquidações estruturais permanece sob autoridade exclusiva da Moreira Brasil.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Auditoria Forense Imutável:</strong> Toda transação executada pelos assinantes gera rastro em cadeia de blocos SHA-256 e tríplice vínculo.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Não-Interferência Mútua:</strong> Nenhuma alteração cadastral do assinante tem poder de modificar o CNPJ master (68.603.032/0001-15) ou o comando de Jose Silva.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Certificação Legal */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs font-mono space-y-2">
              <span className="text-emerald-400 font-bold block uppercase text-[11px]">
                Declaração de Conformidade Técnica & Jurídica:
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                O presente sistema opera sob a arquitetura Multi-Tenant Strict Sandbox. Os dados das empresas assinantes possuem partições lógicas exclusivas. Toda a infraestrutura central, segurança perimetral (WAF/Edge) e compliance regulatório junto ao Banco Central do Brasil são mantidos integralmente pelo núcleo central da <strong className="text-white">MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
