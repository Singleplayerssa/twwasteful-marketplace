import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query, withTransaction, notify } from '../db.js';
import { requireAuth } from '../middleware.js';

const router = Router();
const registerSchema = z.object({
  companyName: z.string().min(3).max(120),
  industry: z.string().min(2).max(80),
  nib: z.string().max(40).optional().default(''),
  address: z.string().min(5).max(240),
  city: z.string().min(2).max(80),
  contactName: z.string().min(2).max(100),
  phone: z.string().min(8).max(24),
  name: z.string().min(2).max(100),
  email: z.string().email().max(160),
  password: z.string().min(8).max(100),
  role: z.enum(['buyer', 'seller', 'both']).default('both')
});

function setSession(res, userId) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('tw_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
}

const profileSql = `SELECT u.id, u.name, u.email, u.role, u.company_id,
  c.name AS company_name, c.industry, c.city, c.verification_status
  FROM public.users u
  LEFT JOIN public.companies c ON c.id = u.company_id
  WHERE u.id = $1`;

router.post('/register', async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const data = parsed.data;
  const email = data.email.trim().toLowerCase();

  try {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const userId = await withTransaction(async (client) => {
      const companyResult = await client.query(
        `INSERT INTO public.companies (name, industry, nib, address, city, contact_name, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [data.companyName, data.industry, data.nib, data.address, data.city, data.contactName, data.phone]
      );
      const companyId = companyResult.rows[0].id;
      const userResult = await client.query(
        `INSERT INTO public.users (company_id, name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [companyId, data.name, email, passwordHash, data.role]
      );
      await notify(companyId, 'Selamat datang di T’wwasteful', 'Profil perusahaan berhasil dibuat. Tim kami akan meninjau data verifikasi perusahaan.', '/dashboard', client);
      return userResult.rows[0].id;
    });

    setSession(res, userId);
    const profile = await query(profileSql, [userId]);
    return res.status(201).json({ user: profile.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Email sudah terdaftar. Gunakan email lain atau masuk.' });
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Email dan kata sandi wajib diisi dengan benar.' });

  try {
    const result = await query(
      'SELECT id, password_hash FROM public.users WHERE lower(email) = $1 LIMIT 1',
      [parsed.data.email.trim().toLowerCase()]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
      return res.status(401).json({ error: 'Email atau kata sandi tidak cocok.' });
    }
    setSession(res, user.id);
    const profile = await query(profileSql, [user.id]);
    return res.json({ user: profile.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('tw_session', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  return res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

export default router;
