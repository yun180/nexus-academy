import { createGenerateWorker } from './queue';
import type { Worker } from 'bullmq';

let worker: Worker | null = null;

export function initializeWorker() {
  if (!worker && process.env.NODE_ENV === 'development') {
    worker = createGenerateWorker();
    console.log('BullMQ worker initialized');
    
    worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });
    
    worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });
  }
  return worker;
}

export function getWorker() {
  return worker;
}
