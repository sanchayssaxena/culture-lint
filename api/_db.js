import { neon } from '@neondatabase/serverless'

let _sql = null

export function getDb() {
  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql
}

export async function initDb() {
  const sql = getDb()
  await sql`
    CREATE TABLE IF NOT EXISTS employees (
      id         SERIAL PRIMARY KEY,
      employee_id VARCHAR(50) NOT NULL UNIQUE,
      name       VARCHAR(255) NOT NULL,
      nationality VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}
