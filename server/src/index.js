import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { checkDatabase, pool } from './db.js';
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import offerRoutes from './routes/offers.js';
import orderRoutes from './routes/orders.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan. Coba kembali beberapa saat lagi.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/api/health', async (_req, res) => {
  try {
    await checkDatabase();
    return res.json({ ok: true, service: 'T’wwasteful API', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Health check database error:', error.message);
    return res.status(503).json({ ok: false, service: 'T’wwasteful API', database: 'disconnected' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Ukuran foto maksimal 5 MB.' });
  if (err?.message?.includes('File harus')) return res.status(400).json({ error: err.message });
  if (err?.status && Number.isInteger(err.status)) return res.status(err.status).json({ error: err.message });
  if (err?.code === '23505') return res.status(409).json({ error: 'Data sudah terdaftar.' });
  return res.status(500).json({ error: 'Terjadi kesalahan pada server. Silakan coba kembali.' });
});

try {
  await checkDatabase();
  const server = app.listen(PORT, () => console.log(`T’wwasteful API listening on port ${PORT}`));
  const shutdown = async () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
} catch (error) {
  console.error('Backend gagal terhubung ke PostgreSQL:', error.message);
  process.exit(1);
}
