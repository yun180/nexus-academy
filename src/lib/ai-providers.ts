import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIProvider {
  generateContent(prompt: string, systemPrompt: string): Promise<string>;
  generateMaterialContent(subject: string, grade: string, unit: string, difficulty: string): Promise<string>;
  generateQuizContent(subject: string, grade: string, unit: string, difficulty: string, questionCount: number): Promise<string>;
  generateMaterialRecommendations(learningHistory: Array<{subject: string; avg_score: number; weak_areas: Record<string, unknown>; difficulty: string}>): Promise<Array<{id: string; title: string; subject: string; difficulty: string; description: string; url: string; reason: string}>>;
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

  async generateMaterialRecommendations(learningHistory: Array<{subject: string; avg_score: number; weak_areas: Record<string, unknown>; difficulty: string}>): Promise<Array<{id: string; title: string; subject: string; difficulty: string; description: string; url: string; reason: string}>> {
    const systemPrompt = this.createRecommendationPrompt(learningHistory);
    const userPrompt = "学習履歴を分析して、最適な教材を6つ推薦してください。";
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });
    
    const response = completion.choices[0]?.message?.content || '';
    return this.parseRecommendations(response);
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

  private createRecommendationPrompt(learningHistory: Array<{subject: string; avg_score: number; weak_areas: Record<string, unknown>; difficulty: string}>): string {
    const historyAnalysis = learningHistory.length > 0 
      ? `学習履歴分析：\n${learningHistory.map(h => `- ${h.subject}: 平均点${Math.round(h.avg_score)}点, 難易度${h.difficulty}, 苦手分野: ${JSON.stringify(h.weak_areas)}`).join('\n')}`
      : '学習履歴：なし（初回利用者）';

    return `あなたは教育専門のAIアシスタントです。学習者の履歴を分析して、最適な教材を推薦してください。

${historyAnalysis}

以下の形式でJSONとして6つの教材推薦を出力してください：

[
  {
    "id": "rec_1",
    "title": "具体的な教材タイトル",
    "subject": "数学",
    "difficulty": "基礎",
    "description": "この教材の詳細説明（50文字程度）",
    "url": "/generator?subject=数学&grade=中学生&unit=方程式&difficulty=基礎",
    "reason": "推薦理由（学習履歴に基づく具体的な理由）"
  }
]

**重要な指示**：
1. URLは必ず "/generator?subject=科目&grade=学年&unit=単元&difficulty=難易度" の形式にしてください
2. 学習履歴がある場合は、苦手分野や低得点科目を重点的に推薦してください
3. 学習履歴がない場合は、基礎的な内容から始められる教材を推薦してください
4. 各推薦の理由は学習データに基づいて具体的に記述してください
5. 難易度は「基礎」「標準」「応用」のいずれかを使用してください
6. 科目は「数学」「英語」「国語」「理科」「社会」から選択してください`;
  }

  private parseRecommendations(aiResponse: string): Array<{id: string; title: string; subject: string; difficulty: string; description: string; url: string; reason: string}> {
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      const recommendations = JSON.parse(jsonMatch[0]);
      
      return recommendations.map((rec: Record<string, unknown>, index: number) => ({
        id: rec.id || `rec_${index + 1}`,
        title: rec.title || `推薦教材${index + 1}`,
        subject: rec.subject || '数学',
        difficulty: rec.difficulty || '基礎',
        description: rec.description || '学習に役立つ教材です。',
        url: rec.url || '/generator',
        reason: rec.reason || '学習の向上に役立ちます。'
      }));
    } catch (error) {
      console.error('Failed to parse AI recommendations:', error);
      return this.getFallbackRecommendations();
    }
  }

  private getFallbackRecommendations(): Array<{id: string; title: string; subject: string; difficulty: string; description: string; url: string; reason: string}> {
    return [
      {
        id: 'fallback_1',
        title: '基礎数学ドリル',
        subject: '数学',
        difficulty: '基礎',
        description: '数学の基本的な計算問題を集めた教材です。',
        url: '/generator?subject=数学&grade=中学生&unit=計算&difficulty=基礎',
        reason: 'AI分析に基づく推薦が利用できないため、基礎から始めることをお勧めします。'
      },
      {
        id: 'fallback_2',
        title: '英語基礎文法',
        subject: '英語',
        difficulty: '基礎',
        description: '英語の基本文法を学習できる教材です。',
        url: '/generator?subject=英語&grade=中学生&unit=文法&difficulty=基礎',
        reason: 'AI分析に基づく推薦が利用できないため、基礎から始めることをお勧めします。'
      }
    ];
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

  async generateMaterialRecommendations(learningHistory: Array<{subject: string; avg_score: number; weak_areas: Record<string, unknown>; difficulty: string}>): Promise<Array<{id: string; title: string; subject: string; difficulty: string; description: string; url: string; reason: string}>> {
    const model = this.genai.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7,
      }
    });
    
    const systemPrompt = this.createRecommendationPrompt(learningHistory);
    const userPrompt = "学習履歴を分析して、最適な教材を6つ推薦してください。";
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    const result = await model.generateContent(fullPrompt);
    return this.parseRecommendations(result.response.text());
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

  private createRecommendationPrompt(learningHistory: Array<{subject: string; avg_score: number; weak_areas: Record<string, unknown>; difficulty: string}>): string {
    const historyAnalysis = learningHistory.length > 0 
      ? `学習履歴分析：\n${learningHistory.map(h => `- ${h.subject}: 平均点${Math.round(h.avg_score)}点, 難易度${h.difficulty}, 苦手分野: ${JSON.stringify(h.weak_areas)}`).join('\n')}`
      : '学習履歴：なし（初回利用者）';

    return `あなたは教育専門のAIアシスタントです。学習者の履歴を分析して、最適な教材を推薦してください。

${historyAnalysis}

以下の形式でJSONとして6つの教材推薦を出力してください：

[
  {
    "id": "rec_1",
    "title": "具体的な教材タイトル",
    "subject": "数学",
    "difficulty": "基礎",
    "description": "この教材の詳細説明（50文字程度）",
    "url": "/generator?subject=数学&grade=中学生&unit=方程式&difficulty=基礎",
    "reason": "推薦理由（学習履歴に基づく具体的な理由）"
  }
]

**重要な指示**：
1. URLは必ず "/generator?subject=科目&grade=学年&unit=単元&difficulty=難易度" の形式にしてください
2. 学習履歴がある場合は、苦手分野や低得点科目を重点的に推薦してください
3. 学習履歴がない場合は、基礎的な内容から始められる教材を推薦してください
4. 各推薦の理由は学習データに基づいて具体的に記述してください
5. 難易度は「基礎」「標準」「応用」のいずれかを使用してください
6. 科目は「数学」「英語」「国語」「理科」「社会」から選択してください`;
  }

  private parseRecommendations(aiResponse: string): Array<{id: string; title: string; subject: string; difficulty: string; description: string; url: string; reason: string}> {
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      const recommendations = JSON.parse(jsonMatch[0]);
      
      return recommendations.map((rec: Record<string, unknown>, index: number) => ({
        id: rec.id || `rec_${index + 1}`,
        title: rec.title || `推薦教材${index + 1}`,
        subject: rec.subject || '数学',
        difficulty: rec.difficulty || '基礎',
        description: rec.description || '学習に役立つ教材です。',
        url: rec.url || '/generator',
        reason: rec.reason || '学習の向上に役立ちます。'
      }));
    } catch (error) {
      console.error('Failed to parse AI recommendations:', error);
      return this.getFallbackRecommendations();
    }
  }

  private getFallbackRecommendations(): Array<{id: string; title: string; subject: string; difficulty: string; description: string; url: string; reason: string}> {
    return [
      {
        id: 'fallback_1',
        title: '基礎数学ドリル',
        subject: '数学',
        difficulty: '基礎',
        description: '数学の基本的な計算問題を集めた教材です。',
        url: '/generator?subject=数学&grade=中学生&unit=計算&difficulty=基礎',
        reason: 'AI分析に基づく推薦が利用できないため、基礎から始めることをお勧めします。'
      },
      {
        id: 'fallback_2',
        title: '英語基礎文法',
        subject: '英語',
        difficulty: '基礎',
        description: '英語の基本文法を学習できる教材です。',
        url: '/generator?subject=英語&grade=中学生&unit=文法&difficulty=基礎',
        reason: 'AI分析に基づく推薦が利用できないため、基礎から始めることをお勧めします。'
      }
    ];
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
