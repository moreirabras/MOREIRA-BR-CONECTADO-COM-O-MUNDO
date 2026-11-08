import Stripe from 'stripe';
import crypto from 'crypto';

/**
 * SERVIÇO DE GATEWAYS INTERNACIONAIS
 * ----------------------------------
 * Validação e normalização de pagamentos globais para auditoria.
 */
export class InternationalGatewayService {
  /**
   * Valida assinatura Stripe (Dubai/UAE)
   */
  public static verifyStripeSignature(rawBody: Buffer, signature: string, secret: string) {
    const stripe = new Stripe('', { apiVersion: '2026-10-28.endive' }); // Key não necessária para constructEvent
    try {
      return stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      console.error('[STRIPE-VERIFY-ERROR]', err);
      return null;
    }
  }

  /**
   * Valida assinatura Razorpay (Índia)
   */
  public static verifyRazorpaySignature(body: any, signature: string, secret: string) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');
    
    return expectedSignature === signature;
  }
}
