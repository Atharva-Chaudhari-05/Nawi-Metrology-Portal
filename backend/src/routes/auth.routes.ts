import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-sih-26035';

router.post('/signup', async (req, res) => {
  try {
    const {
      name, email, password, role,
      labName, labRegId, designation, employeeCode,
      companyName, manufacturerLicenseNo
    } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check existing
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Auto-activate for demo simplicity if officer/manufacturer, but prompt said:
    // "New Lab Officer/Manufacturer signups should go to status: pending... auto-activate for demo simplicity"
    const status = 'ACTIVE'; 

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        status,
        labName,
        labRegId,
        designation,
        employeeCode,
        companyName,
        manufacturerLicenseNo
      }
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id, status: user.status });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account is pending or deactivated' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Don't send password hash
    const { passwordHash, ...userWithoutPassword } = user;
    
    res.json({ message: 'Login successful', user: userWithoutPassword, token }); // send token in body too just in case frontend needs it for auth header fallback
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Fetch me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
