import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { extractTextFromImage, analyzeAnswer } from '@/lib/vision';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userResult = await query(
      'SELECT plan FROM users WHERE id = $1',
      [session.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const expectedAnswer = formData.get('expectedAnswer') as string;
    const subject = formData.get('subject') as string;
    const questionText = formData.get('questionText') as string;

    if (!imageFile || !expectedAnswer || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    const ocrResult = await extractTextFromImage(imageBuffer);

    if (!ocrResult.text) {
      return NextResponse.json({ 
        error: 'No text detected in image. Please ensure the image is clear and contains handwritten text.',
        ocrResult
      }, { status: 400 });
    }

    const analysis = analyzeAnswer(ocrResult.text, expectedAnswer);

    const historyResult = await query(`
      INSERT INTO learning_history (user_id, subject, topic, score, max_score, weak_areas, quiz_type)
      VALUES ($1, $2, $3, $4, 100, $5, 'answer_check')
      RETURNING id
    `, [
      session.userId, 
      subject, 
      questionText || 'Answer Check',
      analysis.score,
      JSON.stringify({
        incorrectParts: analysis.incorrectParts,
        extractedText: ocrResult.text,
        confidence: ocrResult.confidence
      })
    ]);

    return NextResponse.json({
      success: true,
      checkId: historyResult.rows[0].id,
      ocrResult: {
        text: ocrResult.text,
        confidence: ocrResult.confidence
      },
      analysis: {
        score: analysis.score,
        feedback: analysis.feedback,
        correctParts: analysis.correctParts,
        incorrectParts: analysis.incorrectParts
      }
    });
  } catch (error) {
    console.error('Answer checker error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await query(`
      SELECT id, subject, topic, score, completed_at, weak_areas
      FROM learning_history 
      WHERE user_id = $1 AND quiz_type = 'answer_check'
      ORDER BY completed_at DESC 
      LIMIT $2
    `, [session.userId, limit]);

    return NextResponse.json({
      history: result.rows.map(row => ({
        id: row.id,
        subject: row.subject,
        topic: row.topic,
        score: row.score,
        completedAt: row.completed_at,
        weakAreas: row.weak_areas
      }))
    });
  } catch (error) {
    console.error('Get answer check history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
