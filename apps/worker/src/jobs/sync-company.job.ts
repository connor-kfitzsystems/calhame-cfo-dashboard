import { Job } from 'bullmq';
import { syncQuickBooksCompany } from '../services/quickbooks.service';

interface SyncCompanyJobData {
  companyId: string;
  provider: string;
}

export async function handleSyncCompany(job: Job<SyncCompanyJobData>) {
  const { companyId, provider } = job.data;

  console.log(`Processing sync job for ${companyId} via ${provider}`);

  switch (provider) {
    case 'quickbooks':
      await syncQuickBooksCompany(companyId);
      break;

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
