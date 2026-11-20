import { Router } from 'express';
import db, { notify } from '../db.js';
import { requireAuth, allowRoles } from '../middleware.js';
const router = Router();
router.get('/companies', requireAuth, allowRoles('admin'), (_req,res) => {
  res.json({ companies: db.prepare(`SELECT c.*,u.email FROM companies c LEFT JOIN users u ON u.company_id=c.id ORDER BY c.created_at DESC`).all() });
});
router.post('/companies/:id/verify', requireAuth, allowRoles('admin'), (req,res) => {
  const status = req.body.status;
  if (!['verified','rejected','pending'].includes(status)) return res.status(400).json({ error: 'Status verifikasi tidak valid.' });
  const company = db.prepare('SELECT id,name FROM companies WHERE id=?').get(Number(req.params.id));
  if (!company) return res.status(404).json({ error: 'Perusahaan tidak ditemukan.' });
  db.prepare('UPDATE companies SET verification_status=? WHERE id=?').run(status,company.id);
  notify(company.id,'Status verifikasi perusahaan diperbarui',`Status verifikasi ${company.name}: ${status}.`);
  res.json({ ok: true });
});
export default router;
