import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { query } from '../db.js';
import { requireAuth } from '../middleware.js';
import { uploadMaterialImage } from '../storage.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('File harus berupa JPG, PNG, atau WEBP.'));
  }
});

const listingSelect = `SELECT l.*, c.name AS company_name, c.industry, c.verification_status
  FROM public.listings l
  JOIN public.companies c ON c.id = l.company_id`;

router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || '').trim();
    const city = String(req.query.city || '').trim();
    const sort = String(req.query.sort || 'newest');
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 60));
    const clauses = ["l.status = 'active'"];
    const values = [];

    if (q) {
      values.push(`%${q}%`);
      const n = values.length;
      clauses.push(`(l.title ILIKE $${n} OR l.material ILIKE $${n} OR l.description ILIKE $${n} OR c.name ILIKE $${n})`);
    }
    if (category && category !== 'Semua') {
      values.push(category);
      clauses.push(`l.category = $${values.length}`);
    }
    if (city) {
      values.push(`%${city}%`);
      clauses.push(`l.city ILIKE $${values.length}`);
    }

    const orderBy = sort === 'price-low'
      ? 'l.price_per_kg ASC, l.created_at DESC'
      : sort === 'price-high'
        ? 'l.price_per_kg DESC, l.created_at DESC'
        : 'l.created_at DESC';
    values.push(limit);
    const result = await query(
      `${listingSelect} WHERE ${clauses.join(' AND ')} ORDER BY ${orderBy} LIMIT $${values.length}`,
      values
    );
    return res.json({ listings: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    if (!req.user.company_id) return res.json({ listings: [] });
    const result = await query(`${listingSelect} WHERE l.company_id = $1 ORDER BY l.created_at DESC`, [req.user.company_id]);
    return res.json({ listings: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(`${listingSelect} WHERE l.id = $1`, [Number(req.params.id)]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Listing tidak ditemukan.' });
    return res.json({ listing: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

const listingSchema = z.object({
  title: z.string().min(5).max(120),
  category: z.string().min(2).max(50),
  material: z.string().min(2).max(100),
  description: z.string().min(20).max(1500),
  quantityKg: z.coerce.number().positive(),
  minOrderKg: z.coerce.number().positive(),
  pricePerKg: z.coerce.number().nonnegative(),
  city: z.string().min(2).max(80),
  pickupAddress: z.string().min(4).max(240),
  condition: z.string().min(2).max(100).default('Layak olah'),
  nonB3Confirmed: z.literal('true')
});

router.post('/', requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    if (!['seller', 'both', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Akun ini belum memiliki akses penjual.' });
    }
    if (!req.user.company_id) return res.status(400).json({ error: 'Akun belum terhubung dengan perusahaan.' });
    const parsed = listingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const d = parsed.data;
    if (d.minOrderKg > d.quantityKg) return res.status(400).json({ error: 'Minimum pembelian tidak boleh melebihi stok tersedia.' });

    const imagePath = await uploadMaterialImage(req.file);
    const result = await query(
      `INSERT INTO public.listings
       (company_id, title, category, material, description, quantity_kg, min_order_kg,
        price_per_kg, city, pickup_address, condition, non_b3_confirmed, image_path)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,$12)
       RETURNING id`,
      [req.user.company_id, d.title, d.category, d.material, d.description, d.quantityKg,
       d.minOrderKg, d.pricePerKg, d.city, d.pickupAddress, d.condition, imagePath]
    );
    const listing = await query(`${listingSelect} WHERE l.id = $1`, [result.rows[0].id]);
    return res.status(201).json({ listing: listing.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const parsed = z.object({ status: z.enum(['active', 'archived']) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Status listing tidak valid.' });
    const result = await query(
      `UPDATE public.listings SET status = $1, updated_at = NOW()
       WHERE id = $2 AND company_id = $3 RETURNING id`,
      [parsed.data.status, Number(req.params.id), req.user.company_id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Listing tidak ditemukan atau bukan milik perusahaanmu.' });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
