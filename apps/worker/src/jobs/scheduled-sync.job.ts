import { Queue } from 'bullmq';
import { getActiveAccountingConnections } from '../lib/queries/accounting_connections/get-active.js';
import { redisConnection } from '../lib/redis.js';
import { ACCOUNTING_QUEUE, SYNC_COMPANY_JOB, ENTITIES } from '@repo/shared';

const accountingQueue = new Queue(ACCOUNTING_QUEUE, { connection: redisConnection });

export async function handleScheduledSync() {
  console.log('[Scheduled Sync] Starting daily sync for all active connections...');
  
  const connections = await getActiveAccountingConnections();
  
  for (const connection of connections) {
    await accountingQueue.add(SYNC_COMPANY_JOB, {
      companyId: connection.company_id,
      provider: 'quickbooks',
      entities: ENTITIES
    }, {
      removeOnComplete: true,
      removeOnFail: false
    });
  }
  
  console.log(`[Scheduled Sync] Queued ${connections.length} companies for sync`);
}
