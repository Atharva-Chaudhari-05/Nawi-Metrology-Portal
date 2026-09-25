import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-sih-26035';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // First check cookie, then fallback to Authorization header for flexibility
  let token = req.cookies?.token;
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization as string;
    token = authHeader.split(' ')[1];
  }

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const verified = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token.' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};
