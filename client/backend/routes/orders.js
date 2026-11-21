import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction, notify } from '../db.js';
import { requireAuth } from '../middleware.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const companyId = req.user.company_id;
    const result = await query(
      `SELECT o.*, l.title AS listing_title, l.city AS listing_city,
              buyer.name AS buyer_name, seller.name AS seller_name
       FROM public.orders o
       JOIN public.listings l ON l.id = o.listing_id
       JOIN public.companies buyer ON buyer.id = o.buyer_company_id
       JOIN public.companies seller ON seller.id = o.seller_company_id
       WHERE o.buyer_company_id = $1 OR o.seller_company_id = $1
       ORDER BY o.created_at DESC`,
      [companyId]
    );
    const orders = result.rows.map((order) => ({
      ...order,
      direction: Number(order.buyer_company_id) === Number(companyId) ? 'purchase' : 'sale'
    }));
    return res.json({ orders });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/payment', requireAuth, async (req, res, next) => {
  const parsed = z.object({
    reference: z.string().min(3).max(100),
    notes: z.string().max(300).optional().default('')
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Referensi pembayaran wajib diisi.' });

  try {
    const result = await withTransaction(async (client) => {
      const orderResult = await client.query('SELECT * FROM public.orders WHERE id = $1 FOR UPDATE', [Number(req.params.id)]);
      const order = orderResult.rows[0];
      if (!order) return { status: 404, body: { error: 'Pesanan tidak ditemukan.' } };
      if (Number(order.buyer_company_id) !== Number(req.user.company_id)) {
        return { status: 403, body: { error: 'Hanya pembeli yang dapat mengirim referensi pembayaran.' } };
      }
      if (order.status !== 'awaiting_payment') {
        return { status: 409, body: { error: 'Pesanan tidak berada pada tahap menunggu pembayaran.' } };
      }
      await client.query(
        `UPDATE public.orders SET status = 'payment_review', payment_reference = $1,
         notes = $2, updated_at = NOW() WHERE id = $3`,
        [parsed.data.reference, parsed.data.notes, order.id]
      );
      await notify(order.seller_company_id, 'Konfirmasi pembayaran masuk', `Pembeli mengirim referensi pembayaran untuk pesanan #${order.id}. Periksa pembayaran melalui kanal resmi perusahaan.`, '/dashboard?tab=orders', client);
      return { status: 200, body: { ok: true, message: 'Referensi pembayaran dikirim untuk ditinjau penjual.' } };
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/action', requireAuth, async (req, res, next) => {
  const parsed = z.object({
    action: z.enum(['confirm_payment', 'schedule_pickup', 'confirm_received', 'cancel']),
    pickupDate: z.string().max(30).optional()
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Aksi pesanan tidak valid.' });

  try {
    const result = await withTransaction(async (client) => {
      const orderResult = await client.query('SELECT * FROM public.orders WHERE id = $1 FOR UPDATE', [Number(req.params.id)]);
      const order = orderResult.rows[0];
      if (!order) return { status: 404, body: { error: 'Pesanan tidak ditemukan.' } };

      const { action, pickupDate } = parsed.data;
      let next = '';
      let recipient = null;
      let title = '';
      let body = '';
      const companyId = Number(req.user.company_id);
      const buyerId = Number(order.buyer_company_id);
      const sellerId = Number(order.seller_company_id);

      if (action === 'confirm_payment') {
        if (sellerId !== companyId || order.status !== 'payment_review') return { status: 403, body: { error: 'Konfirmasi ini hanya tersedia bagi penjual setelah pembeli mengirim referensi.' } };
        next = 'paid'; recipient = buyerId; title = 'Pembayaran dikonfirmasi'; body = `Penjual telah mengonfirmasi pembayaran pesanan #${order.id}.`;
      } else if (action === 'schedule_pickup') {
        if (sellerId !== companyId || order.status !== 'paid') return { status: 403, body: { error: 'Jadwal pengambilan hanya dapat dibuat penjual setelah pembayaran dikonfirmasi.' } };
        if (!pickupDate || pickupDate.length < 4 || Number.isNaN(Date.parse(pickupDate))) return { status: 400, body: { error: 'Tanggal pengambilan wajib diisi dengan format tanggal yang valid.' } };
        next = 'pickup_scheduled'; recipient = buyerId; title = 'Jadwal pengambilan dibuat'; body = `Penjual menjadwalkan pengambilan pesanan #${order.id} pada ${pickupDate}.`;
      } else if (action === 'confirm_received') {
        if (buyerId !== companyId || order.status !== 'pickup_scheduled') return { status: 403, body: { error: 'Konfirmasi penerimaan hanya dapat dilakukan pembeli setelah pengambilan dijadwalkan.' } };
        next = 'completed'; recipient = sellerId; title = 'Pesanan selesai'; body = `Pembeli mengonfirmasi penerimaan pesanan #${order.id}.`;
      } else {
        if (![buyerId, sellerId].includes(companyId) || !['awaiting_payment', 'payment_review'].includes(order.status)) {
          return { status: 403, body: { error: 'Pesanan tidak dapat dibatalkan pada tahap ini.' } };
        }
        next = 'cancelled'; recipient = companyId === buyerId ? sellerId : buyerId; title = 'Pesanan dibatalkan'; body = `Pesanan #${order.id} telah dibatalkan.`;
      }

      await client.query(
        'UPDATE public.orders SET status = $1, pickup_date = COALESCE($2, pickup_date), updated_at = NOW() WHERE id = $3',
        [next, pickupDate || null, order.id]
      );

      if (next === 'completed') {
        await client.query(
          `UPDATE public.listings
           SET quantity_kg = GREATEST(0, quantity_kg - $1),
               status = CASE WHEN quantity_kg - $1 <= 0 THEN 'sold' ELSE 'active' END,
               updated_at = NOW()
           WHERE id = $2`,
          [order.quantity_kg, order.listing_id]
        );
      } else if (next === 'cancelled') {
        await client.query("UPDATE public.listings SET status = 'active', updated_at = NOW() WHERE id = $1", [order.listing_id]);
        await client.query("UPDATE public.offers SET status = 'rejected' WHERE id = $1", [order.offer_id]);
      }
      await notify(recipient, title, body, '/dashboard?tab=orders', client);
      return { status: 200, body: { ok: true, status: next, message: 'Status pesanan berhasil diperbarui.' } };
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
});

export default router;
