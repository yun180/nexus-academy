import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIProvider {
  generateContent(prompt: string, systemPrompt: string): Promise<string>;
  generateMaterialContent(subject: string, grade: string, unit: string, difficulty: string): Promise<string>;
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
}

export class GeminiProvider implements AIProvider {
  private genai: GoogleGenerativeAI;
  
  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.nexus_api_key;
    this.genai = new GoogleGenerativeAI(apiKey!);
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
}

export function getAIProvider(): AIProvider {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.nexus_api_key;
  if (apiKey && apiKey !== 'a') {
    return new GeminiProvider();
  } else if (process.env.OPENAI_API_KEY) {
    return new OpenAIProvider();
  } else {
    throw new Error('No valid AI API key found. Please configure GOOGLE_AI_API_KEY, nexus_api_key, or OPENAI_API_KEY.');
  }
}
