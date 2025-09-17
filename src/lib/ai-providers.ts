import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIProvider {
  generateContent(prompt: string, systemPrompt: string): Promise<string>;
  generateMaterialContent(subject: string, grade: string, unit: string, difficulty: string): Promise<string>;
  generateQuizContent(subject: string, grade: string, unit: string, difficulty: string, questionCount: number): Promise<string>;
}

export class OpenAIProvider implements AIProvider {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  async generateContent(prompt: string, systemPrompt: string): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });
    return completion.choices[0]?.message?.content || '';
  }
  
  async generateMaterialContent(subject: string, grade: string, unit: string, difficulty: string): Promise<string> {
    const systemPrompt = this.createMaterialGenerationPrompt(subject, grade, unit, difficulty);
    const userPrompt = `${subject}の${unit}について、${difficulty}レベルの問題を3問作成してください。`;
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });
    
    return completion.choices[0]?.message?.content || '';
  }

  async generateQuizContent(subject: string, grade: string, unit: string, difficulty: string, questionCount: number): Promise<string> {
    const systemPrompt = this.createQuizGenerationPrompt(subject, grade, unit, difficulty);
    const userPrompt = `${subject}の${unit}について、${difficulty}レベルの選択問題を${questionCount}問作成してください。`;
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 3000,
      temperature: 0.7,
    });
    
    return completion.choices[0]?.message?.content || '';
  }

  private createMaterialGenerationPrompt(subject: string, grade: string, unit: string, difficulty: string): string {
    const basePrompt = `あなたは${subject}の教材作成AIです。${grade}の${unit}について、${difficulty}レベルの学習教材を作成してください。`;
    
    const formatInstructions = `
以下の形式で出力してください：

**重要な注意事項**：
- 変数は必ずx, y, a, b等の具体的な文字を使用してください
- 「×××」「xxx」「XXX」などのプレースホルダーは絶対に使用しないでください
- 数式は明確で読みやすく記述してください
- 変数名は一貫して使用してください（例：xを使ったらxで統一）

**演算記号の使用方法**：
- 足し算：+ （例：x + 5）
- 引き算：- （例：x - 3）
- 掛け算：* （例：2*x または 2x）
- 割り算：/ （例：x/2）
- 平方根：√ （例：√16）

**累乗（指数）の記述**：
- x^2, y^3, a^4 のように記述してください
- 例：x^2 + 5x + 6 = 0

**重要：プレースホルダーの禁止**：
- 「×××」「xxx」「XXX」「***」「???」などは絶対に使用しないでください
- 必ず具体的な変数名（x, y, a, b等）を使用してください

**数式の例**：
- 正しい例：x^2 - 5x + 6 = 0
- 間違った例：×××^2 - 5××× + 6 = 0

**出力形式**：
問題1:
[問題文]

解答1:
[解答]

解説1:
[詳しい解説]

問題2:
[問題文]

解答2:
[解答]

解説2:
[詳しい解説]

問題3:
[問題文]

解答3:
[解答]

解説3:
[詳しい解説]
`;
    
    return basePrompt + formatInstructions;
  }

  private createQuizGenerationPrompt(subject: string, grade: string, unit: string, difficulty: string): string {
    const basePrompt = `あなたは${subject}の小テスト作成AIです。${grade}の${unit}について、${difficulty}レベルの選択問題を作成してください。`;
    
    const formatInstructions = `
以下の形式で出力してください：

**重要な注意事項**：
- 変数は必ずx, y, a, b等の具体的な文字を使用してください
- 「×××」「xxx」「XXX」などのプレースホルダーは絶対に使用しないでください
- 数式は明確で読みやすく記述してください
- 変数名は一貫して使用してください（例：xを使ったらxで統一）

**演算記号の使用方法**：
- 足し算：+ （例：x + 5）
- 引き算：- （例：x - 3）
- 掛け算：* （例：2*x または 2x）
- 割り算：/ （例：x/2）
- 平方根：√ （例：√16）

**累乗（指数）の記述**：
- x^2, y^3, a^4 のように記述してください
- 例：x^2 + 5x + 6 = 0

**重要：プレースホルダーの禁止**：
- 「×××」「xxx」「XXX」「***」「???」などは絶対に使用しないでください
- 必ず具体的な変数名（x, y, a, b等）を使用してください

**出力形式**：
問題1:
[問題文]

選択肢1:
A. [選択肢A]
B. [選択肢B]
C. [選択肢C]
D. [選択肢D]

正解1: A

解説1:
[詳しい解説]

問題2:
[問題文]

選択肢2:
A. [選択肢A]
B. [選択肢B]
C. [選択肢C]
D. [選択肢D]

正解2: B

解説2:
[詳しい解説]
`;
    
    return basePrompt + formatInstructions;
  }
}

