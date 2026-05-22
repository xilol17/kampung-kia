import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // 1. Checking Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorize: Login First!' });
    return;
  }

  // 2. Take the token
  const token = authHeader.split(' ')[1];

  try {
    // 3. verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    
    req.user = decoded; 
    
    next(); 
  } catch (error) {
    res.status(403).json({ error: 'Token Expired, Please Login again!' });
  }
};