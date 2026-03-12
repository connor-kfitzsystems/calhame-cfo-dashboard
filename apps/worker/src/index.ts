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
  if (!job) {
    console.error('Job failed with no job data:', err);
    return;
  }

  const attemptInfo = `attempt ${job.attemptsMade}/${job.opts.attempts || 1}`;
  const isLastAttempt = job.attemptsMade >= (job.opts.attempts || 1);
  
  if (isLastAttempt) {
    console.error(`[FINAL FAILURE] Job ${job.id} exhausted all retries (${attemptInfo})`, {
      jobId: job.id,
      jobName: job.name,
      jobData: job.data,
      error: err.message,
      stack: err.stack
    });
  } else {
    console.warn(`[RETRY PENDING] Job ${job.id} failed (${attemptInfo}):`, err.message);
  }
});

console.log('Worker running...');
