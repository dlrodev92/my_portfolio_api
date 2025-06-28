import { Request, Response } from 'express';
import { generateToken } from '../utils/jwt';

export const login = (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body;

    // Hardcoded admin check
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      res.status(401).json({
        error: 'Invalid credentials'
      });
      return;
    }

    // Generate JWT token
    const token = generateToken({ 
      email: ADMIN_EMAIL,
      role: 'admin' 
    });

    res.json({
      success: true,
      token,
      user: {
        email: ADMIN_EMAIL,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed'
    });
  }
};