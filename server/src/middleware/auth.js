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

export const requireActiveSubscription = async (req, res, next) => {
  if (!req.user || req.user.role === 'SUPER_ADMIN' || req.user.role === 'ORGANIZATION') {
    return next(); // Admins and Organizations bypass subscription checks
  }

  try {
    const { prisma } = await import('../config/prisma.js');
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { subscriptionStatus: true, subscriptionExpiresAt: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Admins mapped as PARENT or something else could bypass if needed, but let's stick to standard logic
    if (user.role === 'SUPER_ADMIN' || user.role === 'ORGANIZATION') {
      return next();
    }

    const expDate = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
    const isExpired =
      user.subscriptionStatus === 'EXPIRED' ||
      user.subscriptionStatus === 'PENDING' ||
      (expDate && expDate < new Date());

    if (isExpired) {
      return res.status(402).json({ error: 'Payment Required: Your subscription plan has expired. Please renew to access this feature.' });
    }

    next();
  } catch (err) {
    console.error('Subscription validation error:', err);
    return res.status(500).json({ error: 'Failed to validate subscription status' });
  }
};
