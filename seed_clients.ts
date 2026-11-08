import { db } from './src/db/index.ts';
import { transactions, auditLogs } from './src/db/schema.ts';
import crypto from 'crypto';

async function seedGlobalClients() {
  const regions = ['BRAZIL', 'NORTH_AMERICA', 'EUROPE_EN', 'EUROPE_FR', 'MIDDLE_EAST', 'ASIA_IN', 'LATIN_AMERICA'];
  
  console.log('Seeding global clients for broadcast verification...');

  for (const region of regions) {
    const saleId = `SEED-TX-${region}-${Date.now()}`;
    const tx = await db.insert(transactions).values({
      saleId,
      originUrl: 'https://moreirabrasil.com/checkout',
      buyerTaxId: '68.603.032/0001-15',
      originIp: '127.0.0.1',
      webhookPayload: { seeded: true, region },
      bankEndToEndId: `PIX-SEED-${region}`,
      status: 'COMMITTED',
      currency: region === 'BRAZIL' ? 'BRL' : region === 'MIDDLE_EAST' ? 'AED' : 'USD',
      region,
      prevHash: '0',
      currentHash: crypto.createHash('sha256').update(saleId).digest('hex'),
      committedAt: new Date()
    }).returning();

    await db.insert(auditLogs).values({
      transactionId: tx[0].id,
      action: 'PAYMENT_RECEIVED',
      newState: { amount: 29900, regiao: region, status: 'COMMITTED' },
      actor: 'SYSTEM_SEEDER'
    });
    
    console.log(`Seeded client for region: ${region}`);
  }

  process.exit(0);
}

seedGlobalClients().catch(err => {
  console.error(err);
  process.exit(1);
});
