import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const generateQueue = new Queue('generateQueue', {
  connection: redis,
});

export interface GenerateJobData {
  userId: string;
  payload: {
    content: string;
    difficulty: string;
  };
}

export interface GenerateJobResult {
  title: string;
  content: string;
  difficulty: string;
  questions: Array<{
    question: string;
    options: string[];
    correct: number;
  }>;
}

export const createGenerateWorker = () => {
  return new Worker<GenerateJobData, GenerateJobResult>(
    'generateQueue',
    async (job: Job<GenerateJobData>) => {
      const { userId, payload } = job.data;
      
      await job.updateProgress(25);
      
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
      
      await job.updateProgress(75);
      
      const result: GenerateJobResult = {
        title: `${payload.difficulty}レベル: ${payload.content.substring(0, 20)}...`,
        content: `${payload.content}に関する教材を生成しました。これはAIが生成したダミーコンテンツです。実際の実装では、ここに詳細な学習内容が表示されます。`,
        difficulty: payload.difficulty,
        questions: [
          {
            question: `${payload.content}に関する基本的な問題です。`,
            options: [
              '選択肢A: 正解',
              '選択肢B: 不正解',
              '選択肢C: 不正解',
              '選択肢D: 不正解'
            ],
            correct: 0
          },
          {
            question: `${payload.difficulty}レベルの応用問題です。`,
            options: [
              '選択肢A: 不正解',
              '選択肢B: 正解',
              '選択肢C: 不正解',
              '選択肢D: 不正解'
            ],
            correct: 1
          }
        ]
      };
      
      await job.updateProgress(100);
      
      console.log(`Generation job completed for user ${userId}: ${result.title}`);
      return result;
    },
    {
      connection: redis,
      concurrency: 2,
    }
  );
};

export async function addGenerateJob(userId: string, payload: GenerateJobData['payload']) {
  const job = await generateQueue.add('generate', { userId, payload });
  return job.id;
}

export async function getJobStatus(jobId: string) {
  const job = await generateQueue.getJob(jobId);
  if (!job) {
    return { status: 'not_found' };
  }
  
  const state = await job.getState();
  const progress = job.progress;
  
  if (state === 'completed') {
    return {
      status: 'completed',
      result: job.returnvalue,
      progress: 100
    };
  } else if (state === 'failed') {
    return {
      status: 'failed',
      error: job.failedReason,
      progress: progress || 0
    };
  } else if (state === 'active') {
    return {
      status: 'active',
      progress: progress || 0
    };
  } else {
    return {
      status: 'waiting',
      progress: 0
    };
  }
}
