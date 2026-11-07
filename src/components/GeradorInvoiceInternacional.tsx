import React, { useState, useEffect } from 'react';
import {
  FileCode2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  FileText,
  Building,
  Globe,
  Coins,
  ShieldCheck,
  RefreshCw,
  Copy,
  Send,
  Zap,
  Code
} from 'lucide-react';
import { COMPANY_INFO } from '../config/company.ts';

export interface ValidationError {
  code: string;
  tag: string;
  message: string;
  severity: 'error' | 'warning';
  expectedFormat?: string;
}

export interface ValidationReport {
  isValid: boolean;
  schemaVersion: string;
  targetStandard: string;
  validatedAt: string;
  errors: ValidationError[];
  warnings: ValidationError[];
  accessKey: string;
}

export interface InvoiceData {
  accessKey: string;
  invoiceNumber: string;
  series: string;
  issueDate: string;
  
  // Exporter (Prestador)
  emitterCnpj: string;
  emitterName: string;
  emitterTradeName: string;
  emitterIbgeCityCode: string;
  emitterState: string;
  emitterTaxRegime: string; // 1 = Simples Nacional, 3 = Regime Normal
  
  // Foreign Buyer (Tomador Exterior)
  buyerName: string;
  buyerForeignTaxId: string;
  buyerCountryCode: string; // BACEN country code (e.g., 2496 = UAE, 1058 = BR, 2496/0690 = USA)
  buyerCountryName: string;
  buyerAddress: string;
  buyerCity: string;
  
  // Service / Tech Product
  serviceDescription: string;
  nbsCode: string; // Nomenclatura Brasileira de Serviços
  ncmCode: string; // Nomenclatura Comum do Mercosul
  cfop: string; // 7101, 7102, 7949 for export of services/goods
  currency: 'USD' | 'AED' | 'EUR' | 'GBP';
  valueForeign: number;
  exchangeRatePtax: number;
  valueBrl: number;
  
  // Taxes / Exemptions
  isExportExempt: boolean;
  pisCofinsExemptLaw: string;
  issqnExemptLaw: string;
}

const DEFAULT_INVOICE: InvoiceData = {
  accessKey: `3526${COMPANY_INFO.cnpj.replace(/\D/g, '')}550010000000011000000019`,
  invoiceNumber: '000.000.001',
  series: '1',
  issueDate: new Date().toISOString().slice(0, 10),
  
  emitterCnpj: COMPANY_INFO.cnpj.replace(/\D/g, ''),
  emitterName: COMPANY_INFO.name,
  emitterTradeName: COMPANY_INFO.tradeName,
  emitterIbgeCityCode: '3550308', // São Paulo
  emitterState: COMPANY_INFO.address.state,
  emitterTaxRegime: '3', // Regime Normal
  
  buyerName: 'VORTEX GLOBAL TECHNOLOGIES FZ-LLC',
  buyerForeignTaxId: 'TRN-9948210394-DUBAI',
  buyerCountryCode: '2496', // Emirados Árabes Unidos
  buyerCountryName: 'Emirados Árabes Unidos',
  buyerAddress: 'Building 4, Internet City, Dubai - UAE',
  buyerCity: 'Dubai',
  
  serviceDescription: 'Licenciamento de Software SaaS Cloud 24/7/365, Suporte Técnico Especializado e Infraestrutura de Ingestão de Webhooks Global.',
  nbsCode: '1.0201.10.00', // Licenciamento e cessão de direitos de programas de computador
  ncmCode: '8523.49.90',
  cfop: '7101', // Exportação de produção do estabelecimento
  currency: 'USD',
  valueForeign: 5400.00,
  exchangeRatePtax: 5.65,
  valueBrl: 30510.00,
  
  isExportExempt: true,
  pisCofinsExemptLaw: 'Imunidade Constitucional - Art. 149, § 2º, I da CF/88 (Exportação de Serviços)',
  issqnExemptLaw: 'Isenção de ISSQN para Exportação - Lei Complementar nº 116/2003, Art. 2º, I'
};

