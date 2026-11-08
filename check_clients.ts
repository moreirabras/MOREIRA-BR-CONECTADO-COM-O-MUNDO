import { db } from './src/db/index.ts';
import { transactions } from './src/db/schema.ts';
import { count, eq } from 'drizzle-orm';

async function checkClients() {
  try {
    const [res] = await db.select({ value: count() }).from(transactions).where(eq(transactions.status, 'COMMITTED'));
    console.log(`TOTAL_COMMITTED_CLIENTS: ${res.value}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
  process.exit(0);
}

checkClients();
