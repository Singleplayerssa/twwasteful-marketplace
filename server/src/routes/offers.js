import { Router } from 'express';
import { z } from 'zod';
import db, { notify } from '../db.js';
import { requireAuth } from '../middleware.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const companyId = req.user.company_id;
  const rows = db.prepare(`SELECT o.*, l.title AS listing_title, l.city AS listing_city,
    buyer.name AS buyer_name, seller.name AS seller_name
    FROM offers o JOIN listings l ON l.id=o.listing_id
    JOIN companies buyer ON buyer.id=o.buyer_company_id
    JOIN companies seller ON seller.id=o.seller_company_id
    WHERE o.buyer_company_id=? OR o.seller_company_id=? ORDER BY o.created_at DESC`).all(companyId, companyId);
  res.json({ offers: rows.map((offer) => ({ ...offer, direction: offer.buyer_company_id === companyId ? 'sent' : 'received' })) });
});

router.post('/', requireAuth, (req, res) => {
  if (!['buyer','both','admin'].includes(req.user.role)) return res.status(403).json({ error: 'Akun ini belum memiliki akses pembeli.' });
  const parsed = z.object({ listingId: z.coerce.number().int().positive(), quantityKg: z.coerce.number().positive(), pricePerKg: z.coerce.number().nonnegative(), message: z.string().max(600).optional().default('') }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const data = parsed.data;
  const listing = db.prepare('SELECT * FROM listings WHERE id=? AND status=?').get(data.listingId, 'active');
  if (!listing) return res.status(404).json({ error: 'Listing sudah tidak tersedia.' });
  if (listing.company_id === req.user.company_id) return res.status(400).json({ error: 'Perusahaan tidak dapat mengajukan penawaran pada listing sendiri.' });
  if (data.quantityKg < listing.min_order_kg || data.quantityKg > listing.quantity_kg) return res.status(400).json({ error: `Jumlah harus antara ${listing.min_order_kg.toLocaleString('id-ID')} kg dan ${listing.quantity_kg.toLocaleString('id-ID')} kg.` });
  const result = db.prepare(`INSERT INTO offers (listing_id,buyer_company_id,seller_company_id,quantity_kg,proposed_price_per_kg,message)
    VALUES (?,?,?,?,?,?)`).run(listing.id,req.user.company_id,listing.company_id,data.quantityKg,data.pricePerKg,data.message);
  notify(listing.company_id, 'Penawaran baru masuk', `${req.user.company_name} mengajukan penawaran untuk ${listing.title}.`, '/dashboard?tab=offers');
  res.status(201).json({ offerId: Number(result.lastInsertRowid), message: 'Penawaran berhasil dikirim.' });
});

router.post('/:id/respond', requireAuth, (req, res) => {
  const parsed = z.object({ decision: z.enum(['accept','reject']) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Pilihan respons tidak valid.' });
  const offer = db.prepare('SELECT * FROM offers WHERE id=?').get(Number(req.params.id));
  if (!offer) return res.status(404).json({ error: 'Penawaran tidak ditemukan.' });
  if (offer.seller_company_id !== req.user.company_id) return res.status(403).json({ error: 'Hanya perusahaan penjual yang dapat merespons penawaran.' });
  if (offer.status !== 'pending') return res.status(409).json({ error: 'Penawaran ini sudah diproses.' });
  if (parsed.data.decision === 'reject') {
    db.prepare("UPDATE offers SET status='rejected' WHERE id=?").run(offer.id);
    notify(offer.buyer_company_id, 'Penawaran belum diterima', 'Penjual belum dapat menyetujui penawaran tersebut. Kamu dapat mencoba listing lain.', '/dashboard?tab=offers');
    return res.json({ ok: true, message: 'Penawaran ditolak.' });
  }
  const listing = db.prepare('SELECT * FROM listings WHERE id=?').get(offer.listing_id);
  if (!listing || listing.status !== 'active' || offer.quantity_kg > listing.quantity_kg) return res.status(409).json({ error: 'Stok sudah berubah. Periksa listing sebelum menerima penawaran.' });
  const createOrder = db.transaction(() => {
    db.prepare("UPDATE offers SET status='accepted' WHERE id=?").run(offer.id);
    const total = Math.round(offer.quantity_kg * offer.proposed_price_per_kg);
    const order = db.prepare(`INSERT INTO orders (offer_id,listing_id,buyer_company_id,seller_company_id,quantity_kg,unit_price,total_price)
      VALUES (?,?,?,?,?,?,?)`).run(offer.id,offer.listing_id,offer.buyer_company_id,offer.seller_company_id,offer.quantity_kg,offer.proposed_price_per_kg,total);
    db.prepare("UPDATE listings SET status='reserved',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(listing.id);
    notify(offer.buyer_company_id, 'Penawaran disetujui', `Pesanan #${order.lastInsertRowid} terbentuk. Lanjutkan konfirmasi pembayaran dengan penjual.`, '/dashboard?tab=orders');
    return Number(order.lastInsertRowid);
  });
  const orderId = createOrder();
  res.json({ ok: true, orderId, message: 'Penawaran diterima dan pesanan berhasil dibuat.' });
});

export default router;
