import { accountingQueue } from '@/lib/accounting-queue';
import { pool } from '@/lib/db';
import { SYNC_COMPANY_JOB } from '@repo/shared';

export async function POST(req: Request) {
  const { companyId, provider, entities } = await req.json();

  if (!companyId || !provider || !entities || entities.length === 0) {
    return new Response(JSON.stringify({ error: { message: 'Missing parameters' } }), { status: 400 });
  }

  await pool.query(
    `UPDATE accounting_connections
     SET last_sync_requested_at = NOW(), updated_at = NOW()
     WHERE company_id = $1`,
    [companyId]
  );

  const job = await accountingQueue.add(SYNC_COMPANY_JOB, { companyId, provider, entities }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000
    }
  });
  
  return Response.json(
    { data: { jobId: job.id } },
    { status: 201 }
  );
}
