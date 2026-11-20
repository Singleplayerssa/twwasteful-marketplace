import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId) return res.status(400).json({ error: 'Akun belum terhubung dengan perusahaan.' });

    const [listingCount, incomingCount, orderCount, volumeResult, notificationResult, chartResult, companyResult] = await Promise.all([
      query("SELECT COUNT(*)::int AS count FROM public.listings WHERE company_id = $1 AND status IN ('active', 'reserved')", [companyId]),
      query("SELECT COUNT(*)::int AS count FROM public.offers WHERE seller_company_id = $1 AND status = 'pending'", [companyId]),
      query("SELECT COUNT(*)::int AS count FROM public.orders WHERE (buyer_company_id = $1 OR seller_company_id = $1) AND status NOT IN ('completed', 'cancelled')", [companyId]),
      query("SELECT COALESCE(SUM(total_price), 0) AS total FROM public.orders WHERE (buyer_company_id = $1 OR seller_company_id = $1) AND status = 'completed'", [companyId]),
      query('SELECT * FROM public.notifications WHERE company_id = $1 ORDER BY created_at DESC LIMIT 8', [companyId]),
      query(`SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS total
             FROM public.orders WHERE buyer_company_id = $1 OR seller_company_id = $1
             GROUP BY TO_CHAR(created_at, 'YYYY-MM') ORDER BY month DESC LIMIT 6`, [companyId]),
      query('SELECT * FROM public.companies WHERE id = $1', [companyId])
    ]);

    return res.json({
      stats: {
        listings: listingCount.rows[0].count,
        incoming: incomingCount.rows[0].count,
        orders: orderCount.rows[0].count,
        volume: volumeResult.rows[0].total
      },
      notifications: notificationResult.rows,
      chart: chartResult.rows.reverse(),
      company: companyResult.rows[0] || null
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/notifications/read', requireAuth, async (req, res, next) => {
  try {
    await query('UPDATE public.notifications SET is_read = TRUE WHERE company_id = $1', [req.user.company_id]);
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
