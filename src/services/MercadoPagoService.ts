import { MercadoPagoConfig, Payment } from 'mercadopago';
import { AuditService } from './AuditService.ts';

/**
 * SERVIÇO DE INTEGRAÇÃO MERCADO PAGO
 * ----------------------------------
 * Processa pagamentos e vincula à Auditoria Forense.
 */
export class MercadoPagoService {
  private static getAccessToken(): string {
    const isSandbox = process.env.MERCADO_PAGO_ENABLE_SANDBOX === 'true';
    if (isSandbox && process.env.MERCADO_PAGO_SANDBOX_ACCESS_TOKEN) {
      return process.env.MERCADO_PAGO_SANDBOX_ACCESS_TOKEN;
    }
    return (
      process.env.MERCADO_PAGO_PROD_ACCESS_TOKEN ||
      process.env.MERCADOPAGO_ACCESS_TOKEN ||
      process.env.MERCADO_PAGO_SANDBOX_ACCESS_TOKEN ||
      ''
    );
  }

  public static getClient() {
    return new MercadoPagoConfig({
      accessToken: this.getAccessToken(),
    });
  }

  /**
   * Processa o Webhook de Notificação do Mercado Pago.
   * Converte o pagamento do MP em um "Tríplice Vínculo" auditável.
   */
  public static async handleNotification(paymentId: string) {
    const paymentClient = new Payment(this.getClient());

    try {
      // 1. Busca detalhes do pagamento no MP
      const payment = await paymentClient.get({ id: paymentId });

      if (payment.status === 'approved') {
        console.log(`[MP-INTEGRATION] Pagamento aprovado: ${paymentId}`);

        // 2. Transforma em um registro de auditoria forense
        // O ID do pagamento do MP serve como a prova bancária (Pilar Bancário)
        await AuditService.processPayment({
          saleId: payment.external_reference || `MP-${paymentId}`,
          originUrl: 'mercadopago-webhook',
          buyerTaxId: payment.payer?.identification?.number || '00000000000',
          originIp: 'mercadopago-cloud',
          payload: payment,
          bankEndToEndId: `MP-TRANSACTION-${paymentId}`
        });

        return { success: true, status: 'approved' };
      }

      return { success: false, status: payment.status };
    } catch (error: any) {
      console.error('[MP-ERROR] Falha ao processar notificação:', error.message);
      throw error;
    }
  }
}
