// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { isReadingPass, AccuracyClass } from '../utils/oiml-calculator';
import { serializeReadings, parseReadings } from '../utils/serialization';
import { generateReports } from '../utils/pdfGenerator';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

// GET all test sessions
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const sessions = await prisma.testSession.findMany({
      include: {
        instrument: true,
        labOfficer: { select: { id: true, name: true, role: true } },
        reviewedBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(sessions);
  } catch (error) {
    console.error('Fetch sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single test session with results
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const session = await prisma.testSession.findUnique({
      where: { id: req.params.id },
      include: {
        instrument: true,
        labOfficer: { select: { id: true, name: true, role: true } },
        testResults: true,
        report: true
      }
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    // Parse the stringified JSON readings
    session.testResults = session.testResults.map(tr => ({
      ...tr,
      rawReadings: parseReadings(tr.rawReadings)
    }));

    res.json(session);
  } catch (error) {
    console.error('Fetch session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create test session
router.post('/', authenticateToken, requireRole(['OFFICER', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { instrumentId, labTemperature, labHumidity, labAtmosphericPressure } = req.body;

    const instrument = await prisma.instrument.findUnique({ where: { id: instrumentId } });
    if (!instrument) return res.status(404).json({ error: 'Instrument not found' });

    const session = await prisma.testSession.create({
      data: {
        instrumentId,
        labOfficerId: req.user!.id,
        labTemperature: labTemperature ? parseFloat(labTemperature) : null,
        labHumidity: labHumidity ? parseFloat(labHumidity) : null,
        labAtmosphericPressure: labAtmosphericPressure ? parseFloat(labAtmosphericPressure) : null,
        status: 'DRAFT'
      }
    });

    res.status(201).json({ message: 'Session created', session });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST add test result
router.post('/:id/results', authenticateToken, requireRole(['OFFICER', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const sessionId = req.params.id as string;
    const { testType, rawReadings, notes } = req.body; // rawReadings is array of { loadPoint, indicatedValue, referenceValue }

    const session = await prisma.testSession.findUnique({
      where: { id: sessionId },
      include: { instrument: true }
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status !== 'DRAFT') return res.status(400).json({ error: 'Can only add results to DRAFT sessions' });

    const e = session.instrument.eValue;
    // Map accuracy class string to enum
    const accClass = session.instrument.accuracyClass as AccuracyClass;

    let maxError = 0;
    let maxMpe = 0;
    let isPass = true;

    // Process each reading
    if (testType === 'VISUAL_INSPECTION') {
      // For visual inspection, indicatedValue of 0 means Pass, 1 means Fail
      for (const reading of rawReadings) {
        if (reading.indicatedValue !== 0) {
          isPass = false;
        }
      }
    } else {
      for (const reading of rawReadings) {
        const { pass, error, mpe } = isReadingPass(
          accClass,
          e,
          reading.referenceValue,
          reading.indicatedValue
        );
        if (Math.abs(error) > maxError) maxError = Math.abs(error);
        if (mpe > maxMpe) maxMpe = mpe;
        if (!pass) isPass = false;
      }
    }

    const result = await prisma.testResult.create({
      data: {
        testSessionId: sessionId,
        testType,
        rawReadings: serializeReadings(rawReadings),
        calculatedError: maxError,
        permissibleError: maxMpe,
        result: isPass ? 'PASS' : 'FAIL',
        notes
      }
    });

    res.status(201).json({ message: 'Result added', result: { ...result, rawReadings: parseReadings(result.rawReadings) } });
  } catch (error) {
    console.error('Add result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH submit session
router.patch('/:id/submit', authenticateToken, requireRole(['OFFICER', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const sessionId = req.params.id as string;

    const session = await prisma.testSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status !== 'DRAFT') return res.status(400).json({ error: 'Only DRAFT sessions can be submitted' });
    if (session.labOfficerId !== req.user!.id) return res.status(403).json({ error: 'You can only submit your own sessions' });

    const updated = await prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date()
      }
    });

    res.json({ message: 'Session submitted', session: updated });
  } catch (error) {
    console.error('Submit session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// REVIEW ROUTES
// PATCH approve/reject session (Admin/Supervisor only)
router.patch('/:id/review', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const sessionId = req.params.id as string;
    const { action, reviewNotes, signatureData } = req.body; // action = 'APPROVE' or 'REJECT'

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const session = await prisma.testSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status !== 'SUBMITTED') return res.status(400).json({ error: 'Only SUBMITTED sessions can be reviewed' });

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const updated = await prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status: newStatus,
        reviewedById: req.user!.id,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
        reviewerSignature: signatureData || null
      }
    });

    if (newStatus === 'APPROVED') {
      try {
        await generateReports(sessionId);
      } catch (reportErr) {
        console.error('Failed to generate report:', reportErr);
      }
    }

    res.json({ message: `Session ${newStatus.toLowerCase()}`, session: updated });
  } catch (error) {
    console.error('Review session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET download pdf report
router.get('/:id/report', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: { testSessionId: req.params.id }
    });
    if (!report || !report.pdfUrl) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const filePath = path.join(__dirname, '../../', report.pdfUrl.replace(/^\//, ''));
    res.download(filePath, (err) => {
      if (err) {
        console.error('Express download error:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to download file' });
      }
    });
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET download docx report
router.get('/:id/report/docx', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: { testSessionId: req.params.id }
    });
    if (!report || !report.docxUrl) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const filePath = path.join(__dirname, '../../', report.docxUrl.replace(/^\//, ''));
    res.download(filePath, (err) => {
      if (err) {
        console.error('Express download error:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to download file' });
      }
    });
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH revoke approved session
router.patch('/:id/revoke', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const sessionId = req.params.id as string;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required for revocation' });
    }

    const session = await prisma.testSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status !== 'APPROVED') return res.status(400).json({ error: 'Only APPROVED sessions can be revoked' });

    const updated = await prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status: 'REJECTED',
        reviewNotes: `[REVOKED]: ${reason}`
      }
    });

    res.json({ message: 'Session revoked', session: updated });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
