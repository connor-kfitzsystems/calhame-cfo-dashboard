import { Entity } from "../types";
import { AccountingQueueJob, Queue } from "../types/queues.types";

export const ACCOUNTING_QUEUE: Queue = 'accounting-sync';

export const SYNC_COMPANY_JOB: AccountingQueueJob = 'sync-company';

export const ENTITIES: Entity[] = ["revenue"];
