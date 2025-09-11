import { ImageAnnotatorClient } from '@google-cloud/vision';

let visionClient: ImageAnnotatorClient | null = null;

function getVisionClient() {
  if (!visionClient) {
    visionClient = new ImageAnnotatorClient({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });
  }
  return visionClient;
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes: Array<{
    text: string;
    vertices: Array<{ x: number; y: number }>;
  }>;
}

export async function extractTextFromImage(imageBuffer: Buffer): Promise<OCRResult> {
  try {
    const client = getVisionClient();
    
    const [result] = await client.textDetection({
      image: { content: imageBuffer },
    });
    
    const detections = result.textAnnotations || [];
    
    if (detections.length === 0) {
      return {
        text: '',
        confidence: 0,
        boundingBoxes: []
      };
    }

    const fullText = detections[0]?.description || '';
    
    const boundingBoxes = detections.slice(1).map(detection => ({
      text: detection.description || '',
      vertices: detection.boundingPoly?.vertices?.map(vertex => ({
        x: vertex.x || 0,
        y: vertex.y || 0
      })) || []
    }));

    const avgConfidence = detections.length > 1 ? 0.85 : 0.5;

    return {
      text: fullText,
      confidence: avgConfidence,
      boundingBoxes
    };
  } catch (error) {
    console.error('Vision API error:', error);
    throw new Error('Failed to extract text from image');
  }
}

export function analyzeAnswer(extractedText: string, expectedAnswer: string): {
  score: number;
  feedback: string[];
  correctParts: string[];
  incorrectParts: string[];
} {
  const extracted = extractedText.toLowerCase().trim();
  const expected = expectedAnswer.toLowerCase().trim();
  
  const extractedWords = extracted.split(/\s+/);
  const expectedWords = expected.split(/\s+/);
  
  let correctCount = 0;
  const correctParts: string[] = [];
  const incorrectParts: string[] = [];
  
  extractedWords.forEach(word => {
    if (expectedWords.includes(word)) {
      correctCount++;
      correctParts.push(word);
    } else if (word.length > 2) { // Ignore very short words
      incorrectParts.push(word);
    }
  });
  
  const score = Math.round((correctCount / Math.max(expectedWords.length, 1)) * 100);
  
  const feedback: string[] = [];
  
  if (score >= 90) {
    feedback.push('素晴らしい解答です！');
  } else if (score >= 70) {
    feedback.push('良い解答ですが、いくつか改善点があります。');
  } else if (score >= 50) {
    feedback.push('基本的な理解はできていますが、もう少し詳しく書きましょう。');
  } else {
    feedback.push('解答を見直して、もう一度挑戦してみましょう。');
  }
  
  if (incorrectParts.length > 0) {
    feedback.push(`確認が必要な部分: ${incorrectParts.slice(0, 3).join(', ')}`);
  }
  
  if (correctParts.length > 0) {
    feedback.push(`正しく書けている部分: ${correctParts.slice(0, 3).join(', ')}`);
  }
  
  return {
    score,
    feedback,
    correctParts,
    incorrectParts
  };
}
