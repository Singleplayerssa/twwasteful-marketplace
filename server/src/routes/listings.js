import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import db from '../db.js';
import { requireAuth } from '../middleware.js';
import { notify } from '../db.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../uploads');
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,9)}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('File harus berupa JPG, PNG, atau WEBP.'));
} });

const listingSchema = z.object({
  title: z.string().min(5).max(120), category: z.string().min(2).max(50), material: z.string().min(2).max(100),
  description: z.string().min(20).max(1500), quantityKg: z.coerce.number().positive(), minOrderKg: z.coerce.number().positive(),
  pricePerKg: z.coerce.number().nonnegative(), city: z.string().min(2).max(80), pickupAddress: z.string().min(4).max(240),
  condition: z.string().min(2).max(100).default('Layak olah'),
  nonB3Confirmed: z.literal('true')
});
const listingSelect = `SELECT l.*, c.name AS company_name,c.industry,c.verification_status
  FROM listings l JOIN companies c ON c.id=l.company_id`;

router.get('/', (req, res) => {
  const { q = '', category = '', city = '', sort = 'newest', limit = '60' } = req.query;
  const clauses = ["l.status='active'"];
  const args = [];
  if (q) { clauses.push('(l.title LIKE ? OR l.material LIKE ? OR l.description LIKE ? OR c.name LIKE ?)'); args.push(...Array(4).fill(`%${q}%`)); }
  if (category && category !== 'Semua') { clauses.push('l.category=?'); args.push(category); }
  if (city) { clauses.push('l.city LIKE ?'); args.push(`%${city}%`); }
  const order = sort === 'price-low' ? 'l.price_per_kg ASC' : sort === 'price-high' ? 'l.price_per_kg DESC' : 'l.created_at DESC';
  const safeLimit = Math.max(1, Math.min(100, Number.parseInt(limit, 10) || 60));
  const rows = db.prepare(`${listingSelect} WHERE ${clauses.join(' AND ')} ORDER BY ${order} LIMIT ?`).all(...args, safeLimit);
  res.json({ listings: rows });
});

router.get('/mine', requireAuth, (req, res) => {
  if (!req.user.company_id) return res.json({ listings: [] });
  res.json({ listings: db.prepare(`${listingSelect} WHERE l.company_id=? ORDER BY l.created_at DESC`).all(req.user.company_id) });
});

router.get('/:id', (req, res) => {
  const item = db.prepare(`${listingSelect} WHERE l.id=?`).get(Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Listing tidak ditemukan.' });
  res.json({ listing: item });
});

router.post('/', requireAuth, upload.single('image'), (req, res) => {
  if (!['seller','both','admin'].includes(req.user.role)) return res.status(403).json({ error: 'Akun ini belum memiliki akses penjual.' });
  const parsed = listingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  if (d.minOrderKg > d.quantityKg) return res.status(400).json({ error: 'Minimum pembelian tidak boleh melebihi stok tersedia.' });
  const result = db.prepare(`INSERT INTO listings (company_id,title,category,material,description,quantity_kg,min_order_kg,price_per_kg,city,pickup_address,condition,non_b3_confirmed,image_path)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(req.user.company_id,d.title,d.category,d.material,d.description,d.quantityKg,d.minOrderKg,d.pricePerKg,d.city,d.pickupAddress,d.condition,1,req.file ? `/uploads/${req.file.filename}` : null);
  res.status(201).json({ listing: db.prepare(`${listingSelect} WHERE l.id=?`).get(result.lastInsertRowid) });
});

router.patch('/:id', requireAuth, (req, res) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id=?').get(Number(req.params.id));
  if (!listing) return res.status(404).json({ error: 'Listing tidak ditemukan.' });
  if (listing.company_id !== req.user.company_id) return res.status(403).json({ error: 'Kamu hanya dapat mengubah listing perusahaan sendiri.' });
  const parsed = z.object({ status: z.enum(['active','archived']) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Status listing tidak valid.' });
  db.prepare('UPDATE listings SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(parsed.data.status, listing.id);
  res.json({ ok: true });
});

export default router;
