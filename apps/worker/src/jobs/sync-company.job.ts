import { Job } from 'bullmq';
import { syncQuickBooksCompany } from '../services/quickbooks.service';
import { Entity } from '@repo/shared';

interface SyncCompanyJobData {
  companyId: string;
  provider: string;
  entities: Entity[];
}

export async function handleSyncCompany(job: Job<SyncCompanyJobData>) {
  const { companyId, provider, entities } = job.data;

  console.log(`Processing sync job for ${companyId} via ${provider}`);

  switch (provider) {
    case 'quickbooks':
      await syncQuickBooksCompany(companyId, entities);
      break;

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
