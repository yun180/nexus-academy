import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAIProvider } from '@/lib/ai-providers';
import { GoogleWorkspaceIntegration } from '@/lib/google-workspace';
import { GenerateJobResult } from '@/lib/queue';

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
      .replace(/×××/g, 'x')
      .replace(/xxx/g, 'x')
      .replace(/XXX/g, 'x')
      .replace(/\*\*\*/g, 'x')
      .replace(/\?\?\?/g, 'x')
      .replace(/\b([a-zA-Z])\s*\+\s*/g, '$1 ＋ ')
      .replace(/(\d+)\s*\+\s*/g, '$1 ＋ ')
      .replace(/\s*\+\s*/g, ' ＋ ')
      .replace(/\b([a-zA-Z])\s*-\s*/g, '$1 − ')
      .replace(/(\d+)\s*-\s*/g, '$1 − ')
      .replace(/\s*-\s*/g, ' − ')
      .replace(/\b([a-zA-Z])\s*\*\s*/g, '$1 × ')
      .replace(/(\d+)\s*\*\s*/g, '$1 × ')
      .replace(/\s*\*\s*/g, ' × ')
      .replace(/\b([a-zA-Z])\s*\/\s*/g, '$1 ÷ ')
      .replace(/(\d+)\s*\/\s*/g, '$1 ÷ ')
      .replace(/\s*\/\s*/g, ' ÷ ')
      .replace(/\b([a-zA-Z])\^(\d+)/g, (match, variable, num) => {
        const superscripts: { [key: string]: string } = {
          '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
          '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
        };
        const superscript = num.split('').map((digit: string) => superscripts[digit] || digit).join('');
        return variable + superscript;
      })
      .replace(/(\d+)\^(\d+)/g, (match, base, num) => {
        const superscripts: { [key: string]: string } = {
          '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
          '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
        };
        const superscript = num.split('').map((digit: string) => superscripts[digit] || digit).join('');
        return base + superscript;
      })
      .replace(/\^(\d+)/g, (match, num) => {
        const superscripts: { [key: string]: string } = {
          '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
          '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
        };
        return num.split('').map((digit: string) => superscripts[digit] || digit).join('');
      })
      .replace(/√\s*(\d+)/g, '√$1')
      .replace(/sqrt\(([^)]+)\)/g, '√$1')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  return {
    problems: content.problems.map(problem => ({
      question: formatText(problem.question),
      answer: formatText(problem.answer),
      explanation: formatText(problem.explanation)
    }))
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('Generate start - beginning request processing');
    const session = await getCurrentUser();
    
    const shouldBypass = process.env.NODE_ENV === 'production' || process.env.AUTH_DEV_BYPASS === '1';
    if (!session && shouldBypass) {
      console.log('Bypassing authentication for testing - session is null');
    } else if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { subject, grade, unit, difficulty } = await request.json();
    console.log('Generate start - request params:', { subject, grade, unit, difficulty });

    console.log('Generate start - getting AI provider');
    const aiProvider = getAIProvider();
    console.log('Generate start - AI provider obtained, calling generateMaterialContent');
    const response = await aiProvider.generateMaterialContent(subject, grade, unit, difficulty);
    console.log('Generate start - AI response received, length:', response.length);

    console.log('Generate start - parsing content');
    const parsedContent = parseGeneratedContent(response);
    console.log('Generate start - parsed problems count:', parsedContent.problems.length);
    
    console.log('Generate start - formatting math response');
    const formattedContent = formatMathResponse(parsedContent);
    console.log('Generate start - formatted problems count:', formattedContent.problems.length);

    const result: GenerateJobResult = {
      title: `${subject} ${grade} ${unit} (${difficulty})`,
      subject,
      grade,
      unit,
      difficulty,
      problems: formattedContent.problems
    };
    console.log('Generate start - result object created');

    try {
      if (process.env.GOOGLE_PROJECT_ID && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        const workspace = new GoogleWorkspaceIntegration();
        const userId = session?.userId || 'test-user';
        result.spreadsheetUrl = await workspace.saveToSpreadsheet(result, userId);
        result.documentUrl = await workspace.saveToDocument(result);
        console.log(`Google Workspace integration completed for user ${userId}`);
      }
    } catch (error) {
      console.error('Google Workspace integration error:', error);
      result.spreadsheetUrl = undefined;
      result.documentUrl = undefined;
    }

    console.log('Generate start - returning successful response');
    return NextResponse.json({
      status: 'completed',
      result,
      progress: 100
    });
  } catch (error) {
    console.error('Generate start error - detailed:', error);
    console.error('Generate start error - stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Generate start error - message:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
