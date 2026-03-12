import dotenv from 'dotenv';

dotenv.config();

import { Worker } from 'bullmq';
import { redisConnection } from './lib/redis.js';
import { handleSyncCompany } from './jobs/sync-company.job.js';
import { ACCOUNTING_QUEUE, SYNC_COMPANY_JOB } from '@repo/shared';

console.log('Worker starting...');

const worker = new Worker(
  ACCOUNTING_QUEUE,
  async job => {
    switch (job.name) {
      case SYNC_COMPANY_JOB:
        await handleSyncCompany(job);
        break;

      default:
        console.warn(`Unknown job: ${job.name}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 5
  }
);

worker.on('completed', job => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log('Worker running...');
