// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// POST generate report (stub)
router.post('/generate', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { testSessionId, signatureBase64 } = req.body;
    
    // Stub response for Phase 1 data-entry focus
    res.status(201).json({
      message: 'Report generation stubbed',
      report: {
        id: 'stub-id',
        testSessionId,
        reportNumber: 'NAWI/STUB/2026/001',
        pdfUrl: '/uploads/stub.pdf',
        docxUrl: '/uploads/stub.docx'
      }
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET list reports
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id, role } = req.user!;

    let reports;
    if (role === 'MANUFACTURER') {
      reports = await prisma.report.findMany({
        where: {
          testSession: {
            instrument: {
              manufacturerId: id
            }
          }
        },
        include: { testSession: { include: { instrument: true } } }
      });
    } else {
      reports = await prisma.report.findMany({
        include: { testSession: { include: { instrument: true, labOfficer: true, reviewedBy: true } } }
      });
    }

    res.json(reports);
  } catch (error) {
    console.error('List reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
