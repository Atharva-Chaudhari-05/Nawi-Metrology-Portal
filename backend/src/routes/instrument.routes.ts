import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// GET all instruments (filtered by role)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id, role } = req.user!;
    
    let instruments;
    if (role === 'MANUFACTURER') {
      // Manufacturer sees only their own instruments
      instruments = await prisma.instrument.findMany({
        where: { manufacturerId: id },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Officer/Admin sees all
      instruments = await prisma.instrument.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json(instruments);
  } catch (error) {
    console.error('Fetch instruments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single instrument
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id, role } = req.user!;
    const instrumentId = req.params.id as string;

    const instrument = await prisma.instrument.findUnique({
      where: { id: instrumentId }
    });

    if (!instrument) {
      return res.status(404).json({ error: 'Instrument not found' });
    }

    // Role check
    if (role === 'MANUFACTURER' && instrument.manufacturerId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(instrument);
  } catch (error) {
    console.error('Fetch instrument error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create instrument (Officer/Admin only)
router.post('/', authenticateToken, requireRole(['OFFICER', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const {
      modelName, instrumentType, serialNumber,
      maxCapacity, minCapacity, eValue, accuracyClass, manufacturerId
    } = req.body;

    const instrument = await prisma.instrument.create({
      data: {
        modelName,
        instrumentType,
        serialNumber,
        maxCapacity: parseFloat(maxCapacity),
        minCapacity: parseFloat(minCapacity),
        eValue: parseFloat(eValue),
        accuracyClass,
        manufacturerId, // Optional, links to User if they are registered
        registeredById: req.user!.id
      }
    });

    res.status(201).json({ message: 'Instrument created successfully', instrument });
  } catch (error: any) {
    console.error('Create instrument error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Serial number already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