export class GeminiProvider implements AIProvider {
  private genai: GoogleGenerativeAI;
  
  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.nexus_api_key;
    console.log('GeminiProvider - Initializing with API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'None');
    console.log('GeminiProvider - Environment NODE_ENV:', process.env.NODE_ENV);
    console.log('GeminiProvider - Full API key length:', apiKey ? apiKey.length : 0);
    
    if (!apiKey || apiKey === 'a') {
      console.error('GeminiProvider - API key validation failed:', { apiKey: apiKey ? 'present' : 'missing', length: apiKey ? apiKey.length : 0 });
      throw new Error('Invalid or missing Gemini API key');
    }
    
    try {
      this.genai = new GoogleGenerativeAI(apiKey);
      console.log('GeminiProvider - GoogleGenerativeAI instance created successfully');
    } catch (error) {
      console.error('GeminiProvider - Failed to create GoogleGenerativeAI instance:', error);
      throw error;
    }
  }
  
  async generateContent(prompt: string, systemPrompt: string): Promise<string> {
    const model = this.genai.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      }
    });
    
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  }
  
  async generateMaterialContent(subject: string, grade: string, unit: string, difficulty: string): Promise<string> {
    const model = this.genai.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7,
      }
    });
    
    const systemPrompt = this.createMaterialGenerationPrompt(subject, grade, unit, difficulty);
    const userPrompt = `${subject}の${unit}について、${difficulty}レベルの問題を3問作成してください。`;
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  }

  async generateQuizContent(subject: string, grade: string, unit: string, difficulty: string, questionCount: number): Promise<string> {
    try {
      console.log('GeminiProvider - generateQuizContent called with params:', { subject, grade, unit, difficulty, questionCount });
      
      const model = this.genai.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        generationConfig: {
          maxOutputTokens: 3000,
          temperature: 0.7,
        }
      });
      console.log('GeminiProvider - Model obtained successfully');
      
      const systemPrompt = this.createQuizGenerationPrompt(subject, grade, unit, difficulty);
      console.log('GeminiProvider - System prompt created, length:', systemPrompt.length);
      
      const userPrompt = `${subject}の${unit}について、${difficulty}レベルの選択問題を${questionCount}問作成してください。`;
      console.log('GeminiProvider - User prompt created:', userPrompt);
      
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      console.log('GeminiProvider - Full prompt created, total length:', fullPrompt.length);
      console.log('GeminiProvider - Full prompt preview:', fullPrompt.substring(0, 300) + '...');
      
      console.log('GeminiProvider - Calling model.generateContent...');
      const result = await model.generateContent(fullPrompt);
      console.log('GeminiProvider - generateContent completed successfully');
      
      const responseText = result.response.text();
      console.log('GeminiProvider - Response text extracted, length:', responseText.length);
      console.log('GeminiProvider - Response preview:', responseText.substring(0, 200) + '...');
      
      return responseText;
    } catch (error) {
      console.error('GeminiProvider - generateQuizContent failed with error:', error);
      console.error('GeminiProvider - Error type:', typeof error);
      console.error('GeminiProvider - Error message:', error instanceof Error ? error.message : String(error));
      console.error('GeminiProvider - Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      if (error && typeof error === 'object') {
        console.error('GeminiProvider - Error details:', JSON.stringify(error, null, 2));
        if ('status' in error) {
          console.error('GeminiProvider - HTTP status:', (error as Record<string, unknown>).status);
        }
        if ('code' in error) {
          console.error('GeminiProvider - Error code:', (error as Record<string, unknown>).code);
        }
      }
      
      throw error;
    }
  }

  private createMaterialGenerationPrompt(subject: string, grade: string, unit: string, difficulty: string): string {
    const basePrompt = `あなたは${subject}の教材作成AIです。${grade}の${unit}について、${difficulty}レベルの学習教材を作成してください。`;
    
    const formatInstructions = `
以下の形式で出力してください：

**重要な注意事項**：
- 変数は必ずx, y, a, b等の具体的な文字を使用してください
- 「×××」「xxx」「XXX」などのプレースホルダーは絶対に使用しないでください
- 数式は明確で読みやすく記述してください
- 変数名は一貫して使用してください（例：xを使ったらxで統一）

**演算記号の使用方法**：
- 足し算：+ （例：x + 5）
- 引き算：- （例：x - 3）
- 掛け算：* （例：2*x または 2x）
- 割り算：/ （例：x/2）
- 平方根：√ （例：√16）

**累乗（指数）の記述**：
- x^2, y^3, a^4 のように記述してください
- 例：x^2 + 5x + 6 = 0

**重要：プレースホルダーの禁止**：
- 「×××」「xxx」「XXX」「***」「???」などは絶対に使用しないでください
- 必ず具体的な変数名（x, y, a, b等）を使用してください

**数式の例**：
- 正しい例：x^2 - 5x + 6 = 0
- 間違った例：×××^2 - 5××× + 6 = 0

**出力形式**：
問題1:
[問題文]

解答1:
[解答]

解説1:
[詳しい解説]

問題2:
[問題文]

解答2:
[解答]

解説2:
[詳しい解説]

問題3:
[問題文]

解答3:
[解答]

解説3:
[詳しい解説]
`;
    
    return basePrompt + formatInstructions;
  }

  private createQuizGenerationPrompt(subject: string, grade: string, unit: string, difficulty: string): string {
    const basePrompt = `あなたは${subject}の小テスト作成AIです。${grade}の${unit}について、${difficulty}レベルの選択問題を作成してください。`;
    
    const formatInstructions = `
以下の形式で出力してください：

**重要な注意事項**：
- 変数は必ずx, y, a, b等の具体的な文字を使用してください
- 「×××」「xxx」「XXX」などのプレースホルダーは絶対に使用しないでください
- 数式は明確で読みやすく記述してください
- 変数名は一貫して使用してください（例：xを使ったらxで統一）

**演算記号の使用方法**：
- 足し算：+ （例：x + 5）
- 引き算：- （例：x - 3）
- 掛け算：* （例：2*x または 2x）
- 割り算：/ （例：x/2）
- 平方根：√ （例：√16）

**累乗（指数）の記述**：
- x^2, y^3, a^4 のように記述してください
- 例：x^2 + 5x + 6 = 0

**重要：プレースホルダーの禁止**：
- 「×××」「xxx」「XXX」「***」「???」などは絶対に使用しないでください
- 必ず具体的な変数名（x, y, a, b等）を使用してください

**出力形式**：
問題1:
[問題文]

選択肢1:
A. [選択肢A]
B. [選択肢B]
C. [選択肢C]
D. [選択肢D]

正解1: A

解説1:
[詳しい解説]

問題2:
[問題文]

選択肢2:
A. [選択肢A]
B. [選択肢B]
C. [選択肢C]
D. [選択肢D]

正解2: B

解説2:
[詳しい解説]
`;
    
    return basePrompt + formatInstructions;
  }
}

export function getAIProvider(): AIProvider {
  const googleApiKey = process.env.GOOGLE_AI_API_KEY;
  const nexusApiKey = process.env.nexus_api_key;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  console.log('AI Provider - Environment check:');
  console.log('- GOOGLE_AI_API_KEY:', googleApiKey ? `Set (${googleApiKey.substring(0, 10)}...)` : 'Not set');
  console.log('- nexus_api_key:', nexusApiKey ? `Set (${nexusApiKey.substring(0, 10)}...)` : 'Not set');
  console.log('- OPENAI_API_KEY:', openaiApiKey ? 'Set' : 'Not set');
  
  const apiKey = googleApiKey || nexusApiKey;
  if (apiKey && apiKey !== 'a') {
    console.log('AI Provider - Using GeminiProvider with key:', apiKey.substring(0, 10) + '...');
    return new GeminiProvider();
  } else if (openaiApiKey) {
    console.log('AI Provider - Using OpenAIProvider');
    return new OpenAIProvider();
  } else {
    console.error('AI Provider - No valid API key found');
    throw new Error('No valid AI API key found. Please configure GOOGLE_AI_API_KEY, nexus_api_key, or OPENAI_API_KEY.');
  }
}
