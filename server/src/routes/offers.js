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
       FROM public.offers o
       JOIN public.listings l ON l.id = o.listing_id
       JOIN public.companies buyer ON buyer.id = o.buyer_company_id
       JOIN public.companies seller ON seller.id = o.seller_company_id
       WHERE o.buyer_company_id = $1 OR o.seller_company_id = $1
       ORDER BY o.created_at DESC`,
      [companyId]
    );
    const offers = result.rows.map((offer) => ({
      ...offer,
      direction: Number(offer.buyer_company_id) === Number(companyId) ? 'sent' : 'received'
    }));
    return res.json({ offers });
  } catch (error) {
    return next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    if (!['buyer', 'both', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Akun ini belum memiliki akses pembeli.' });
    }
    const parsed = z.object({
      listingId: z.coerce.number().int().positive(),
      quantityKg: z.coerce.number().positive(),
      pricePerKg: z.coerce.number().nonnegative(),
      message: z.string().max(600).optional().default('')
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    if (!req.user.company_id) return res.status(400).json({ error: 'Akun belum terhubung dengan perusahaan.' });

    const data = parsed.data;
    const listingResult = await query(
      "SELECT * FROM public.listings WHERE id = $1 AND status = 'active'",
      [data.listingId]
    );
    const listing = listingResult.rows[0];
    if (!listing) return res.status(404).json({ error: 'Listing sudah tidak tersedia.' });
    if (Number(listing.company_id) === Number(req.user.company_id)) {
      return res.status(400).json({ error: 'Perusahaan tidak dapat mengajukan penawaran pada listing sendiri.' });
    }
    if (data.quantityKg < Number(listing.min_order_kg) || data.quantityKg > Number(listing.quantity_kg)) {
      return res.status(400).json({
        error: `Jumlah harus antara ${Number(listing.min_order_kg).toLocaleString('id-ID')} kg dan ${Number(listing.quantity_kg).toLocaleString('id-ID')} kg.`
      });
    }

    const result = await withTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO public.offers
         (listing_id, buyer_company_id, seller_company_id, quantity_kg, proposed_price_per_kg, message)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [listing.id, req.user.company_id, listing.company_id, data.quantityKg, data.pricePerKg, data.message]
      );
      await notify(listing.company_id, 'Penawaran baru masuk', `${req.user.company_name} mengajukan penawaran untuk ${listing.title}.`, '/dashboard?tab=offers', client);
      return inserted.rows[0].id;
    });
    return res.status(201).json({ offerId: result, message: 'Penawaran berhasil dikirim.' });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/respond', requireAuth, async (req, res, next) => {
  const parsed = z.object({ decision: z.enum(['accept', 'reject']) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Pilihan respons tidak valid.' });

  try {
    const result = await withTransaction(async (client) => {
      const offerResult = await client.query(
        'SELECT * FROM public.offers WHERE id = $1 FOR UPDATE',
        [Number(req.params.id)]
      );
      const offer = offerResult.rows[0];
      if (!offer) return { status: 404, body: { error: 'Penawaran tidak ditemukan.' } };
      if (Number(offer.seller_company_id) !== Number(req.user.company_id)) {
        return { status: 403, body: { error: 'Hanya perusahaan penjual yang dapat merespons penawaran.' } };
      }
      if (offer.status !== 'pending') return { status: 409, body: { error: 'Penawaran ini sudah diproses.' } };

      if (parsed.data.decision === 'reject') {
        await client.query("UPDATE public.offers SET status = 'rejected' WHERE id = $1", [offer.id]);
        await notify(offer.buyer_company_id, 'Penawaran belum diterima', 'Penjual belum dapat menyetujui penawaran tersebut. Kamu dapat mencoba listing lain.', '/dashboard?tab=offers', client);
        return { status: 200, body: { ok: true, message: 'Penawaran ditolak.' } };
      }

      const listingResult = await client.query(
        'SELECT * FROM public.listings WHERE id = $1 FOR UPDATE',
        [offer.listing_id]
      );
      const listing = listingResult.rows[0];
      if (!listing || listing.status !== 'active' || Number(offer.quantity_kg) > Number(listing.quantity_kg)) {
        return { status: 409, body: { error: 'Stok sudah berubah. Periksa listing sebelum menerima penawaran.' } };
      }

      await client.query("UPDATE public.offers SET status = 'accepted' WHERE id = $1", [offer.id]);
      const total = Math.round(Number(offer.quantity_kg) * Number(offer.proposed_price_per_kg));
      const orderResult = await client.query(
        `INSERT INTO public.orders
         (offer_id, listing_id, buyer_company_id, seller_company_id, quantity_kg, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [offer.id, offer.listing_id, offer.buyer_company_id, offer.seller_company_id,
         offer.quantity_kg, offer.proposed_price_per_kg, total]
      );
      await client.query(
        "UPDATE public.listings SET status = 'reserved', updated_at = NOW() WHERE id = $1",
        [listing.id]
      );
      const orderId = orderResult.rows[0].id;
      await notify(offer.buyer_company_id, 'Penawaran disetujui', `Pesanan #${orderId} terbentuk. Lanjutkan konfirmasi pembayaran dengan penjual.`, '/dashboard?tab=orders', client);
      return { status: 200, body: { ok: true, orderId, message: 'Penawaran diterima dan pesanan berhasil dibuat.' } };
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
});

export default router;
