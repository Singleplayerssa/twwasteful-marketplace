import { Router } from 'express';
import { z } from 'zod';
import db, { notify } from '../db.js';
import { requireAuth } from '../middleware.js';

const router = Router();
router.get('/', requireAuth, (req, res) => {
  const id = req.user.company_id;
  const orders = db.prepare(`SELECT o.*, l.title AS listing_title, l.city AS listing_city,
    buyer.name AS buyer_name, seller.name AS seller_name
    FROM orders o JOIN listings l ON l.id=o.listing_id
    JOIN companies buyer ON buyer.id=o.buyer_company_id
    JOIN companies seller ON seller.id=o.seller_company_id
    WHERE o.buyer_company_id=? OR o.seller_company_id=? ORDER BY o.created_at DESC`).all(id,id)
    .map((order) => ({ ...order, direction: order.buyer_company_id === id ? 'purchase' : 'sale' }));
  res.json({ orders });
});

router.post('/:id/payment', requireAuth, (req, res) => {
  const parsed = z.object({ reference: z.string().min(3).max(100), notes: z.string().max(300).optional().default('') }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Referensi pembayaran wajib diisi.' });
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
  if (order.buyer_company_id !== req.user.company_id) return res.status(403).json({ error: 'Hanya pembeli yang dapat mengirim referensi pembayaran.' });
  if (order.status !== 'awaiting_payment') return res.status(409).json({ error: 'Pesanan tidak berada pada tahap menunggu pembayaran.' });
  db.prepare("UPDATE orders SET status='payment_review',payment_reference=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
    .run(parsed.data.reference,parsed.data.notes,order.id);
  notify(order.seller_company_id, 'Konfirmasi pembayaran masuk', `Pembeli mengirim referensi pembayaran untuk pesanan #${order.id}. Periksa pembayaran melalui kanal resmi perusahaan.`, '/dashboard?tab=orders');
  res.json({ ok: true, message: 'Referensi pembayaran dikirim untuk ditinjau penjual.' });
});

router.post('/:id/action', requireAuth, (req, res) => {
  const parsed = z.object({ action: z.enum(['confirm_payment','schedule_pickup','confirm_received','cancel']), pickupDate: z.string().max(30).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Aksi pesanan tidak valid.' });
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
  const { action, pickupDate } = parsed.data;
  let next = '';
  let recipient = 0;
  let title = '';
  let body = '';

  if (action === 'confirm_payment') {
    if (order.seller_company_id !== req.user.company_id || order.status !== 'payment_review') return res.status(403).json({ error: 'Konfirmasi ini hanya tersedia bagi penjual setelah pembeli mengirim referensi.' });
    next = 'paid'; recipient = order.buyer_company_id; title = 'Pembayaran dikonfirmasi'; body = `Penjual telah mengonfirmasi pembayaran pesanan #${order.id}.`;
  } else if (action === 'schedule_pickup') {
    if (order.seller_company_id !== req.user.company_id || order.status !== 'paid') return res.status(403).json({ error: 'Jadwal pengambilan hanya dapat dibuat penjual setelah pembayaran dikonfirmasi.' });
    if (!pickupDate || pickupDate.length < 4) return res.status(400).json({ error: 'Tanggal pengambilan wajib diisi.' });
    next = 'pickup_scheduled'; recipient = order.buyer_company_id; title = 'Jadwal pengambilan dibuat'; body = `Penjual menjadwalkan pengambilan pesanan #${order.id} pada ${pickupDate}.`;
  } else if (action === 'confirm_received') {
    if (order.buyer_company_id !== req.user.company_id || order.status !== 'pickup_scheduled') return res.status(403).json({ error: 'Konfirmasi penerimaan hanya dapat dilakukan pembeli setelah pengambilan dijadwalkan.' });
    next = 'completed'; recipient = order.seller_company_id; title = 'Pesanan selesai'; body = `Pembeli mengonfirmasi penerimaan pesanan #${order.id}.`;
  } else {
    if (![order.buyer_company_id,order.seller_company_id].includes(req.user.company_id) || !['awaiting_payment','payment_review'].includes(order.status)) return res.status(403).json({ error: 'Pesanan tidak dapat dibatalkan pada tahap ini.' });
    next = 'cancelled'; recipient = req.user.company_id === order.buyer_company_id ? order.seller_company_id : order.buyer_company_id; title = 'Pesanan dibatalkan'; body = `Pesanan #${order.id} telah dibatalkan.`;
  }
  const update = db.transaction(() => {
    db.prepare('UPDATE orders SET status=?,pickup_date=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(next,pickupDate || order.pickup_date,order.id);
    if (next === 'completed' || next === 'cancelled') {
      const listing = db.prepare('SELECT quantity_kg FROM listings WHERE id=?').get(order.listing_id);
      if (next === 'completed') {
        const remaining = Math.max(0,listing.quantity_kg - order.quantity_kg);
        db.prepare('UPDATE listings SET quantity_kg=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(remaining,remaining <= 0 ? 'sold' : 'active',order.listing_id);
      } else {
        db.prepare("UPDATE listings SET status='active',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(order.listing_id);
        db.prepare("UPDATE offers SET status='rejected' WHERE id=?").run(order.offer_id);
      }
    }
    notify(recipient,title,body,'/dashboard?tab=orders');
  });
  update();
  res.json({ ok: true, status: next, message: 'Status pesanan berhasil diperbarui.' });
});

export default router;
