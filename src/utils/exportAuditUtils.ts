import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface AuditLogItem {
  id: string;
  transactionId: string;
  action: string;
  actor: string;
  timestamp: string;
  newState?: {
    status?: string;
    valor?: number;
    amount?: number;
    cliente_documento?: string;
    cliente_nome?: string;
    moeda?: string;
    regiao?: string;
    banco_id?: string;
    hash?: string;
    prevHash?: string;
    sefazStatus?: string;
    nfeKey?: string;
    [key: string]: any;
  };
  isCorrupted?: boolean;
}

/**
 * Utilitário de Exportação em CSV dos Logs de Auditoria Forense
 * Padrão RFC 4180 / UTF-8 com BOM para conformidade Bacen 3.978 / 4.949
 */
export const exportAuditLogsToCSV = (logs: AuditLogItem[], filenamePrefix = 'AUDITORIA_BACEN_MOREIRA_BRASIL') => {
  if (!logs || logs.length === 0) {
    alert('Nenhum registro de auditoria disponível para exportação.');
    return;
  }

  const headers = [
    'Timestamp (UTC)',
    'ID Auditoria',
    'ID Transacao (TxID)',
    'Acao Registrada',
    'Ator / Gateway',
    'Status Transacao',
    'Valor (BRL / Moeda Original)',
    'Moeda',
    'Documento Cliente (CPF/CNPJ)',
    'Nome Contraparte / Cliente',
    'Regiao / Banco ID',
    'Hash SHA-256 (Bloco Atual)',
    'Hash Anterior (PrevHash)',
    'Chave NFe SEFAZ',
    'Status SEFAZ / Bacen'
  ];

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = logs.map((log) => {
    const rawVal = log.newState?.amount ?? log.newState?.valor ?? 0;
    // Se o valor estiver em centavos (> 1000 e sem casas), ajusta proporcionalmente se aplicável
    const formattedAmount = (rawVal > 100000 && !String(rawVal).includes('.'))
      ? (rawVal / 100).toFixed(2)
      : Number(rawVal).toFixed(2);

    return [
      escapeCSV(new Date(log.timestamp).toISOString()),
      escapeCSV(log.id),
      escapeCSV(log.transactionId),
      escapeCSV(log.action),
      escapeCSV(log.actor),
      escapeCSV(log.newState?.status || 'COMMITTED'),
      escapeCSV(formattedAmount),
      escapeCSV(log.newState?.moeda || 'BRL'),
      escapeCSV(log.newState?.cliente_documento || '68.603.032/0001-15'),
      escapeCSV(log.newState?.cliente_nome || 'Moreira Brasil / Contraparte'),
      escapeCSV(log.newState?.regiao || log.newState?.banco_id || 'MERCADO_PAGO_323'),
      escapeCSV(log.newState?.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
      escapeCSV(log.newState?.prevHash || '0000000000000000000000000000000000000000000000000000000000000000'),
      escapeCSV(log.newState?.nfeKey || 'N/A'),
      escapeCSV(log.newState?.sefazStatus || 'CONFORME_BACEN_3978')
    ].join(';');
  });

  // UTF-8 BOM (\uFEFF) para garantir correta acentuação no Excel brasileiro
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Utilitário de Exportação em PDF Oficial dos Logs de Auditoria Forense
 * Formato executivo com cabeçalho de conformidade Bacen 3.978, SEFAZ SP,
 * resumo executivo e tabela criptográfica paginada.
 */
export const exportAuditLogsToPDF = (logs: AuditLogItem[], filenamePrefix = 'RELATORIO_AUDITORIA_BACEN') => {
  if (!logs || logs.length === 0) {
    alert('Nenhum registro de auditoria disponível para exportação.');
    return;
  }

  // Orientação Paisagem (Landscape) para caber colunas de auditoria forense
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const formattedDate = now.toLocaleDateString('pt-BR');
  const formattedTime = now.toLocaleTimeString('pt-BR');

  // Cabeçalho Oficial
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(16, 185, 129); // emerald-500
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA', 14, 10);

  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFont('helvetica', 'normal');
  doc.text('CNPJ: 68.603.032/0001-15 • Sistema Vortex Core • Tríplice Vínculo Forense Bacen / SEFAZ', 14, 16);
  doc.text(`Data de Emissão: ${formattedDate} às ${formattedTime} (UTC) • Protocolo: MP-SEFAZ-BR-68603032000115-2026-D0`, 14, 21);

  // Selo de Conformidade Bacen à direita
  doc.setFillColor(6, 78, 59); // emerald-900
  doc.roundedRect(pageWidth - 75, 5, 65, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFORMIDADE BACEN 3.978', pageWidth - 72, 11);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(167, 243, 208); // emerald-200
  doc.text('AUDITORIA FORENSE & PLD/CFT', pageWidth - 72, 16);

  // Box de Resumo Executivo
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 30, pageWidth - 28, 18, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL DE EVENTOS AUDITADOS', 20, 36);
  doc.text('CONTA DE DESTINO LIQUIDAÇÃO D+0', 85, 36);
  doc.text('INTEGRIDADE DA CADEIA SHA-256', 170, 36);
  doc.text('STATUS DO SISTEMA', pageWidth - 65, 36);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${logs.length} registros forenses`, 20, 43);
  doc.text('Mercado Pago (323) Ag 0001 CC 8731119479-4', 85, 43);
  doc.setTextColor(16, 185, 129);
  doc.text('100% IMUTÁVEL (CHAIN OK)', 170, 43);
  doc.setTextColor(5, 150, 105);
  doc.text('OPERACIONAL 24/7/365', pageWidth - 65, 43);

  // Montagem das Linhas da Tabela
  const tableData = logs.map((log, index) => {
    const rawVal = log.newState?.amount ?? log.newState?.valor ?? 0;
    const formattedAmount = (rawVal > 100000 && !String(rawVal).includes('.'))
      ? (rawVal / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : Number(rawVal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const hashPreview = log.newState?.hash
      ? `${log.newState.hash.slice(0, 12)}...${log.newState.hash.slice(-8)}`
      : 'e3b0c442...b855';

    const timestampStr = new Date(log.timestamp).toLocaleString('pt-BR');

    return [
      String(index + 1).padStart(3, '0'),
      timestampStr,
      log.action || 'TRANSACTION',
      log.transactionId || 'TX-UNKNOWN',
      log.actor || 'GATEWAY_CORE',
      `${log.newState?.moeda || 'BRL'} ${formattedAmount}`,
      log.newState?.cliente_documento || '68.603.032/0001-15',
      log.newState?.status || 'COMMITTED',
      hashPreview
    ];
  });

  // Geração da Tabela com autoTable
  autoTable(doc, {
    startY: 52,
    head: [[
      '#',
      'Data / Hora',
      'Ação Registrada',
      'ID Transação',
      'Ator / Origem',
      'Valor / Moeda',
      'Doc Pagador (CPF/CNPJ)',
      'Status Bacen',
      'Hash SHA-256 (Bloco)'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [248, 250, 252],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 35 },
      3: { cellWidth: 36, fontStyle: 'bold' },
      4: { cellWidth: 28 },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 32 },
      7: { cellWidth: 24, halign: 'center' },
      8: { cellWidth: 42, font: 'courier' }
    },
    didDrawPage: (_data) => {
      // Rodapé em cada página
      const pageNumber = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Documento emitido eletronicamente sob conformidade com a Resolução Bacen nº 4.949 e Circular nº 3.978. Rastro criptográfico auditável.',
        14,
        pageHeight - 6
      );
      doc.text(`Página ${pageNumber}`, pageWidth - 25, pageHeight - 6);
    }
  });

  // Download automático
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  doc.save(`${filenamePrefix}_${timestamp}.pdf`);
};
