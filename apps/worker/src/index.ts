import dotenv from 'dotenv';

dotenv.config();

import { Worker, Queue } from 'bullmq';
import { redisConnection } from './lib/redis.js';
import { handleSyncCompany } from './jobs/sync-company.job.js';
import { handleScheduledSync } from './jobs/scheduled-sync.job.js';
import { ACCOUNTING_QUEUE, SYNC_COMPANY_JOB, SCHEDULED_SYNC_JOB } from '@repo/shared';

console.log('Worker starting...');

const MAX_ATTEMPTS = 3;
const BASE_DELAY = 60000;

const accountingQueue = new Queue(ACCOUNTING_QUEUE, { connection: redisConnection });

const worker = new Worker(
  ACCOUNTING_QUEUE,
  async job => {
    try {
      switch (job.name) {
        case SYNC_COMPANY_JOB:
          await handleSyncCompany(job);
          break;

        case SCHEDULED_SYNC_JOB:
          await handleScheduledSync();
          break;

        default:
          console.warn(`Unknown job: ${job.name}`);
      }
    } catch (err) {
      const attemptsMade = job.data.attemptsMade || 0;

      if (attemptsMade < MAX_ATTEMPTS) {
        const nextAttempts = attemptsMade + 1;
        const delay = BASE_DELAY * Math.pow(2, attemptsMade);

        await accountingQueue.add(
          job.name,
          {
            ...job.data,
            attemptsMade: nextAttempts,
          },
          {
            delay,
            removeOnComplete: true,
            removeOnFail: false,
          }
        );

        console.warn(
          `Retrying job ${job.name} in ${delay}ms (attempt ${nextAttempts}/${MAX_ATTEMPTS})`
        );

        return;
      }

      console.error(`Job ${job.name} failed after ${MAX_ATTEMPTS} attempts`, err);
      throw err;
    }
  },
  {
    connection: redisConnection,
    drainDelay: 30,
    concurrency: 2,
    lockDuration: 60000,
    stalledInterval: 60000,
    maxStalledCount: 1
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

  console.error(`[FINAL FAILURE] Job ${job.id} (${job.name}) failed after all retries`, {
    jobId: job.id,
    jobName: job.name,
    jobData: job.data,
    error: err.message,
    stack: err.stack
  });
});


(async () => {
  await accountingQueue.add(
    SCHEDULED_SYNC_JOB,
    {},
    {
      repeat: {
        pattern: '0 2 * * *'
      },
      jobId: 'daily-sync',
      removeOnComplete: true
    }
  );

  console.log('[Scheduled Sync] Configured to run daily at 2 AM');
  console.log('Worker running...');
})().catch((err) => {
  console.error('Failed to schedule daily sync:', err);
  process.exit(1);
});
