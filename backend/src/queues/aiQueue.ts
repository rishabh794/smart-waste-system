import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '../services/redis.js';
import { processAiAnalysisJob } from '../services/aiAnalysis.js';

export const AI_QUEUE_NAME = 'ai-analysis-queue';

export const aiQueue = redisConnection 
  ? new Queue(AI_QUEUE_NAME, { connection: redisConnection as any })
  : null;

export const aiWorker = redisConnection
  ? new Worker(
      AI_QUEUE_NAME,
      async (job: Job<{ reportId: string; imageUrl: string }>) => {
        const { reportId, imageUrl } = job.data;
        console.log(`[Worker] Processing AI analysis for report ${reportId}`);
        await processAiAnalysisJob(reportId, imageUrl);
      },
      { connection: redisConnection as any }
    )
  : null;

if (aiWorker) {
  aiWorker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed!`);
  });

  aiWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err);
  });
}
