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
        UNIQUE(user_id, date)
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
