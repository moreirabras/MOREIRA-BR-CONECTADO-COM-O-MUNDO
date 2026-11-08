import crypto from 'crypto';
import { COMPANY_INFO } from '../config/company.ts';
import { KeyProviderService } from './KeyProviderService.ts';

interface DadosInvoice {
  invoiceNumero: string;
  clienteNome: string;
  documentoInternacional: string; // TRN, PAN, Passport ou ID Local
  paisDestino: string;
  moedaEstrangeira: string;
  valorEstrangeiroCentavos: number;
  idTransacaoGateway: string;
}

/**
 * SERVIÇO DE FATURAMENTO INTERNACIONAL (INVOICE GENERATOR)
 * --------------------------------------------------------
 * Gera o documento de Commercial Invoice para exportação de serviços,
 * garantindo o vínculo entre o pilar comercial e o financeiro global.
 */
export class InvoiceService {
  
  /**
   * Gera o XML da Commercial Invoice estruturado para conformidade Bacen/Receita.
   */
  public static gerarDocumentoExportacao(dados: DadosInvoice): string {
    const dataEmissao = new Date().toISOString();
    
    const xmlInvoice = `<?xml version="1.0" encoding="UTF-8"?>
<CommercialInvoice>
  <Header>
    <InvoiceNumber>${dados.invoiceNumero}</InvoiceNumber>
    <IssueDate>${dataEmissao}</IssueDate>
    <ExportNature>12003 - Digital Services Exportation</ExportNature>
    <Compliance>Brazilian Central Bank Normative 3.978</Compliance>
  </Header>
  <Exporter>
    <CorporateName>${COMPANY_INFO.name}</CorporateName>
    <CNPJ>${COMPANY_INFO.cnpj}</CNPJ>
    <Address>${COMPANY_INFO.address.street}, ${COMPANY_INFO.address.number}</Address>
    <City>${COMPANY_INFO.address.city}</City>
    <State>${COMPANY_INFO.address.state}</State>
    <Country>Brazil</Country>
  </Exporter>
  <Importer>
    <FullName>${dados.clienteNome}</FullName>
    <TaxRegistrationNumber>${dados.documentoInternacional}</TaxRegistrationNumber>
    <Country>${dados.paisDestino}</Country>
  </Importer>
  <FinancialDetails>
    <GatewayTransactionID>${dados.idTransacaoGateway}</GatewayTransactionID>
    <Currency>${dados.moedaEstrangeira}</Currency>
    <GrossAmount>${(dados.valorEstrangeiroCentavos / 100).toFixed(2)}</GrossAmount>
  </FinancialDetails>
</CommercialInvoice>`;

    return xmlInvoice;
  }

  /**
   * Gera o selo criptográfico do invoice (Assinatura Digital).
   * Utiliza o Provedor de Chaves Seguras para carregar o certificado A1.
   */
  public static selarInvoice(xml: string): string {
    const privateKey = KeyProviderService.loadPrivateKeyFromPfx();

    try {
      const sign = crypto.createSign('SHA256');
      sign.update(xml);
      return sign.sign(privateKey, 'base64');
    } catch (error) {
      console.error('[INVOICE-SIGN-ERROR]', error);
      return 'SIGNATURE_FAILURE';
    }
  }
}
