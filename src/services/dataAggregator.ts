import { Stripe } from 'stripe';
import { MercadoPagoConfig, Payment } from 'mercadopago';

/**
 * Data Aggregator Service
 * Integrates directly with Stripe and Mercado Pago APIs to fetch real financial data.
 */
export class DataAggregatorService {
  private static stripe: Stripe | null = null;
  private static mpClient: MercadoPagoConfig | null = null;

  private static init() {
    if (!this.stripe && process.env.STRIPE_API_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_API_KEY, {
        apiVersion: '2025-01-27.acacia' as any,
      });
    }

    if (!this.mpClient && process.env.MERCADOPAGO_ACCESS_TOKEN) {
      this.mpClient = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
        options: { timeout: 5000 }
      });
    }
  }

  /**
   * Fetches real balance from Stripe
   */
  static async getStripeBalance() {
    this.init();
    if (!this.stripe) return { available: 0, pending: 0 };

    try {
      const balance = await this.stripe.balance.retrieve();
      const available = balance.available.reduce((acc, curr) => acc + curr.amount, 0);
      const pending = balance.pending.reduce((acc, curr) => acc + curr.amount, 0);
      
      return {
        available: available / 100, // Stripe values are in cents
        pending: pending / 100,
        currency: balance.available[0]?.currency.toUpperCase() || 'BRL'
      };
    } catch (error) {
      console.error('[STRIPE_BALANCE_ERR]', error);
      return { available: 0, pending: 0 };
    }
  }

  /**
   * Fetches real balance from Mercado Pago (Simulated via API search as MP balance retrieve is account-level)
   * Note: In production, you would use the Balance API. Here we search approved payments.
   */
  static async getMercadoPagoBalance() {
    this.init();
    if (!this.mpClient) return { available: 0 };

    try {
      const payment = new Payment(this.mpClient);
      const search = await payment.search({
        options: {
          status: 'approved',
          range: 'date_created',
          begin_date: 'NOW-30DAYS',
          end_date: 'NOW'
        }
      });

      const total = search.results?.reduce((acc, curr) => acc + (curr.transaction_amount || 0), 0) || 0;
      return { available: total };
    } catch (error) {
      console.error('[MP_BALANCE_ERR]', error);
      return { available: 0 };
    }
  }
}
