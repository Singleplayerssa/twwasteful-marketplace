import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../db.js';
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
  role: z.enum(['buyer','seller','both']).default('both')
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

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const data = parsed.data;
  const exists = db.prepare('SELECT id FROM users WHERE email=?').get(data.email);
  if (exists) return res.status(409).json({ error: 'Email sudah terdaftar. Gunakan email lain atau masuk.' });
  try {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const create = db.transaction(() => {
      const company = db.prepare(`INSERT INTO companies (name,industry,nib,address,city,contact_name,phone)
        VALUES (?,?,?,?,?,?,?)`).run(data.companyName, data.industry, data.nib, data.address, data.city, data.contactName, data.phone);
      const user = db.prepare(`INSERT INTO users (company_id,name,email,password_hash,role)
        VALUES (?,?,?,?,?)`).run(company.lastInsertRowid, data.name, data.email.toLowerCase(), passwordHash, data.role);
      db.prepare('INSERT INTO notifications (company_id,title,body) VALUES (?,?,?)')
        .run(company.lastInsertRowid, 'Selamat datang di T’wwasteful', 'Profil perusahaan berhasil dibuat. Tim kami akan meninjau data verifikasi perusahaan.');
      return Number(user.lastInsertRowid);
    });
    const userId = create();
    setSession(res, userId);
    res.status(201).json({ user: db.prepare(`SELECT u.id,u.name,u.email,u.role,u.company_id,c.name AS company_name,c.verification_status FROM users u JOIN companies c ON c.id=u.company_id WHERE u.id=?`).get(userId) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Pendaftaran belum dapat diproses.' });
  }
});

router.post('/login', async (req, res) => {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Email dan kata sandi wajib diisi dengan benar.' });
  const user = db.prepare('SELECT id,password_hash FROM users WHERE email=? COLLATE NOCASE').get(parsed.data.email);
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
    return res.status(401).json({ error: 'Email atau kata sandi tidak cocok.' });
  }
  setSession(res, user.id);
  const profile = db.prepare(`SELECT u.id,u.name,u.email,u.role,u.company_id,c.name AS company_name,c.industry,c.city,c.verification_status
    FROM users u LEFT JOIN companies c ON c.id=u.company_id WHERE u.id=?`).get(user.id);
  res.json({ user: profile });
});

router.post('/logout', (req, res) => {
  res.clearCookie('tw_session', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));
export default router;
