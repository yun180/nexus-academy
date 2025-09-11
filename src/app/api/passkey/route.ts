import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { action, code, planType, maxUses, expiresAt } = await request.json();

    if (action === 'generate') {
      const userResult = await query(
        'SELECT plan FROM users WHERE id = $1',
        [session.userId]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      
      const passkeyCode = randomBytes(8).toString('hex').toUpperCase();
      
      const result = await query(`
        INSERT INTO passkeys (code, plan_type, max_uses, expires_at, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [passkeyCode, planType || 'basic', maxUses || 1, expiresAt, session.userId]);

      return NextResponse.json({
        success: true,
        passkey: result.rows[0]
      });
    } else if (action === 'redeem') {
      if (!code) {
        return NextResponse.json({ error: 'Passkey code is required' }, { status: 400 });
      }

      const passkeyResult = await query(
        'SELECT * FROM passkeys WHERE code = $1',
        [code.toUpperCase()]
      );

      if (passkeyResult.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid passkey code' }, { status: 404 });
      }

      const passkey = passkeyResult.rows[0];

      if (passkey.current_uses >= passkey.max_uses) {
        return NextResponse.json({ error: 'Passkey has been fully used' }, { status: 400 });
      }

      if (passkey.expires_at && new Date(passkey.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Passkey has expired' }, { status: 400 });
      }

      const newPlan = passkey.plan_type === 'premium' ? 'plus' : 'free';
      const paidUntil = passkey.plan_type === 'premium' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        : null;

      await query(
        'UPDATE users SET plan = $1, paid_until = $2 WHERE id = $3',
        [newPlan, paidUntil, session.userId]
      );

      await query(
        'UPDATE passkeys SET current_uses = current_uses + 1 WHERE id = $1',
        [passkey.id]
      );

      return NextResponse.json({
        success: true,
        message: `Successfully upgraded to ${newPlan} plan`,
        newPlan,
        paidUntil
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Passkey error:', error);
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
    const action = searchParams.get('action');

    if (action === 'list') {
      const result = await query(`
        SELECT id, code, plan_type, max_uses, current_uses, expires_at, created_at
        FROM passkeys 
        WHERE created_by = $1 
        ORDER BY created_at DESC
      `, [session.userId]);

      return NextResponse.json({
        passkeys: result.rows.map(row => ({
          id: row.id,
          code: row.code,
          planType: row.plan_type,
          maxUses: row.max_uses,
          currentUses: row.current_uses,
          expiresAt: row.expires_at,
          createdAt: row.created_at,
          isExpired: row.expires_at && new Date(row.expires_at) < new Date(),
          isFullyUsed: row.current_uses >= row.max_uses
        }))
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Get passkey error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
