import jwt from 'jsonwebtoken';
import db from './db.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.tw_session;
  if (!token) return res.status(401).json({ error: 'Silakan masuk terlebih dahulu.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare(`SELECT u.id,u.name,u.email,u.role,u.company_id,
      c.name AS company_name,c.industry,c.city,c.verification_status
      FROM users u LEFT JOIN companies c ON c.id=u.company_id WHERE u.id=?`).get(payload.id);
    if (!user) return res.status(401).json({ error: 'Sesi tidak valid.' });
    req.user = user;
    next();
  } catch {
    res.clearCookie('tw_session');
    return res.status(401).json({ error: 'Sesi berakhir. Silakan masuk kembali.' });
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Akses tidak diizinkan untuk akun ini.' });
    }
    next();
  };
}
