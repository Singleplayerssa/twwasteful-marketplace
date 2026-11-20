import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware.js';

const router = Router();
router.get('/', requireAuth, (req, res) => {
  const companyId = req.user.company_id;
  const listings = db.prepare('SELECT COUNT(*) AS count FROM listings WHERE company_id=? AND status IN (\'active\',\'reserved\')').get(companyId).count;
  const incoming = db.prepare("SELECT COUNT(*) AS count FROM offers WHERE seller_company_id=? AND status='pending'").get(companyId).count;
  const orders = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE (buyer_company_id=? OR seller_company_id=?) AND status NOT IN ('completed','cancelled')").get(companyId,companyId).count;
  const volume = db.prepare("SELECT COALESCE(SUM(total_price),0) AS total FROM orders WHERE (buyer_company_id=? OR seller_company_id=?) AND status='completed'").get(companyId,companyId).total;
  const notifications = db.prepare('SELECT * FROM notifications WHERE company_id=? ORDER BY created_at DESC LIMIT 8').all(companyId);
  const chart = db.prepare(`SELECT strftime('%Y-%m',created_at) AS month,COUNT(*) AS total FROM orders
    WHERE buyer_company_id=? OR seller_company_id=? GROUP BY month ORDER BY month DESC LIMIT 6`).all(companyId,companyId).reverse();
  res.json({ stats: { listings,incoming,orders,volume },notifications,chart,company: db.prepare('SELECT * FROM companies WHERE id=?').get(companyId) });
});
router.post('/notifications/read', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read=1 WHERE company_id=?').run(req.user.company_id);
  res.json({ ok: true });
});
export default router;
