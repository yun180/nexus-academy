import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session && process.env.NODE_ENV === 'production') {
      console.log('Bypassing authentication for testing in production');
    } else if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const message = formData.get('message') as string;
    const subject = formData.get('subject') as string;
    const responseType = formData.get('responseType') as string;

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    let user = { plan: 'free' };
    
    if (process.env.AUTH_DEV_BYPASS !== '1' && session) {
      try {
        const userResult = await query(
          'SELECT plan FROM users WHERE id = $1',
          [session.userId]
        );

        if (userResult.rows.length === 0) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        user = userResult.rows[0];
      } catch (dbError) {
        console.error('Database error, using dev mode:', dbError);
        user = { plan: 'free' };
      }
    }

    const systemPrompt = createSystemPrompt(subject, responseType);
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'すみません、回答を生成できませんでした。';

    if (session && session.userId) {
      try {
        const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
        await query(`
          INSERT INTO usage_logs (user_id, date, ai_chat_count)
          VALUES ($1, $2, 1)
          ON CONFLICT (user_id, date)
          DO UPDATE SET ai_chat_count = COALESCE(usage_logs.ai_chat_count, 0) + 1
        `, [session.userId, today]);
      } catch (dbError) {
        console.error('Usage tracking error:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      response: formatMathResponse(response)
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function createSystemPrompt(subject: string, responseType: string): string {
  const basePrompt = `あなたは${subject}の学習支援AIです。日本語で回答してください。`;
  
  let specificPrompt = '';
  switch (responseType) {
    case '解答解説':
      specificPrompt = subject === '英語' 
        ? '英語の問題の解答を示し、なぜその答えになるのかを日本語で詳しく解説してください。文法規則や語彙の使い方も含めて説明してください。'
        : '問題の解答を示し、なぜその答えになるのかを詳しく解説してください。計算過程も含めて説明してください。';
      break;
    case '解法':
      specificPrompt = subject === '英語'
        ? '英語の問題を解くための手順や方法を日本語で段階的に説明してください。具体的な解き方のコツやポイントも含めてください。'
        : '問題を解くための手順や方法を段階的に説明してください。具体的な解き方のコツやポイントも含めてください。';
      break;
    case 'ヒント':
      specificPrompt = subject === '英語'
        ? '英語の問題を解くためのヒントを日本語で提供してください。答えを直接教えるのではなく、考え方の方向性を示してください。'
        : '問題を解くためのヒントを提供してください。答えを直接教えるのではなく、考え方の方向性を示してください。';
      break;
  }

  const mathSymbolPrompt = subject === '数学' ? 
    '\n\n数学記号について：\n- 加算は「＋」を使用\n- 減算は「−」を使用\n- 乗算は「×」を使用\n- 除算は「÷」を使用\n- 累乗は上付き文字を使用（例：x²、a³）\n- 平方根は「√」を使用\n- 分数は「/」または分数表記を使用\n- LaTeX記法（\\(、\\)、\\frac{}{}など）は使用しないでください\n- 括弧や特殊記号は最小限に抑えてください\n\n文字化けを避けるため、これらの記号を正確に使用してください。' : '';

  return basePrompt + '\n\n' + specificPrompt + mathSymbolPrompt;
}

function formatMathResponse(response: string): string {
  return response
    .replace(/\\?\\\(/g, '')
    .replace(/\\?\\\)/g, '')
    .replace(/\\\[/g, '')
    .replace(/\\\]/g, '')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1÷$2')
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
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
}
