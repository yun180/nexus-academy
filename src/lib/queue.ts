import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { getAIProvider } from './ai-providers';
import { GoogleWorkspaceIntegration } from './google-workspace';

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
    subject: string;
    grade: string;
    unit: string;
    difficulty: string;
  };
}

export interface GenerateJobResult {
  title: string;
  subject: string;
  grade: string;
  unit: string;
  difficulty: string;
  problems: Array<{
    question: string;
    answer: string;
    explanation: string;
  }>;
  spreadsheetUrl?: string;
  documentUrl?: string;
}

export const createGenerateWorker = () => {
  return new Worker<GenerateJobData, GenerateJobResult>(
    'generateQueue',
    async (job: Job<GenerateJobData>) => {
      const { userId, payload } = job.data;
      
      await job.updateProgress(25);
      
      const aiProvider = getAIProvider();
      
      await job.updateProgress(50);
      
      const response = await aiProvider.generateMaterialContent(
        payload.subject,
        payload.grade,
        payload.unit,
        payload.difficulty
      );
      
      await job.updateProgress(75);
      
      const parsedContent = parseGeneratedContent(response);
      const formattedContent = formatMathResponse(parsedContent);
      
      const result: GenerateJobResult = {
        title: `${payload.subject} ${payload.grade} ${payload.unit} (${payload.difficulty})`,
        subject: payload.subject,
        grade: payload.grade,
        unit: payload.unit,
        difficulty: payload.difficulty,
        problems: formattedContent.problems
      };
      
      try {
        const workspace = new GoogleWorkspaceIntegration();
        const spreadsheetUrl = await workspace.saveToSpreadsheet(result, userId);
        const documentUrl = await workspace.saveToDocument(result, userId);
        
        result.spreadsheetUrl = spreadsheetUrl;
        result.documentUrl = documentUrl;
        
        console.log(`Google Workspace integration completed for user ${userId}`);
        console.log(`Spreadsheet: ${spreadsheetUrl}`);
        console.log(`Document: ${documentUrl}`);
      } catch (error) {
        console.error('Google Workspace integration error:', error);
      }
      
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


function parseGeneratedContent(content: string): { problems: Array<{ question: string; answer: string; explanation: string; }> } {
  const problems: Array<{ question: string; answer: string; explanation: string; }> = [];
  
  const sections = content.split(/問題\d+:/);
  
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const answerMatch = section.match(/解答\d+:\s*([\s\S]*?)(?=解説\d+:|$)/);
    const explanationMatch = section.match(/解説\d+:\s*([\s\S]*?)(?=問題\d+:|$)/);
    
    const questionText = section.split(/解答\d+:/)[0]?.trim() || '';
    const answerText = answerMatch?.[1]?.trim() || '';
    const explanationText = explanationMatch?.[1]?.trim() || '';
    
    if (questionText && answerText && explanationText) {
      problems.push({
        question: questionText,
        answer: answerText,
        explanation: explanationText
      });
    }
  }
  
  return { problems };
}

function formatMathResponse(content: { problems: Array<{ question: string; answer: string; explanation: string; }> }): { problems: Array<{ question: string; answer: string; explanation: string; }> } {
  const formatText = (text: string): string => {
    return text
      .replace(/\\?\\\(/g, '')
      .replace(/\\?\\\)/g, '')
      .replace(/\\\[/g, '')
      .replace(/\\\]/g, '')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1÷$2')
      .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/\+/g, '＋')
      .replace(/-/g, '−')
      .replace(/\*/g, '×')
      .replace(/\//g, '÷')
      .replace(/\^(\d+)/g, (match, num) => {
        const superscripts: { [key: string]: string } = {
          '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
          '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
        };
        return num.split('').map((digit: string) => superscripts[digit] || digit).join('');
      });
  };
  
  return {
    problems: content.problems.map(problem => ({
      question: formatText(problem.question),
      answer: formatText(problem.answer),
      explanation: formatText(problem.explanation)
    }))
  };
}
