const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiMath() {
  if (!process.env.GOOGLE_AI_API_KEY) {
    console.log('GOOGLE_AI_API_KEY not set, skipping Gemini test');
    return;
  }

  try {
    const genai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genai.getGenerativeModel({ model: 'gemini-2.5-pro' });
    
    const prompt = `数学の中学1年の方程式について、基礎レベルの問題を3問作成してください。
    
    **演算記号**はすべて Unicode 記号を使用：
    - 掛け算：×（U+00D7）
    - 割り算：÷（U+00F7）
    - 引き算：−（U+2212）
    - 足し算：＋（U+002B）
    - 平方根：√（U+221A）
    
    **累乗（指数）**は上付き文字を使用：
    - 例：2², x³, 10⁴
    
    **出力形式**：
    問題1:
    [問題文]
    
    解答1:
    [解答]
    
    解説1:
    [詳しい解説]`;
    
    console.log('Testing Gemini mathematical capabilities...');
    const result = await model.generateContent(prompt);
    console.log('Gemini Response:');
    console.log(result.response.text());
    console.log('\n✅ Gemini test completed successfully!');
  } catch (error) {
    console.error('❌ Gemini test failed:', error);
  }
}

testGeminiMath();
