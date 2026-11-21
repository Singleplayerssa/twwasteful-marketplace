import pg from 'pg';
import bcrypt from 'bcryptjs';
import { attachDatabasePool } from '@vercel/functions';

const { Pool, types } = pg;

// IDs are generated as BIGINT identity columns; current app IDs remain within JS safe integer range.
types.setTypeParser(20, (value) => Number(value));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL belum diatur. Tambahkan Supabase Transaction Pooler URI di Vercel Environment Variables.');
}

// Vercel functions are short-lived. Keep one client per warm instance and let Supabase's
// Transaction Pooler (port 6543) multiplex requests across database connections.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 10_000,
  allowExitOnIdle: true,
  application_name: 'twwasteful-vercel-api'
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});

// Required by Vercel Fluid Compute to release idle pool clients before an instance suspends.
if (process.env.VERCEL) attachDatabasePool(pool);

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

let adminSeedPromise;
export async function ensureAdminAccount() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if (!adminSeedPromise) {
    adminSeedPromise = (async () => {
      const existing = await pool.query(
        'SELECT id, role FROM public.users WHERE lower(email) = $1 LIMIT 1',
        [email]
      );
      if (existing.rows[0]) {
        if (existing.rows[0].role !== 'admin') {
          console.warn('ADMIN_EMAIL already exists but is not an admin. No role was changed automatically.');
        }
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await withTransaction(async (client) => {
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1)::bigint)', [email]);
        const checkAgain = await client.query(
          'SELECT id, role FROM public.users WHERE lower(email) = $1 LIMIT 1',
          [email]
        );
        if (checkAgain.rows[0]) return;

        const company = await client.query(
          `INSERT INTO public.companies
           (name, industry, address, city, contact_name, phone, verification_status)
           VALUES ($1, $2, $3, $4, $5, $6, 'verified') RETURNING id`,
          ["T'wwasteful Platform", 'Platform Digital', 'Kantor pusat', 'Karawang', 'Administrator', '0000000000']
        );
        await client.query(
          `INSERT INTO public.users (company_id, name, email, password_hash, role)
           VALUES ($1, $2, $3, $4, 'admin')`,
          [company.rows[0].id, process.env.ADMIN_NAME || 'Administrator', email, passwordHash]
        );
        await notify(company.rows[0].id, 'Akun administrator dibuat', 'Akun administrator platform berhasil disiapkan.');
      });
      console.log(`T'wwasteful admin account provisioned for ${email}`);
    })().catch((error) => {
      adminSeedPromise = undefined;
      throw error;
    });
  }
  return adminSeedPromise;
}

export default pool;
