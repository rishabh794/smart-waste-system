import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

interface TokenPayload extends JwtPayload {
  id: string;
  role: 'admin' | 'driver' | 'user';
}

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
if (!NEXTAUTH_SECRET) throw new Error('NEXTAUTH_SECRET is not defined in environment');

export const requireAuth = (req: Request, res: Response, next: NextFunction): any => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1]!; 

  try {
    const decoded = jwt.verify(token, NEXTAUTH_SECRET as string) as unknown as TokenPayload;

    if (decoded.role !== 'user') {
      return res.status(403).json({ error: 'Forbidden: Citizen access required' });
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): any => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1]!; 

  try {
    const decoded = jwt.verify(token, NEXTAUTH_SECRET as string) as unknown as TokenPayload;

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const requireDriverOrAdmin = (req: Request, res: Response, next: NextFunction): any => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1]!;

  try {
    const decoded = jwt.verify(token, NEXTAUTH_SECRET as string) as unknown as TokenPayload;

    if (decoded.role !== 'admin' && decoded.role !== 'driver') {
      return res.status(403).json({ error: 'Forbidden: Driver or admin access required' });
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};