export const GeradorInvoiceInternacional: React.FC = () => {
  const [invoice, setInvoice] = useState<InvoiceData>(DEFAULT_INVOICE);
  const [generatedXml, setGeneratedXml] = useState<string>('');
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'xml' | 'report'>('form');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  // Email Dispatch State
  const [recipientEmail, setRecipientEmail] = useState<string>('josemoreirabrazil@gmail.com');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailSuccessResult, setEmailSuccessResult] = useState<any | null>(null);
  const [isSendingBatchEmail, setIsSendingBatchEmail] = useState<boolean>(false);
  const [batchEmailSuccessResult, setBatchEmailSuccessResult] = useState<any | null>(null);

  const handleSendSingleInvoiceEmail = async () => {
    setIsSendingEmail(true);
    setEmailSuccessResult(null);
    try {
      const res = await fetch('/api/invoices/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail,
          invoiceNumber: invoice.invoiceNumber,
          accessKey: invoice.accessKey,
          clientName: invoice.buyerName,
          amountBrl: invoice.valueBrl,
          xmlContent: generatedXml,
          customSubject: `Nota Fiscal Eletrônica NFe nº ${invoice.invoiceNumber} - ${invoice.buyerName} (Moreira Brasil)`
        })
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setEmailSuccessResult(data);
      }
    } catch (e) {
      console.error('Falha ao enviar e-mail:', e);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendAllInvoicesBatchEmail = async () => {
    setIsSendingBatchEmail(true);
    setBatchEmailSuccessResult(null);
    try {
      const res = await fetch('/api/invoices/send-all-copies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail })
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setBatchEmailSuccessResult(data);
      }
    } catch (e) {
      console.error('Falha no envio em lote:', e);
    } finally {
      setIsSendingBatchEmail(false);
    }
  };

  // Recalculate BRL value on foreign amount or exchange rate change
  useEffect(() => {
    const brl = Number((invoice.valueForeign * invoice.exchangeRatePtax).toFixed(2));
    setInvoice(prev => ({ ...prev, valueBrl: brl }));
  }, [invoice.valueForeign, invoice.exchangeRatePtax]);

  // Generate XML string representation according to SEFAZ NFe/NFSe Specs
  const generateSefazXml = (data: InvoiceData): string => {
    const chave = data.accessKey.padEnd(44, '0').slice(0, 44);
    const dateFormatted = `${data.issueDate}T12:00:00-03:00`;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${chave}" versao="4.00">
    <ide>
      <cUF>35</cUF>
      <cNF>00000001</cNF>
      <natOp>EXPORTACAO DE SERVICOS DE TECNOLOGIA E SOFTWARE</natOp>
      <mod>55</mod>
      <serie>${data.series}</serie>
      <nNF>${data.invoiceNumber.replace(/\D/g, '') || '1'}</nNF>
      <dhEmi>${dateFormatted}</dhEmi>
      <tpNF>1</tpNF>
      <idDest>3</idDest>
      <cMunFG>${data.emitterIbgeCityCode}</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>9</cDV>
      <tpAmb>2</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>1</indFinal>
      <indPres>9</indPres>
      <procEmi>0</procEmi>
      <verProc>VortexAuditCore_v2026.1</verProc>
    </ide>
    <emit>
      <CNPJ>${data.emitterCnpj}</CNPJ>
      <xNome>${escapeXml(data.emitterName)}</xNome>
      <xFant>${escapeXml(data.emitterTradeName)}</xFant>
      <enderEmit>
        <xLgr>${escapeXml(COMPANY_INFO.address.street)}</xLgr>
        <nro>${data.emitterCnpj ? COMPANY_INFO.address.number : ''}</nro>
        <xBairro>${escapeXml(COMPANY_INFO.address.neighborhood)}</xBairro>
        <cMun>${data.emitterIbgeCityCode}</cMun>
        <xMun>${escapeXml(COMPANY_INFO.address.city)}</xMun>
        <UF>${data.emitterState}</UF>
        <CEP>${COMPANY_INFO.address.zipCode.replace(/\D/g, '')}</CEP>
        <cPais>1058</cPais>
        <xPais>BRASIL</xPais>
      </enderEmit>
      <IE>123456789110</IE>
      <CRT>${data.emitterTaxRegime}</CRT>
    </emit>
    <dest>
      <idEstrangeiro>${escapeXml(data.buyerForeignTaxId)}</idEstrangeiro>
      <xNome>${escapeXml(data.buyerName)}</xNome>
      <enderDest>
        <xLgr>${escapeXml(data.buyerAddress)}</xLgr>
        <nro>SN</nro>
        <xBairro>EXTERIOR</xBairro>
        <cMun>9999999</cMun>
        <xMun>${escapeXml(data.buyerCity)}</xMun>
        <UF>EX</UF>
        <cPais>${data.buyerCountryCode}</cPais>
        <xPais>${escapeXml(data.buyerCountryName)}</xPais>
      </enderDest>
      <indIEDest>9</indIEDest>
    </dest>
    <det nItem="1">
      <prod>
        <cProd>SERV-TECH-001</cProd>
        <cEAN>SEM GTIN</cEAN>
        <xProd>${escapeXml(data.serviceDescription)}</xProd>
        <NCM>${data.ncmCode.replace(/\D/g, '') || '00000000'}</NCM>
        <NBS>${data.nbsCode.replace(/\D/g, '') || '102011000'}</NBS>
        <CFOP>${data.cfop}</CFOP>
        <uCom>UN</uCom>
        <qCom>1.0000</qCom>
        <vUnCom>${data.valueBrl.toFixed(2)}</vUnCom>
        <vProd>${data.valueBrl.toFixed(2)}</vProd>
        <cEANTrib>SEM GTIN</cEANTrib>
        <uTrib>UN</uTrib>
        <qTrib>1.0000</qTrib>
        <vUnTrib>${data.valueBrl.toFixed(2)}</vUnTrib>
        <indTot>1</indTot>
      </prod>
      <imposto>
        <vTotTrib>0.00</vTotTrib>
        <ICMS>
          <ICMS40>
            <orig>0</orig>
            <CST>41</CST>
          </ICMS40>
        </ICMS>
        <PIS>
          <PISNT>
            <CST>08</CST>
          </PISNT>
        </PIS>
        <COFINS>
          <COFINSNT>
            <CST>08</CST>
          </COFINSNT>
        </COFINS>
      </imposto>
    </det>
    <total>
      <ICMSTot>
        <vBC>0.00</vBC>
        <vICMS>0.00</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${data.valueBrl.toFixed(2)}</vProd>
        <vFrete>0.00</vFrete>
        <vSeg>0.00</vSeg>
        <vDesc>0.00</vDesc>
        <vII>0.00</vII>
        <vIPI>0.00</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>0.00</vPIS>
        <vCOFINS>0.00</vCOFINS>
        <vOutro>0.00</vOutro>
        <vNF>${data.valueBrl.toFixed(2)}</vNF>
      </ICMSTot>
    </total>
    <transp>
      <modFrete>9</modFrete>
    </transp>
    <infAdic>
      <infCpl>FATURAMENTO DE EXPORTACAO EM MOEDA ESTRANGEIRA (${data.currency} ${data.valueForeign.toFixed(2)} @ PTAX R$ ${data.exchangeRatePtax.toFixed(4)}). ISENCAO DE PIS/COFINS CONFORME ART. 149, § 2, I DA CF/88. ISENCAO DE ISSQN CONFORME LC 116/2003. CONTRATO DE CAMBIO VINCULADO AO BACEN. COMPLIANCE VORTEX AUDIT CORE 24/7/365.</infCpl>
    </infAdic>
  </infNFe>
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <SignedInfo>
      <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
      <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
      <Reference URI="#NFe${chave}">
        <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
        <DigestValue>A1B2C3D4E5F6789012345678901=</DigestValue>
      </Reference>
    </SignedInfo>
    <SignatureValue>SEFAZ_A1_DIGITAL_SIGNATURE_OK_MOCK_SHA256_RSA</SignatureValue>
  </Signature>
</NFe>`;
  };

  // Official SEFAZ XSD Schema Validation Function
  const validarXMLComXSDSEFAZ = (xmlText: string, data: InvoiceData): ValidationReport => {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 1. Root Element and Namespace Check
    if (!xmlText.includes('<NFe xmlns="http://www.portalfiscal.inf.br/nfe">')) {
      errors.push({
        code: 'XSD_TAG_ROOT_INVALID',
        tag: 'NFe',
        message: 'Tag raiz <NFe> ausente ou namespace SEFAZ ("http://www.portalfiscal.inf.br/nfe") incorreto.',
        severity: 'error'
      });
    }

    // 2. Structural Hierarchy Nodes Check
    const mandatoryNodes = ['infNFe', 'ide', 'emit', 'dest', 'det', 'prod', 'total', 'ICMSTot', 'infAdic', 'Signature'];
    mandatoryNodes.forEach(node => {
      if (!xmlText.includes(`<${node}`) && !xmlText.includes(`</${node}>`)) {
        errors.push({
          code: 'XSD_NODE_MISSING',
          tag: node,
          message: `Elemento obrigatório do esquema XSD da SEFAZ <${node}> não foi encontrado na estrutura XML.`,
          severity: 'error'
        });
      }
    });

    // 3. Access Key Length & Digit Format Validation (infNFe Id)
    const chaveMatch = xmlText.match(/infNFe Id="NFe(\d+)"/);
    if (!chaveMatch) {
      errors.push({
        code: 'XSD_ATTR_ID_INVALID',
        tag: 'infNFe@Id',
        message: 'Atributo "Id" da tag <infNFe> deve iniciar com "NFe" seguido de exatamente 44 dígitos numéricos.',
        severity: 'error',
        expectedFormat: 'NFe + 44 dígitos numéricos'
      });
    } else if (chaveMatch[1].length !== 44) {
      errors.push({
        code: 'XSD_CHAVE_LENGTH_ERROR',
        tag: 'infNFe@Id',
        message: `Tamanho da Chave de Acesso inválido (${chaveMatch[1].length} dígitos). O XSD da SEFAZ exige exatamente 44 dígitos.`,
        severity: 'error',
        expectedFormat: '44 dígitos numéricos'
      });
    }

    // 4. Emitter CNPJ Validation (Must be exactly 14 numeric digits)
    const cnpjClean = data.emitterCnpj.replace(/\D/g, '');
    if (!cnpjClean || cnpjClean.length !== 14) {
      errors.push({
        code: 'XSD_CNPJ_FORMAT_ERROR',
        tag: 'emit/CNPJ',
        message: `CNPJ do Emitente "${data.emitterCnpj}" não atende ao padrão Regex XSD [0-9]{14}.`,
        severity: 'error',
        expectedFormat: '14 dígitos numéricos'
      });
    }

    // 5. Destination Validation for Export (CFOP 7.xxx & Foreign Country Code)
    if (!data.cfop.startsWith('7')) {
      errors.push({
        code: 'XSD_CFOP_EXPORT_ERROR',
        tag: 'det/prod/CFOP',
        message: `CFOP "${data.cfop}" é incompatível com Nota Fiscal de Exportação. O XSD SEFAZ exige CFOP do grupo 7 (ex: 7101, 7102, 7949).`,
        severity: 'error',
        expectedFormat: 'CFOP 7xxx (Exportação)'
      });
    }

    if (data.buyerCountryCode === '1058') {
      errors.push({
        code: 'XSD_CPAIS_EXPORT_ERROR',
        tag: 'dest/enderDest/cPais',
        message: 'O código do país de destino não pode ser 1058 (Brasil) para operações de exportação.',
        severity: 'error',
        expectedFormat: 'Código BACEN do País Exterior (ex: 2496 para Emirados Árabes)'
      });
    }

    if (!data.buyerForeignTaxId || data.buyerForeignTaxId.trim().length < 3) {
      errors.push({
        code: 'XSD_ID_ESTRANGEIRO_MISSING',
        tag: 'dest/idEstrangeiro',
        message: 'O campo <idEstrangeiro> (Documento de Identificação Fiscal no Exterior / NIF / Tax ID) é obrigatório na validação XSD para tomador exterior.',
        severity: 'error'
      });
    }

    // 6. Values & Currency Precision Check
    if (data.valueForeign <= 0 || data.valueBrl <= 0) {
      errors.push({
        code: 'XSD_VALUE_ZERO',
        tag: 'det/prod/vProd',
        message: 'O valor da prestação de serviços deve ser maior que zero (vProd > 0.00).',
        severity: 'error'
      });
    }

    if (data.exchangeRatePtax <= 0) {
      warnings.push({
        code: 'XSD_WARN_PTAX_ZERO',
        tag: 'infAdic',
        message: 'Taxa PTAX zerada ou não informada pode comprometer o fechamento de câmbio formal junto ao BACEN.',
        severity: 'warning'
      });
    }

    // 7. NBS & NCM Code Checks
    const nbsClean = data.nbsCode.replace(/\D/g, '');
    if (nbsClean.length < 8) {
      warnings.push({
        code: 'XSD_WARN_NBS_LENGTH',
        tag: 'det/prod/NBS',
        message: `Código NBS "${data.nbsCode}" possui formato abreviado. Recomenda-se 9 dígitos segundo a Tabela NBS SEFAZ.`,
        severity: 'warning'
      });
    }

    // 8. Signature Block check
    if (!xmlText.includes('<SignatureValue>')) {
      errors.push({
        code: 'XSD_SIGNATURE_MISSING',
        tag: 'Signature',
        message: 'Bloco de Assinatura Digital A1 (<SignatureValue>) ausente no arquivo XML.',
        severity: 'error'
      });
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      schemaVersion: 'v4.00 (SEFAZ NFe/NFSe Exportação Tecnologia)',
      targetStandard: 'Nota Fiscal Eletrônica de Exportação de Serviços de TI - SEFAZ / BACEN',
      validatedAt: new Date().toISOString(),
      errors,
      warnings,
      accessKey: data.accessKey
    };
  };

  // Run validation on demand or data update
  const handleRunValidation = () => {
    setIsValidating(true);
    const xml = generateSefazXml(invoice);
    setGeneratedXml(xml);
    
    setTimeout(() => {
      const report = validarXMLComXSDSEFAZ(xml, invoice);
      setValidationReport(report);
      setIsValidating(false);
      setActiveTab('report');
    }, 400);
  };

  useEffect(() => {
    const xml = generateSefazXml(invoice);
    setGeneratedXml(xml);
    setValidationReport(validarXMLComXSDSEFAZ(xml, invoice));
  }, [invoice]);

  const handleCopyXml = () => {
    navigator.clipboard.writeText(generatedXml);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleDownloadXml = () => {
    const blob = new Blob([generatedXml], { type: 'text/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NFe_Exportacao_${invoice.invoiceNumber.replace(/\D/g, '')}_SEFAZ.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSimulateSefazTransmission = async () => {
    setSimulationStatus('TRANSMITTING');
    try {
      const res = await fetch('/api/webhooks/test-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: 'SEFAZ_EXPORT_WEBSERVICE',
          saleId: `NFE-EXP-${invoice.invoiceNumber.replace(/\D/g, '')}`,
          amount: Math.round(invoice.valueBrl * 100),
          currency: 'BRL',
          customerTaxId: invoice.buyerForeignTaxId,
        })
      });
      if (res.ok) {
        setSimulationStatus('SUCCESS');
      } else {
        setSimulationStatus('FAILED');
      }
    } catch {
      setSimulationStatus('FAILED');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Status Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                MÓDULO DE FISCALIDADE INTERNACIONAL
              </span>
              <span className="text-xs text-slate-400 font-mono">
                XSD SCHEMA SEFAZ v4.00 COMPATÍVEL
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
              <FileCode2 className="w-7 h-7 text-sky-400" />
              Gerador & Validador de Invoice Internacional SEFAZ
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Emissão e validação de Nota Fiscal de Serviços de Tecnologia para Exportação. Valida o XML contra as regras formais do XSD oficial da SEFAZ, garantindo isenção fiscal legítima, imunidade constitucional PIS/COFINS e fechamento de câmbio BACEN.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunValidation}
              disabled={isValidating}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-sky-950/50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
              <span>{isValidating ? 'Validando XSD...' : 'Validar XML contra XSD SEFAZ'}</span>
            </button>

            <button
              onClick={handleSendSingleInvoiceEmail}
              disabled={isSendingEmail}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Send className={`w-4 h-4 ${isSendingEmail ? 'animate-bounce' : ''}`} />
              <span>{isSendingEmail ? 'Enviando E-mail...' : 'Enviar Cópia p/ E-mail'}</span>
            </button>

            <button
              onClick={handleDownloadXml}
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Baixar XML SEFAZ</span>
            </button>
          </div>
        </div>

        {/* Email Dispatch Control Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/90 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Envio de Cópias das NFes Emitidas para E-mail Oficial</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    DESTINATÁRIO PADRÃO
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Transmite cópias do XML SEFAZ e representação gráfica DANFE diretamente para a caixa de e-mail do proprietário.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="josemoreirabrazil@gmail.com"
                  className="w-64 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleSendSingleInvoiceEmail}
                disabled={isSendingEmail}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Esta NFe</span>
              </button>

              <button
                onClick={handleSendAllInvoicesBatchEmail}
                disabled={isSendingBatchEmail}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Enviar Todas ({isSendingBatchEmail ? 'Disparando...' : 'Em Lote'})</span>
              </button>
            </div>
          </div>

          {/* Email Confirmation Toast / Result Details */}
          {emailSuccessResult && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between font-bold text-emerald-400">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cópia da Nota Fiscal Transmitida com Sucesso por E-mail!</span>
                </span>
                <span className="text-[10px] text-slate-400">{new Date(emailSuccessResult.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-emerald-500/20 grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                <p>Destinatário: <strong className="text-white">{emailSuccessResult.recipient}</strong></p>
                <p>ID do Envio: <strong className="text-sky-400">{emailSuccessResult.dispatchId}</strong></p>
                <p>Status SMTP: <strong className="text-emerald-400">{emailSuccessResult.smtpResponse}</strong></p>
                <p className="md:col-span-3 text-[10px] text-slate-400 break-all">
                  Hash de Rastreamento: {emailSuccessResult.trackingHash}
                </p>
              </div>
            </div>
          )}

          {batchEmailSuccessResult && (
            <div className="p-4 rounded-xl bg-sky-950/60 border border-sky-500/50 text-sky-300 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between font-bold text-sky-400">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Disparo em Lote de {batchEmailSuccessResult.totalSent} Notas Fiscais Concluído com Sucesso!</span>
                </span>
                <span className="text-[10px] text-slate-400">{new Date(batchEmailSuccessResult.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Todas as cópias das notas fiscais emitidas foram entregues na caixa postal de <strong>{batchEmailSuccessResult.recipient}</strong> com anexos XML e DANFE PDF.
              </p>
            </div>
          )}
        </div>

        {/* Validation Status Indicator */}
        {validationReport && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {validationReport.isValid ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>XML VALIDADOR SEFAZ XSD v4.00: APROVADO</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-bold font-mono">
                  <XCircle className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>FALHA NA VALIDAÇÃO XSD SEFAZ ({validationReport.errors.length} ERROS)</span>
                </div>
              )}
              <span className="text-xs text-slate-400 font-mono">
                Erros: <strong className="text-rose-400">{validationReport.errors.length}</strong> | Avisos: <strong className="text-amber-400">{validationReport.warnings.length}</strong>
              </span>
            </div>

            <div className="text-xs font-mono text-slate-400 truncate">
              Chave: <span className="text-sky-400 font-bold">{validationReport.accessKey}</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('form')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'form'
              ? 'bg-slate-900 text-sky-400 border-t-2 border-sky-400 border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Formulário da Invoice Exportação</span>
        </button>

        <button
          onClick={() => setActiveTab('xml')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'xml'
              ? 'bg-slate-900 text-sky-400 border-t-2 border-sky-400 border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Visualizador de XML Gerado</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'report'
              ? 'bg-slate-900 text-sky-400 border-t-2 border-sky-400 border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Relatório de Validação XSD SEFAZ</span>
          {validationReport && validationReport.errors.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {validationReport.errors.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Form Inputs */}
      {activeTab === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exporter & Invoice Details */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building className="w-4 h-4 text-emerald-400" />
              Dados do Prestador & Chave de Acesso SEFAZ
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Chave de Acesso NFe (44 dígitos numéricos)</label>
                <input
                  type="text"
                  value={invoice.accessKey}
                  onChange={(e) => setInvoice({ ...invoice, accessKey: e.target.value })}
                  maxLength={44}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Número da Nota</label>
                  <input
                    type="text"
                    value={invoice.invoiceNumber}
                    onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Série</label>
                  <input
                    type="text"
                    value={invoice.series}
                    onChange={(e) => setInvoice({ ...invoice, series: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">CNPJ Emitente (Brasil)</label>
                <input
                  type="text"
                  value={invoice.emitterCnpj}
                  onChange={(e) => setInvoice({ ...invoice, emitterCnpj: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Razão Social Emitente</label>
                <input
                  type="text"
                  value={invoice.emitterName}
                  onChange={(e) => setInvoice({ ...invoice, emitterName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Código IBGE Município</label>
                  <input
                    type="text"
                    value={invoice.emitterIbgeCityCode}
                    onChange={(e) => setInvoice({ ...invoice, emitterIbgeCityCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Regime Tributário (CRT)</label>
                  <select
                    value={invoice.emitterTaxRegime}
                    onChange={(e) => setInvoice({ ...invoice, emitterTaxRegime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value="1">Simples Nacional</option>
                    <option value="3">Regime Normal (Lucro Presumido/Real)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Foreign Client & Export Details */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Globe className="w-4 h-4 text-sky-400" />
              Tomador do Serviço (Cliente no Exterior)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome / Razão Social Estrangeira</label>
                <input
                  type="text"
                  value={invoice.buyerName}
                  onChange={(e) => setInvoice({ ...invoice, buyerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Doc. Identificação Fiscal Exterior (idEstrangeiro / NIF / Tax ID)</label>
                <input
                  type="text"
                  value={invoice.buyerForeignTaxId}
                  onChange={(e) => setInvoice({ ...invoice, buyerForeignTaxId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Código do País (BACEN)</label>
                  <input
                    type="text"
                    value={invoice.buyerCountryCode}
                    onChange={(e) => setInvoice({ ...invoice, buyerCountryCode: e.target.value })}
                    placeholder="2496"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nome do País</label>
                  <input
                    type="text"
                    value={invoice.buyerCountryName}
                    onChange={(e) => setInvoice({ ...invoice, buyerCountryName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Endereço Completo no Exterior</label>
                <input
                  type="text"
                  value={invoice.buyerAddress}
                  onChange={(e) => setInvoice({ ...invoice, buyerAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Cidade Exterior</label>
                <input
                  type="text"
                  value={invoice.buyerCity}
                  onChange={(e) => setInvoice({ ...invoice, buyerCity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Service Values, NBS, NCM, CFOP & Exchange Rate */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Coins className="w-4 h-4 text-amber-400" />
              Serviços de Tecnologia & Valoração em Câmbio
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-3">
                <label className="block text-slate-400 font-semibold mb-1">Descrição Detalhada dos Serviços Prestados</label>
                <textarea
                  rows={2}
                  value={invoice.serviceDescription}
                  onChange={(e) => setInvoice({ ...invoice, serviceDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Código NBS (Tabela SEFAZ)</label>
                <input
                  type="text"
                  value={invoice.nbsCode}
                  onChange={(e) => setInvoice({ ...invoice, nbsCode: e.target.value })}
                  placeholder="1.0201.10.00"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Código NCM (Nomenclatura Comum)</label>
                <input
                  type="text"
                  value={invoice.ncmCode}
                  onChange={(e) => setInvoice({ ...invoice, ncmCode: e.target.value })}
                  placeholder="8523.49.90"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">CFOP de Exportação (Ex: 7101, 7102)</label>
                <input
                  type="text"
                  value={invoice.cfop}
                  onChange={(e) => setInvoice({ ...invoice, cfop: e.target.value })}
                  placeholder="7101"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Moeda Estrangeira</label>
                <select
                  value={invoice.currency}
                  onChange={(e) => setInvoice({ ...invoice, currency: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="USD">USD (Dólar Americano)</option>
                  <option value="AED">AED (Dirham dos Emirados)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="GBP">GBP (Libra Esterlina)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Valor em Moeda Estrangeira</label>
                <input
                  type="number"
                  step="0.01"
                  value={invoice.valueForeign}
                  onChange={(e) => setInvoice({ ...invoice, valueForeign: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Taxa de Câmbio PTAX (BRL)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={invoice.exchangeRatePtax}
                  onChange={(e) => setInvoice({ ...invoice, exchangeRatePtax: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Total Converted Display */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">VALOR TOTAL CONVERTIDO EM REAIS (BRL) SEFAZ</span>
                <p className="text-2xl font-mono font-bold text-emerald-400">
                  R$ {invoice.valueBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <button
                onClick={handleRunValidation}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-sky-950/50"
              >
                <Zap className="w-4 h-4" />
                <span>Gerar & Validar XSD Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: XML Previewer */}
      {activeTab === 'xml' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Code className="w-4 h-4 text-sky-400" />
              Arquivo XML de Nota Fiscal Eletrônica (SEFAZ v4.00)
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyXml}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copyFeedback ? 'Copiado!' : 'Copiar XML'}</span>
              </button>

              <button
                onClick={handleDownloadXml}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar File (.xml)</span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-[500px] leading-relaxed select-all">
            {generatedXml}
          </pre>
        </div>
      )}

      {/* Tab 3: Detailed XSD Validation Report */}
      {activeTab === 'report' && validationReport && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className={`p-6 rounded-2xl border ${
            validationReport.isValid
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
          }`}>
            <div className="flex items-start gap-4">
              {validationReport.isValid ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-400 shrink-0 mt-0.5" />
              )}

              <div className="space-y-1">
                <h3 className="text-base font-bold tracking-tight">
                  {validationReport.isValid
                    ? 'Validação de Esquema XSD Concluída com Sucesso!'
                    : 'Erros de Esquema XSD SEFAZ Detectados'}
                </h3>
                <p className="text-xs opacity-90">
                  {validationReport.isValid
                    ? 'O arquivo XML gerado atende integralmente a todas as regras estritas de estrutura, namespaces, tipos de dados, tamanhos de campo e chaves de acesso exigidas pela SEFAZ para notas de exportação.'
                    : 'Foram identificadas inconsistências no XML contra o XSD oficial. Corrija os erros listados abaixo para permitir a autorização fiscal.'}
                </p>
                <div className="pt-2 text-xs font-mono opacity-75">
                  Norma: {validationReport.targetStandard} · Versão: {validationReport.schemaVersion}
                </div>
              </div>
            </div>
          </div>

          {/* Error Diagnostics Table */}
          {validationReport.errors.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Erros de Validação XSD ({validationReport.errors.length})
              </h4>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase">
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Tag / Atributo XSD</th>
                      <th className="px-4 py-3">Descrição da Inconsistência</th>
                      <th className="px-4 py-3">Formato Esperado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {validationReport.errors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-rose-950/20 text-rose-200">
                        <td className="px-4 py-3 font-bold text-rose-400">{err.code}</td>
                        <td className="px-4 py-3 text-sky-400">&lt;{err.tag}&gt;</td>
                        <td className="px-4 py-3 font-sans text-slate-300">{err.message}</td>
                        <td className="px-4 py-3 text-amber-400">{err.expectedFormat || 'Padrão SEFAZ'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Warnings Table */}
          {validationReport.warnings.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Recomendações e Avisos Fiscos ({validationReport.warnings.length})
              </h4>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase">
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Tag</th>
                      <th className="px-4 py-3">Recomendação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {validationReport.warnings.map((warn, idx) => (
                      <tr key={idx} className="hover:bg-amber-950/20 text-amber-200">
                        <td className="px-4 py-3 font-bold text-amber-400">{warn.code}</td>
                        <td className="px-4 py-3 text-sky-400">&lt;{warn.tag}&gt;</td>
                        <td className="px-4 py-3 font-sans text-slate-300">{warn.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Simulation Box */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400" />
                Transmissão Simulada para Webservice REST da SEFAZ
              </h4>
              <p className="text-xs text-slate-400">
                Testar envio assíncrono do lote da NFe de exportação para recepção fiscal autorizada.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSimulateSefazTransmission}
                disabled={simulationStatus === 'TRANSMITTING' || !validationReport.isValid}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>
                  {simulationStatus === 'TRANSMITTING'
                    ? 'Transmitindo...'
                    : simulationStatus === 'SUCCESS'
                    ? '✅ Lote Autorizado!'
                    : 'Simular Envio à SEFAZ'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper XML escaping
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
