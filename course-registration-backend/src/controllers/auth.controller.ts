import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, password } = req.body;

    if (password !== '123456') {
      res.status(401).json({ error: 'Wrong Password' });
      return;
    }

    // Check user is exist in database or not
    const user = await prisma.user.findUnique({
      where: { id: id.toUpperCase() } 
    });

    if (!user) {
      res.status(404).json({ error: 'No Record, Pleace Check ID' });
      return;
    }

    // Sign Token
    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' } 
    );

    // Send token and user info
    res.json({
      message: 'Login Successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        faculty: user.faculty,
        program: user.program
      }
    });

  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: 'Server internal error' });
  }
};