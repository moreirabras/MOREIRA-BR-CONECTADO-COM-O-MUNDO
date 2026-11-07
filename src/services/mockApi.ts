/**
 * Mock API service to simulate Mercado Pago and Stripe gateway responses.
 * Used for dashboard development and UI testing.
 */

export interface MockPayment {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'approved' | 'pending' | 'failed';
  gateway: 'mercadopago' | 'stripe';
  createdAt: string;
}

const generateMockPayments = (gateway: 'mercadopago' | 'stripe', count: number): MockPayment[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${gateway === 'mercadopago' ? 'MP' : 'ST'}-${Date.now()}-${i}`,
    amount: Math.floor(Math.random() * 5000) + 100,
    currency: 'BRL',
    status: Math.random() > 0.1 ? (gateway === 'mercadopago' ? 'approved' : 'succeeded') : 'pending',
    gateway,
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));
};

export const mockApi = {
  getPayments: async (gateway: 'mercadopago' | 'stripe'): Promise<MockPayment[]> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return generateMockPayments(gateway, 10);
  },

  getGatewayStats: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      mercadopago: {
        totalVolume: 154000.50,
        transactionCount: 1240,
        successRate: 98.5,
      },
      stripe: {
        totalVolume: 89000.25,
        transactionCount: 890,
        successRate: 99.1,
      },
    };
  },
};
