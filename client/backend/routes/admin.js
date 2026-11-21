import { Router } from 'express';
import { query, notify } from '../db.js';
import { requireAuth, allowRoles } from '../middleware.js';

const router = Router();

router.get('/companies', requireAuth, allowRoles('admin'), async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, u.email FROM public.companies c
       LEFT JOIN public.users u ON u.company_id = c.id
       ORDER BY c.created_at DESC`
    );
    return res.json({ companies: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.post('/companies/:id/verify', requireAuth, allowRoles('admin'), async (req, res, next) => {
  const status = req.body?.status;
  if (!['verified', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Status verifikasi tidak valid.' });
  }
  try {
    const result = await query(
      'UPDATE public.companies SET verification_status = $1 WHERE id = $2 RETURNING id, name',
      [status, Number(req.params.id)]
    );
    const company = result.rows[0];
    if (!company) return res.status(404).json({ error: 'Perusahaan tidak ditemukan.' });
    await notify(company.id, 'Status verifikasi perusahaan diperbarui', `Status verifikasi ${company.name}: ${status}.`);
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
