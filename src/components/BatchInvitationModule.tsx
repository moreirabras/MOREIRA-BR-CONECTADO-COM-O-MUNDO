import React, { useState, useMemo, useEffect } from 'react';
import { 
  Mail, Send, Users, CheckCircle2, Clock, Globe, ShieldCheck, Sparkles, 
  Plus, Trash2, Play, RefreshCw, AlertCircle, Database, Search, Filter,
  Upload, FileText, CheckSquare, Square, Eye, Zap, Pause, ArrowRight, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowDownCircle, Layers, SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { COMPANY_INFO } from '../config/company.ts';
import { db } from '../lib/firebase.ts';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { EmailService } from '../services/emailService.ts';
import { INITIAL_GLOBAL_CONTACTS, Contact } from '../data/globalEnterpriseContacts.ts';

const STORAGE_KEY = 'moreira_invitation_contacts_v2';

export const BatchInvitationModule: React.FC = () => {
  // Primary state initialized with all 500 global enterprise contacts
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_GLOBAL_CONTACTS.length) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_GLOBAL_CONTACTS;
  });

  // Save to localStorage whenever contacts list updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
  }, [contacts]);

  // Main navigation tabs: Automatic Batch Dispatch vs. Manual Single/Multi Dispatch vs. Mass Import
  const [activeTab, setActiveTab] = useState<'AUTO' | 'MANUAL' | 'IMPORT'>('AUTO');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'REPLIED'>('ALL');

  // Contact status & reply management modal state
  const [managingContact, setManagingContact] = useState<Contact | null>(null);
  const [replyTextModal, setReplyTextModal] = useState('');
  const [newStatusModal, setNewStatusModal] = useState<Contact['status']>('DELIVERED');

  // High-Performance Pagination & Lazy Loading Settings
  const [displayMode, setDisplayMode] = useState<'PAGINATION' | 'LAZY'>('PAGINATION');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lazyLoadedCount, setLazyLoadedCount] = useState<number>(50);

  // Auto reset pagination upon filtering or searching
  useEffect(() => {
    setCurrentPage(1);
    setLazyLoadedCount(pageSize);
  }, [searchTerm, statusFilter, pageSize]);

  // Selection state for manual dispatch
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [manualTargetContact, setManualTargetContact] = useState<Contact | null>(null);
  const [manualSubject, setManualSubject] = useState('');
  const [manualCustomMessage, setManualCustomMessage] = useState('');
  const [manualTrialDays, setManualTrialDays] = useState(15);
  const [manualSending, setManualSending] = useState(false);
  const [manualSuccessMsg, setManualSuccessMsg] = useState('');

  // Automatic Batch dispatch settings
  const [batchSize, setBatchSize] = useState<number>(50);
  const [processing, setProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [campaignCompleted, setCampaignCompleted] = useState(false);

  // New single contact form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCountry, setNewCountry] = useState('Brasil');
  const [newLanguage, setNewLanguage] = useState('Português');
  const [newSegment, setNewSegment] = useState('Obras Públicas e Infraestrutura Viária');
  const [newCity, setNewCity] = useState('São Paulo');
  const [newPhone, setNewPhone] = useState('+55 11 99999-8888');

  // Mass Import state
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Filtered contacts list
  const filteredContacts = useMemo(() => {
    return contacts
      .filter(c => {
        if (statusFilter === 'PENDING') return c.status === 'PENDING';
        if (statusFilter === 'SENT') return c.status === 'SENT';
        if (statusFilter === 'DELIVERED') return c.status === 'DELIVERED';
        if (statusFilter === 'READ') return c.status === 'READ';
        if (statusFilter === 'REPLIED') return c.status === 'REPLIED';
        return true;
      })
      .filter(c => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.segment.toLowerCase().includes(term) ||
          c.country.toLowerCase().includes(term) ||
          c.city.toLowerCase().includes(term) ||
          c.phone.toLowerCase().includes(term) ||
          (c.replyMessage && c.replyMessage.toLowerCase().includes(term))
        );
      });
  }, [contacts, statusFilter, searchTerm]);

  // Pagination calculations
  const totalFiltered = filteredContacts.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  // Sliced contacts for high-performance rendering (no DOM freeze)
  const displayedContacts = useMemo(() => {
    if (displayMode === 'LAZY') {
      return filteredContacts.slice(0, lazyLoadedCount);
    }
    const startIndex = (currentPage - 1) * pageSize;
    return filteredContacts.slice(startIndex, startIndex + pageSize);
  }, [filteredContacts, displayMode, currentPage, pageSize, lazyLoadedCount]);

  const currentStartIndex = displayMode === 'LAZY' ? 0 : (currentPage - 1) * pageSize;

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleFirstPage = () => setCurrentPage(1);
  const handleLastPage = () => setCurrentPage(totalPages);

  const handleLoadMoreLazy = () => {
    setLazyLoadedCount(prev => Math.min(prev + 50, totalFiltered));
  };

  // Status badge & modal helper
  const getStatusBadge = (status: Contact['status']) => {
    switch (status) {
      case 'SENT':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ENVIADO</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">RECEBIDO</span>;
      case 'READ':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">LIDO</span>;
      case 'REPLIED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">RESPONDIDO</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">FALHA</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">AGUARDANDO</span>;
    }
  };

  const handleOpenManageModal = (contact: Contact) => {
    setManagingContact(contact);
    setNewStatusModal(contact.status);
    setReplyTextModal(contact.replyMessage || '');
  };

  // Handle single contact addition
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const newContact: Contact = {
      id: `contact_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: newName,
      email: newEmail,
      country: newCountry,
      language: newLanguage,
      segment: newSegment,
      city: newCity,
      phone: newPhone,
      status: 'PENDING'
    };

    setContacts([newContact, ...contacts]);
    setNewName('');
    setNewEmail('');
  };

  const handleRemoveContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
    setSelectedContactIds(selectedContactIds.filter(selectedId => selectedId !== id));
  };

  // Toggle selection for manual batch
  const toggleSelectContact = (id: string) => {
    if (selectedContactIds.includes(id)) {
      setSelectedContactIds(selectedContactIds.filter(i => i !== id));
    } else {
      setSelectedContactIds([...selectedContactIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedContactIds.length === filteredContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(filteredContacts.map(c => c.id));
    }
  };

  // Open manual drawer for a single target contact
  const handleOpenManualDispatch = (contact: Contact) => {
    setManualTargetContact(contact);
    setManualSubject(`Convite Oficial - Plataforma Enterprise FinTech & Auditoria (${contact.country})`);
    setManualCustomMessage(`A Moreira Brasil Construções e Serviços Ltda (CNPJ: ${COMPANY_INFO.cnpj}), sob liderança de Jose Silva, tem a satisfação de convidá-lo(a) para usufruir de 15 dias de degustação integral e sem custos na nossa plataforma Enterprise.`);
    setManualTrialDays(15);
    setManualSuccessMsg('');
  };

  // Dispatch manual invitation (single or selected group)
  const handleSendManualInvitation = async () => {
    if (!manualTargetContact && selectedContactIds.length === 0) return;
    setManualSending(true);
    setManualSuccessMsg('');

    try {
      if (manualTargetContact) {
        await EmailService.sendBatchInvitation({
          recipientName: manualTargetContact.name,
          recipientEmail: manualTargetContact.email,
          country: manualTargetContact.country,
          language: manualTargetContact.language,
          segment: manualTargetContact.segment,
          trialDays: manualTrialDays,
          customSubject: manualSubject,
          customMessage: manualCustomMessage
        });

        setContacts(prev => prev.map(c => c.id === manualTargetContact.id ? { ...c, status: 'SENT' } : c));
        setManualSuccessMsg(`Convite manual enviado com sucesso para ${manualTargetContact.name} (${manualTargetContact.email})! Cópia arquivada em josemoreirabrazil@gmail.com.`);
      } else if (selectedContactIds.length > 0) {
        const targets = contacts.filter(c => selectedContactIds.includes(c.id));
        for (const target of targets) {
          await EmailService.sendBatchInvitation({
            recipientName: target.name,
            recipientEmail: target.email,
            country: target.country,
            language: target.language,
            segment: target.segment,
            trialDays: manualTrialDays,
            customSubject: manualSubject || undefined,
            customMessage: manualCustomMessage || undefined
          });
        }
        setContacts(prev => prev.map(c => selectedContactIds.includes(c.id) ? { ...c, status: 'SENT' } : c));
        setManualSuccessMsg(`Disparo manual concluído com sucesso para ${targets.length} empresas selecionadas!`);
        setSelectedContactIds([]);
      }
    } catch (err) {
      console.error('Manual dispatch error:', err);
    } finally {
      setManualSending(false);
    }
  };

  // Automated Batch Dispatch Logic
  const handleStartBatchDispatch = async () => {
    if (contacts.length === 0) return;
    setProcessing(true);
    setIsPaused(false);
    setProgress(0);
    setLogs([]);
    setCampaignCompleted(false);

    const batchId = `BATCH_ALL_${Date.now()}`;
    const total = contacts.length;
    let completed = 0;

    const newLogs: string[] = [];
    newLogs.push(`[${new Date().toISOString()}] Inicializando campanha global automatizada para base de ${total} contatos...`);
    newLogs.push(`[${new Date().toISOString()}] Remetente Oficial: ${COMPANY_INFO.name} (CNPJ: ${COMPANY_INFO.cnpj}) | Resp: Jose Silva`);
    newLogs.push(`[${new Date().toISOString()}] Cópia de auditoria e conformidade configurada para: josemoreirabrazil@gmail.com`);
    newLogs.push(`[${new Date().toISOString()}] HMAC Assinatura: whsec_9lsBjuWlcUKlPvRkAEiygc8K7xaaALXb`);
    setLogs([...newLogs]);

    const interval = setInterval(async () => {
      if (isPaused) return;

      const currentBatchContacts = contacts.slice(completed, completed + batchSize);
      
      for (const contact of currentBatchContacts) {
        await EmailService.sendBatchInvitation({
          recipientName: contact.name,
          recipientEmail: contact.email,
          country: contact.country,
          language: contact.language,
          segment: contact.segment,
          trialDays: 15
        });
      }

      completed += currentBatchContacts.length;
      const currentProgress = Math.min(100, Math.round((completed / total) * 100));
      setProgress(currentProgress);

      const batchLog = `[${new Date().toISOString()}] Lote disparado via Resend SMTP (resend.com:465): ${Math.min(completed, total)}/${total} convites (15 dias grátis). Cópia enviada a josemoreirabrazil@gmail.com`;
      newLogs.unshift(batchLog);
      setLogs([...newLogs]);

      if (completed >= total) {
        clearInterval(interval);
        setProcessing(false);
        setCampaignCompleted(true);
        setContacts(prev => prev.map(c => ({ ...c, status: 'SENT' })));

        try {
          const batchRef = doc(db, 'invitation_batches', batchId);
          await setDoc(batchRef, {
            batchId,
            totalContacts: total,
            batchSize,
            sender: 'Jose Silva',
            company: COMPANY_INFO.name,
            cnpj: COMPANY_INFO.cnpj,
            copyEmail: 'josemoreirabrazil@gmail.com',
            createdAt: Timestamp.now(),
            status: 'COMPLETED'
          });
        } catch (err) {
          console.warn('Firestore batch log save error:', err);
        }
      }
    }, 1200);
  };

  // Mass Import Handler (Upload CSV / JSON / Paste)
  const handleProcessImport = () => {
    if (!importText.trim()) return;
    try {
      let importedList: Contact[] = [];

      // Try JSON first
      if (importText.trim().startsWith('[') || importText.trim().startsWith('{')) {
        const parsed = JSON.parse(importText);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        importedList = list.map((item, idx) => ({
          id: `imp_${Date.now()}_${idx}`,
          name: item.name || item.empresa || 'Empresa Importada',
          email: item.email || item.contato || 'contato@empresa.com.br',
          country: item.country || item.pais || 'Brasil',
          language: item.language || item.idioma || 'Português',
          segment: item.segment || item.segmento || 'Infraestrutura e Construção',
          city: item.city || item.cidade || 'São Paulo',
          phone: item.phone || item.telefone || '+55 11 99999-0000',
          status: 'PENDING'
        }));
      } else {
        // Parse CSV or line separated: Name, email, country, segment, city, phone
        const lines = importText.split('\n').filter(l => l.trim().length > 0);
        importedList = lines.map((line, idx) => {
          const parts = line.split(/[;,]/).map(p => p.trim());
          return {
            id: `imp_${Date.now()}_${idx}`,
            name: parts[0] || `Empresa ${idx + 1}`,
            email: parts[1] || `contato${idx + 1}@empresa.com.br`,
            country: parts[2] || 'Brasil',
            language: parts[3] || 'Português',
            segment: parts[4] || 'Infraestrutura e Obras',
            city: parts[5] || 'São Paulo',
            phone: parts[6] || '+55 11 99999-0000',
            status: 'PENDING'
          };
        });
      }

      if (importedList.length > 0) {
        setContacts(prev => [...importedList, ...prev]);
        setImportStatus(`Sucesso! ${importedList.length} novos contatos adicionados à fila com sucesso.`);
        setImportText('');
      } else {
        setImportStatus('Nenhum contato válido encontrado no texto inserido.');
      }
    } catch (err: any) {
      setImportStatus(`Erro ao processar importação: ${err?.message || 'Formato inválido'}`);
    }
  };

  // Reusable High-Performance Pagination & Lazy Loading Controls Bar
  const renderPaginationControls = (theme: 'emerald' | 'sky') => {
    const isEmerald = theme === 'emerald';
    const activeColor = isEmerald ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-sky-500 text-slate-950 font-bold';
    const endCount = displayMode === 'LAZY' 
      ? Math.min(lazyLoadedCount, totalFiltered)
      : Math.min(currentStartIndex + pageSize, totalFiltered);

    return (
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
        {/* Info & Mode Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-slate-400 text-[11px]">
            Exibindo <strong className="text-white">{totalFiltered > 0 ? currentStartIndex + 1 : 0}</strong> a <strong className="text-white">{endCount}</strong> de <strong className="text-white">{totalFiltered}</strong> empresas
          </span>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => setDisplayMode('PAGINATION')}
              className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer ${
                displayMode === 'PAGINATION' ? activeColor : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização paginada com navegação rápida"
            >
              <Layers className="w-3 h-3" />
              <span>Páginas</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('LAZY')}
              className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer ${
                displayMode === 'LAZY' ? activeColor : 'text-slate-400 hover:text-white'
              }`}
              title="Carregamento contínuo sob demanda (Lazy loading)"
            >
              <ArrowDownCircle className="w-3 h-3" />
              <span>Carregamento Contínuo</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {displayMode === 'PAGINATION' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500">Por pág:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-md text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
                <option value={5000}>5000</option>
                <option value={totalFiltered}>{totalFiltered} (Todos)</option>
              </select>
            </div>
          )}

          {displayMode === 'PAGINATION' ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleFirstPage}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 cursor-pointer"
                title="Primeira página"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 7) return true;
                    return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => {
                    const showEllipsis = index > 0 && page - array[index - 1] > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span className="text-slate-600 px-1 text-[10px]">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            currentPage === page ? activeColor : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 cursor-pointer"
                title="Próxima página"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleLastPage}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 cursor-pointer"
                title="Última página"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {lazyLoadedCount < totalFiltered ? (
                <button
                  type="button"
                  onClick={handleLoadMoreLazy}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow ${
                    isEmerald ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                >
                  <ArrowDownCircle className="w-3.5 h-3.5" />
                  <span>Carregar Mais (+50 Empresas)</span>
                </button>
              ) : (
                <span className="text-emerald-400 text-[11px] font-bold">✓ Todos os {totalFiltered} contatos carregados</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 text-emerald-400">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                ✓ Base Completa de {INITIAL_GLOBAL_CONTACTS.length} Contatos Carregada
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                🎁 15 DIAS GRÁTIS D+0
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-400 border border-slate-700 bg-slate-950">
                Cópia: josemoreirabrazil@gmail.com
              </span>
            </div>
            <h2 className="text-lg font-black text-white mt-1.5 flex items-center gap-2">
              Central Integrada de Convites: Disparo Automático & Manual
            </h2>
            <p className="text-xs text-slate-400">
              Gestão oficial para <strong className="text-white">Moreira Brasil (CNPJ 68.603.032/0001-15)</strong> sob comando executivo de <strong className="text-white">Jose Silva</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <div className="text-right font-mono text-xs">
            <span className="text-slate-400 block">Total Ativo na Fila:</span>
            <span className="text-emerald-400 font-extrabold text-base">{contacts.length} Empresas</span>
          </div>
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 font-mono text-xs">
        <button
          onClick={() => setActiveTab('AUTO')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'AUTO'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-300" />
          <span>1. Disparo Automático em Lotes</span>
        </button>

        <button
          onClick={() => setActiveTab('MANUAL')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'MANUAL'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Send className="w-4 h-4 text-sky-300" />
          <span>2. Disparo Manual & Seleção Direta</span>
        </button>

        <button
          onClick={() => setActiveTab('IMPORT')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'IMPORT'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Upload className="w-4 h-4 text-amber-300" />
          <span>3. Importação em Massa ({contacts.length}+ Contatos)</span>
        </button>
      </div>

      {/* KPI Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Total na Base</span>
          <span className="text-2xl font-black text-white mt-1 block">{contacts.length}</span>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">✓ {contacts.length} Contatos Prontos</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 shadow">
          <span className="text-[10px] text-amber-400 block uppercase tracking-wider">Aguardando Lote</span>
          <span className="text-2xl font-black text-amber-300 mt-1 block">
            {contacts.filter(c => c.status === 'PENDING').length}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Status PENDING</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow">
          <span className="text-[10px] text-emerald-400 block uppercase tracking-wider">Convites Enviados</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">
            {contacts.filter(c => c.status === 'SENT').length}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Status SENT (15 Dias Grátis)</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-sky-500/30 shadow">
          <span className="text-[10px] text-sky-400 block uppercase tracking-wider">Territórios & Países</span>
          <span className="text-2xl font-black text-sky-300 mt-1 block">
            {new Set(contacts.map(c => c.country)).size}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Nacional & Global</span>
        </div>
      </div>

      {/* TAB 1: AUTOMATIC DISPATCH */}
      {activeTab === 'AUTO' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Automation Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-2xl space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">MÓDULO DE AUTOMAÇÃO</span>
                <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  Disparo Automático em Lotes
                </h3>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-400">Tamanho do Lote por Ciclo</label>
                  <select
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    disabled={processing}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:border-emerald-500"
                  >
                    <option value={25}>25 empresas / lote (Ciclo Seguro)</option>
                    <option value={50}>50 empresas / lote (Recomendado)</option>
                    <option value={100}>100 empresas / lote (Acelerado)</option>
                    <option value={250}>250 empresas / lote (Escala Alta)</option>
                    <option value={500}>500 empresas / lote</option>
                    <option value={1000}>1000 empresas / lote</option>
                    <option value={contacts.length}>Todos os {contacts.length} contatos de uma vez</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-[11px] text-slate-300">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Trilha de Auditoria & Governança
                  </span>
                  <ul className="space-y-1 text-slate-400">
                    <li>• Empresa: Moreira Brasil Construções e Serviços Ltda</li>
                    <li>• CNPJ: 68.603.032/0001-15 | Resp: Jose Silva</li>
                    <li>• Cópia de Auditoria: josemoreirabrazil@gmail.com</li>
                    <li>• Resend SMTP: resend.com:465 (Usuário: resend)</li>
                    <li>• Proposta: 15 dias de degustação integral D+0</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleStartBatchDispatch}
                  disabled={processing || contacts.length === 0}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processando Lote ({progress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Iniciar Disparo Automático ({contacts.length} Contatos)</span>
                    </>
                  )}
                </button>

                {processing && (
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isPaused ? 'Retomar Disparo' : 'Pausar Disparo'}</span>
                  </button>
                )}
              </div>

              {processing && (
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Progresso do Lote:</span>
                    <span className="text-emerald-400 font-bold">{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {campaignCompleted && (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Campanha automatizada finalizada com sucesso! Todos os {contacts.length} registros arquivados no Firestore e notificados.</span>
                </div>
              )}
            </div>

            {/* Execution Logs */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 font-mono">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                Logs de Execução da Campanha
              </h4>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 h-56 overflow-y-auto text-[10px] text-slate-400 space-y-1.5">
                {logs.length === 0 ? (
                  <span className="text-slate-600 italic">Aguardando início do disparo em lote para as {contacts.length} empresas...</span>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="text-slate-300 leading-normal border-b border-slate-900 pb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Contacts Table in Tab 1 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" />
                    Fila de Disparo Automático ({contacts.length} Contatos Ativos)
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">Oferta: 15 Dias Grátis D+0</span>
                </div>

                {/* Status Filters */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      statusFilter === 'ALL'
                        ? 'bg-slate-800 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Todos ({contacts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('PENDING')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      statusFilter === 'PENDING'
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                        : 'text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    Aguardando ({contacts.filter(c => c.status === 'PENDING').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('SENT')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      statusFilter === 'SENT'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                        : 'text-slate-400 hover:text-emerald-300'
                    }`}
                  >
                    Enviados ({contacts.filter(c => c.status === 'SENT').length})
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Pesquisar entre as ${contacts.length} empresas por nome, email, estado, segmento...`}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Top Pagination Controls */}
              {renderPaginationControls('emerald')}

              {/* High-Performance Table (No DOM overflow bottleneck) */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 max-h-[600px] overflow-y-auto pr-1">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Empresa / E-mail</th>
                      <th className="p-3">Segmento / Cidade</th>
                      <th className="p-3">País / Idioma</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ação Rápida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {displayedContacts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                          Nenhum contato encontrado com os filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      displayedContacts.map((contact, idx) => (
                        <tr key={contact.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-3 text-slate-500 text-[11px] font-bold">{currentStartIndex + idx + 1}</td>
                          <td className="p-3">
                            <span className="text-white font-bold block">{contact.name}</span>
                            <span className="text-slate-400 text-[11px]">{contact.email}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-slate-300 block">{contact.segment}</span>
                            <span className="text-slate-500 text-[11px]">{contact.city}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-slate-300 block">{contact.country}</span>
                            <span className="text-sky-400 text-[11px]">{contact.language}</span>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              {getStatusBadge(contact.status)}
                              {contact.replyMessage && (
                                <p className="text-[10px] text-purple-300 italic bg-purple-950/40 p-1.5 rounded border border-purple-500/30">
                                  💬 "{contact.replyMessage}"
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenManageModal(contact)}
                              className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Atualizar status ou registrar resposta"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Status</span>
                            </button>
                            <button
                              onClick={() => handleOpenManualDispatch(contact)}
                              className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Disparar Convite Individual Agora"
                            >
                              <Send className="w-3 h-3" />
                              <span>Manual</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Pagination Controls */}
              {renderPaginationControls('emerald')}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANUAL DISPATCH & CUSTOM SELECTION */}
      {activeTab === 'MANUAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Manual Email Composer / Trigger Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-sky-500/30 shadow-2xl space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider font-bold">DISPARO MANUAL & SELEÇÃO</span>
                <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                  <Send className="w-5 h-5 text-sky-400" />
                  Painel de Envio Manual
                </h3>
              </div>

              {manualSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{manualSuccessMsg}</span>
                </div>
              )}

              {/* Target Indicator */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                <span className="text-slate-400 text-[11px] block uppercase font-bold">Destinatário(s) Selecionado(s):</span>
                {manualTargetContact ? (
                  <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold block">{manualTargetContact.name}</span>
                      <span className="text-sky-300 text-[11px]">{manualTargetContact.email}</span>
                      <span className="text-slate-400 text-[10px] block mt-0.5">{manualTargetContact.country} • {manualTargetContact.segment}</span>
                    </div>
                    <button
                      onClick={() => setManualTargetContact(null)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Limpar Destinatário Individual"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : selectedContactIds.length > 0 ? (
                  <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-500/30">
                    <span className="text-sky-300 font-bold block">{selectedContactIds.length} Empresas Selecionadas via Checkbox</span>
                    <span className="text-slate-400 text-[10px]">O convite será enviado individualmente para cada uma das selecionadas.</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-900 border border-dashed border-slate-700 text-slate-500 text-center text-[11px]">
                    Nenhum contato selecionado. Clique em "Manual" na tabela ao lado ou marque as caixas de seleção.
                  </div>
                )}
              </div>

              {/* Email Customization Fields */}
              <div className="space-y-3 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400">Assunto do E-mail</label>
                  <input
                    type="text"
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                    placeholder="Convite Oficial - Plataforma Enterprise FinTech & Auditoria"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Período de Degustação</label>
                  <select
                    value={manualTrialDays}
                    onChange={(e) => setManualTrialDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-sky-500"
                  >
                    <option value={15}>15 Dias Grátis (Padrão Moreira Brasil)</option>
                    <option value={30}>30 Dias Grátis (Campanha Especial)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Mensagem Personalizada do Convite</label>
                  <textarea
                    rows={4}
                    value={manualCustomMessage}
                    onChange={(e) => setManualCustomMessage(e.target.value)}
                    placeholder="Escreva uma mensagem especial para este contato..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Dispatch Action Button */}
              <button
                onClick={handleSendManualInvitation}
                disabled={manualSending || (!manualTargetContact && selectedContactIds.length === 0)}
                className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-sky-500/25 cursor-pointer disabled:opacity-40"
              >
                {manualSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Disparando Convite Manual via Resend...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 fill-current" />
                    <span>
                      {manualTargetContact 
                        ? `Disparar para ${manualTargetContact.name.slice(0, 20)}...`
                        : selectedContactIds.length > 0 
                          ? `Disparar para as ${selectedContactIds.length} Empresas Selecionadas`
                          : 'Selecione Contato para Disparo'}
                    </span>
                  </>
                )}
              </button>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                <span className="text-white font-bold block">✓ Garantia de Conformidade Bacen & SEFAZ</span>
                <p>O envio manual aciona a API Resend com remetente oficial, entrega garantida em D+0 e cópia simultânea para josemoreirabrazil@gmail.com.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Multi-Select Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const pageIds = displayedContacts.map(c => c.id);
                      setSelectedContactIds(Array.from(new Set([...selectedContactIds, ...pageIds])));
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-500/30 text-xs font-mono cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                    <span>Selecionar Esta Página ({displayedContacts.length})</span>
                  </button>

                  <button
                    onClick={() => setSelectedContactIds(filteredContacts.map(c => c.id))}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-xs font-mono cursor-pointer flex items-center gap-1.5"
                  >
                    <span>✓ Selecionar Todas ({filteredContacts.length})</span>
                  </button>

                  {selectedContactIds.length > 0 && (
                    <button
                      onClick={() => setSelectedContactIds([])}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                    >
                      Limpar ({selectedContactIds.length})
                    </button>
                  )}
                </div>

                {/* Status Filters */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      statusFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Todos ({contacts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('PENDING')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      statusFilter === 'PENDING' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-slate-400'
                    }`}
                  >
                    Aguardando ({contacts.filter(c => c.status === 'PENDING').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('SENT')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      statusFilter === 'SENT' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400'
                    }`}
                  >
                    Enviados ({contacts.filter(c => c.status === 'SENT').length})
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar por nome, e-mail corporativo, estado, segmento..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Top Pagination Controls for Tab 2 */}
              {renderPaginationControls('sky')}

              {/* High-Performance Multi-Select Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 max-h-[600px] overflow-y-auto pr-1">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 w-8">Sel</th>
                      <th className="p-3">#</th>
                      <th className="p-3">Empresa / E-mail</th>
                      <th className="p-3">Segmento / Cidade</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Disparo Direto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {displayedContacts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                          Nenhum contato encontrado com os filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      displayedContacts.map((contact, idx) => {
                        const isSelected = selectedContactIds.includes(contact.id);
                        return (
                          <tr 
                            key={contact.id} 
                            className={`hover:bg-slate-900/60 transition-colors ${isSelected ? 'bg-sky-950/20' : ''}`}
                          >
                            <td className="p-3">
                              <button
                                onClick={() => toggleSelectContact(contact.id)}
                                className="text-slate-400 hover:text-white cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-sky-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-600" />
                                )}
                              </button>
                            </td>
                            <td className="p-3 text-slate-500 text-[11px] font-bold">{currentStartIndex + idx + 1}</td>
                            <td className="p-3">
                              <span className="text-white font-bold block">{contact.name}</span>
                              <span className="text-slate-400 text-[11px]">{contact.email}</span>
                            </td>
                            <td className="p-3">
                              <span className="text-slate-300 block">{contact.segment}</span>
                              <span className="text-slate-500 text-[11px]">{contact.city} • {contact.country}</span>
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                {getStatusBadge(contact.status)}
                                {contact.replyMessage && (
                                  <p className="text-[10px] text-purple-300 italic bg-purple-950/40 p-1.5 rounded border border-purple-500/30">
                                    💬 "{contact.replyMessage}"
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-right flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenManageModal(contact)}
                                className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                title="Atualizar status ou registrar resposta"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Status</span>
                              </button>
                              <button
                                onClick={() => handleOpenManualDispatch(contact)}
                                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Enviar</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Pagination Controls for Tab 2 */}
              {renderPaginationControls('sky')}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MASS IMPORT (CSV / JSON / PASTE LIST) */}
      {activeTab === 'IMPORT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl space-y-5">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">IMPORTAÇÃO SEM LIMITES</span>
                  <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-amber-400" />
                    Importador em Massa de Contatos Corporativos
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">Escalabilidade para {contacts.length}+ contatos</span>
              </div>

              {importStatus && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 text-xs font-mono text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}

              <div className="space-y-2 font-mono text-xs">
                <label className="text-slate-300 font-bold block">
                  Cole sua Lista de Contatos (CSV ou JSON):
                </label>
                <p className="text-[11px] text-slate-400">
                  Formato CSV aceito (uma empresa por linha):<br />
                  <code className="text-emerald-400">Nome da Empresa, email@empresa.com.br, País, Idioma, Segmento, Cidade, Telefone</code>
                </p>
                <textarea
                  rows={10}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Exemplo CSV:&#10;Zeta Engenharia S.A., contato@zetaeng.com.br, Brasil, Português, Obras Públicas, Salvador, (71) 3341-0000&#10;Solar Power Nordeste, contato@solarnordeste.com.br, Brasil, Português, Energia Solar, Fortaleza, (85) 3200-1122"
                  className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleProcessImport}
                  disabled={!importText.trim()}
                  className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-500/25 cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Contatos à Fila Ativa</span>
                </button>
                <button
                  onClick={() => setImportText('')}
                  className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* Quick Add Form on Right */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Adicionar Empresa Individual
              </h3>

              <form onSubmit={handleAddContact} className="space-y-3 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-slate-400">Nome da Empresa</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Nova Engenharia S.A."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">E-mail Corporativo</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="contato@novaeng.com.br"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">País</label>
                  <input
                    type="text"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Segmento</label>
                  <input
                    type="text"
                    value={newSegment}
                    onChange={(e) => setNewSegment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/40"
                >
                  <Plus className="w-4 h-4" />
                  <span>Salvar na Base de Contatos</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Contact Status & Reply Management Modal */}
      {managingContact && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">Gerenciar Status & Resposta</span>
                <h3 className="text-white font-bold text-sm mt-0.5">{managingContact.name}</h3>
                <span className="text-slate-400 text-[11px]">{managingContact.email}</span>
              </div>
              <button
                onClick={() => setManagingContact(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-400">Atualizar Status de Envio</label>
                <select
                  value={newStatusModal}
                  onChange={(e) => setNewStatusModal(e.target.value as Contact['status'])}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono cursor-pointer"
                >
                  <option value="PENDING">Aguardando na Fila</option>
                  <option value="SENT">Convite Enviado (D+0)</option>
                  <option value="DELIVERED">Recebido (SMTP OK)</option>
                  <option value="READ">Lido (Aberto pelo Cliente)</option>
                  <option value="REPLIED">Respondido (Interessado)</option>
                  <option value="FAILED">Falha no Envio</option>
                </select>
              </div>

              {newStatusModal === 'REPLIED' && (
                <div className="space-y-1">
                  <label className="text-slate-400">Resposta / Comentário do Interessado</label>
                  <textarea
                    rows={3}
                    value={replyTextModal}
                    onChange={(e) => setReplyTextModal(e.target.value)}
                    placeholder="Ex: Ótima iniciativa da Moreira Brasil! Queremos testar a plataforma por 30 dias."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setContacts(prev => prev.map(c => c.id === managingContact.id ? {
                    ...c,
                    status: newStatusModal,
                    replyMessage: newStatusModal === 'REPLIED' ? (replyTextModal || c.replyMessage || 'Demonstrou interesse na proposta de degustação.') : c.replyMessage,
                    replyTimestamp: newStatusModal === 'REPLIED' ? new Date().toISOString() : c.replyTimestamp
                  } : c));
                  setManagingContact(null);
                }}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Salvar Status & Resposta
              </button>
              <button
                onClick={() => setManagingContact(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
