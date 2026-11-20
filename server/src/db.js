import pg from 'pg';

const { Pool, types } = pg;

// PostgreSQL BIGINT values are safe JavaScript numbers for our generated IDs.
types.setTypeParser(20, (value) => Number(value));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL belum diatur. Tambahkan connection string Supabase di environment backend.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
  max: Number(process.env.PG_POOL_MAX || 5),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
  application_name: 'twwasteful-api'
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function notify(companyId, title, body, href = '/dashboard', executor = pool) {
  await executor.query(
    `INSERT INTO public.notifications (company_id, title, body, href)
     VALUES ($1, $2, $3, $4)`,
    [companyId, title, body, href]
  );
}

export async function checkDatabase() {
  await pool.query('SELECT 1');
}

export default pool;
