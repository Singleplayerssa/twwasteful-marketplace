import jwt from 'jsonwebtoken';
import { query } from './db.js';

export async function requireAuth(req, res, next) {
  const token = req.cookies?.tw_session;
  if (!token) return res.status(401).json({ error: 'Silakan masuk terlebih dahulu.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.company_id,
              c.name AS company_name, c.industry, c.city, c.verification_status
       FROM public.users u
       LEFT JOIN public.companies c ON c.id = u.company_id
       WHERE u.id = $1`,
      [payload.id]
    );
    if (!result.rows[0]) {
      res.clearCookie('tw_session', { httpOnly: true, sameSite: 'lax', secure: true, path: '/' });
      return res.status(401).json({ error: 'Sesi tidak valid. Silakan masuk kembali.' });
    }
    req.user = result.rows[0];
    return next();
  } catch (error) {
    if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
      res.clearCookie('tw_session', { httpOnly: true, sameSite: 'lax', secure: true, path: '/' });
      return res.status(401).json({ error: 'Sesi berakhir. Silakan masuk kembali.' });
    }
    return next(error);
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Akses tidak diizinkan untuk akun ini.' });
    }
    return next();
  };
}
