import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import db, { seedDemoData } from './db.js';
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import offerRoutes from './routes/offers.js';
import orderRoutes from './routes/orders.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const clientDist = path.resolve(rootDir, '../client/dist');

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET wajib diatur dengan nilai acak minimal 32 karakter untuk production.');
}
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'local-development-secret-change-before-deploy-2026';

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve(rootDir, 'uploads'), { maxAge: '7d' }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Terlalu banyak percobaan. Coba kembali beberapa saat lagi.' } });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.get('/api/health', (_req,res) => res.json({ ok: true, service: 'T’wwasteful API', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDist));
  app.get('*', (req,res,next) => req.path.startsWith('/api/') ? next() : res.sendFile(path.join(clientDist,'index.html')));
}

app.use((err,_req,res,_next) => {
  console.error(err);
  if (err?.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Ukuran foto maksimal 5 MB.' });
  if (err?.message?.includes('File harus')) return res.status(400).json({ error: err.message });
  res.status(500).json({ error: 'Terjadi kesalahan pada server. Silakan coba kembali.' });
});

seedDemoData();
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const existing = db.prepare('SELECT id FROM users WHERE email=?').get(process.env.ADMIN_EMAIL);
  if (!existing) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD,12);
    const company = db.prepare(`INSERT INTO companies (name,industry,address,city,contact_name,phone,verification_status)
      VALUES ('T’wwasteful Platform','Platform Digital','Kantor pusat','Jakarta','Administrator','0000000000','verified')`).run();
    db.prepare('INSERT INTO users (company_id,name,email,password_hash,role) VALUES (?,?,?,?,?)')
      .run(company.lastInsertRowid,process.env.ADMIN_NAME || 'Administrator',process.env.ADMIN_EMAIL,hash,'admin');
    console.log(`Admin account created: ${process.env.ADMIN_EMAIL}`);
  }
}

app.listen(PORT, () => console.log(`T’wwasteful API running at http://localhost:${PORT}`));
