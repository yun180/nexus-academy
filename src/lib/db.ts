import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

export async function initDatabase() {
  const client = getPool();
  
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        line_user_id TEXT UNIQUE NOT NULL,
        display_name TEXT,
        plan TEXT DEFAULT 'free',
        paid_until TIMESTAMPTZ NULL,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS usage_logs (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        date DATE NOT NULL,
        gen_count INTEGER DEFAULT 0,
        navi_count INTEGER DEFAULT 0,
        quiz_count INTEGER DEFAULT 0,
        learning_pick_count INTEGER DEFAULT 0,
        UNIQUE(user_id, date)
      );
      
      CREATE TABLE IF NOT EXISTS passkeys (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code TEXT UNIQUE NOT NULL,
        plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'premium')),
        max_uses INTEGER NOT NULL,
        current_uses INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        created_by UUID REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS learning_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        subject TEXT NOT NULL,
        topic TEXT,
        score INTEGER,
        max_score INTEGER,
        weak_areas JSONB,
        completed_at TIMESTAMPTZ DEFAULT NOW(),
        quiz_type TEXT,
        difficulty TEXT
      );
      
      CREATE TABLE IF NOT EXISTS goals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        target_school TEXT,
        exam_date DATE,
        current_level TEXT,
        target_subjects TEXT[],
        study_plan JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS class_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        title TEXT NOT NULL,
        session_type TEXT NOT NULL CHECK (session_type IN ('group', 'individual')),
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        google_event_id TEXT,
        meet_url TEXT,
        status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

export async function getUserByLineId(lineUserId: string) {
  const client = getPool();
  const result = await client.query(
    'SELECT * FROM users WHERE line_user_id = $1',
    [lineUserId]
  );
  return result.rows[0] || null;
}

export async function createOrUpdateUser(lineUserId: string, displayName: string) {
  const client = getPool();
  const result = await client.query(`
    INSERT INTO users (line_user_id, display_name)
    VALUES ($1, $2)
    ON CONFLICT (line_user_id)
    DO UPDATE SET display_name = $2
    RETURNING *
  `, [lineUserId, displayName]);
  return result.rows[0];
}

export async function query(text: string, params?: unknown[]) {
  const pool = getPool();
  return pool.query(text, params);
}
