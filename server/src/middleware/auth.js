import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const resolvedId = decoded.id || decoded.userId;
    req.user = {
      ...decoded,
      id: resolvedId,
      userId: resolvedId,
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token' });
  }
};

export const optionalAuthToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
    } catch (err) {
      // Ignore token verification errors for optional auth (e.g. pending registration flow)
    }
  }
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied. Super Admin privileges required.' });
  }
  next();
};
