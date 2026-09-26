import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { isReadingPass, AccuracyClass } from './oiml-calculator';
import { createDocxFile } from './docxGenerator';

const prisma = new PrismaClient();

function getReportHtml(data: any): string {
  // Safe helper for base64 images
  const safeImg = (src?: string) => src ? `<img src="${src}" alt="signature" class="signature-img" />` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NAWI Test Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');
    
    :root {
      --primary: #1F5F5B;
      --success: #166534;
      --fail: #991B1B;
      --text: #1C1C1C;
      --text-secondary: #525252;
      --border: #E5E7EB;
    }

    body {
      font-family: 'Inter', sans-serif;
      color: var(--text);
      line-height: 1.5;
      margin: 0;
      padding: 0;
    }

    .header {
      background-color: var(--primary);
      color: white;
      padding: 24px 40px;
      display: flex;
      align-items: center;
    }
    .header h1 {
      font-family: 'Fraunces', serif;
      margin: 0;
      font-size: 24px;
    }
    .header p {
      margin: 4px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }

    .container {
      padding: 40px;
    }

    .report-title {
      font-family: 'Fraunces', serif;
      font-size: 28px;
      margin-bottom: 8px;
      color: var(--primary);
    }
    .report-meta {
      display: flex;
      justify-content: space-between;
      color: var(--text-secondary);
      font-size: 14px;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--primary);
    }

    .verdict-banner {
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 32px;
      text-align: center;
      font-weight: bold;
      font-size: 18px;
    }
    .verdict-pass {
      background-color: #dcfce7;
      color: var(--success);
      border: 1px solid #bbf7d0;
    }
    .verdict-fail {
      background-color: #fee2e2;
      color: var(--fail);
      border: 1px solid #fecaca;
    }

    .section-title {
      font-family: 'Fraunces', serif;
      font-size: 18px;
      color: var(--primary);
      margin: 24px 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 32px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      padding: 4px 0;
    }
    .info-label {
      color: var(--text-secondary);
    }
    .info-val {
      font-weight: 500;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 12px;
    }
    th {
      background-color: #f9fafb;
      color: var(--text-secondary);
      text-align: left;
      padding: 10px;
      border: 1px solid var(--border);
    }
    td {
      padding: 10px;
      border: 1px solid var(--border);
      font-family: monospace;
      font-size: 13px;
    }
    .badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 11px;
      font-family: 'Inter', sans-serif;
    }
    .badge-pass { background: #dcfce7; color: var(--success); }
    .badge-fail { background: #fee2e2; color: var(--fail); }

    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 60px;
      page-break-inside: avoid;
    }
    .sig-box {
      border: 1px solid var(--border);
      padding: 20px;
      border-radius: 8px;
      position: relative;
    }
    .sig-title {
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 16px;
    }
    .sig-line {
      margin-top: 60px;
      border-top: 1px solid var(--text);
      padding-top: 8px;
    }
    .signature-img {
      position: absolute;
      bottom: 60px;
      left: 20px;
      max-height: 80px;
      max-width: 200px;
    }

    .footer {
      margin-top: 60px;
      text-align: center;
      font-size: 11px;
      color: var(--text-secondary);
      border-top: 1px solid var(--border);
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Ministry of Consumer Affairs</h1>
      <p>Legal Metrology Department — OIML R-76 Verification</p>
    </div>
  </div>

  <div class="container">
    <div class="report-title">Test Report — Non-Automatic Weighing Instrument (NAWI)</div>
    <div class="report-meta">
      <div><strong>Report No:</strong> ${data.reportNumber}</div>
      <div><strong>Date:</strong> ${new Date(data.generatedAt).toLocaleDateString()}</div>
    </div>

    <div class="verdict-banner ${data.isPass ? 'verdict-pass' : 'verdict-fail'}">
      OVERALL VERDICT: ${data.isPass ? 'PASS' : 'FAIL'}
    </div>

    <div class="grid-2">
      <div>
        <div class="section-title">Instrument Details</div>
        <div class="info-row"><span class="info-label">Model</span><span class="info-val">${data.instrument.modelName}</span></div>
        <div class="info-row"><span class="info-label">Manufacturer</span><span class="info-val">${data.instrument.manufacturerName || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Serial Number</span><span class="info-val">${data.instrument.serialNumber}</span></div>
        <div class="info-row"><span class="info-label">Type</span><span class="info-val">${data.instrument.instrumentType}</span></div>
        <div class="info-row"><span class="info-label">Accuracy Class</span><span class="info-val">${data.instrument.accuracyClass}</span></div>
        <div class="info-row"><span class="info-label">Max Capacity</span><span class="info-val">${data.instrument.maxCapacity} kg</span></div>
        <div class="info-row"><span class="info-label">Min Capacity</span><span class="info-val">${data.instrument.minCapacity} kg</span></div>
        <div class="info-row"><span class="info-label">Verification Scale Interval (e)</span><span class="info-val">${data.instrument.eValue} kg</span></div>
      </div>
      <div>
        <div class="section-title">Test Conditions</div>
        <div class="info-row"><span class="info-label">Testing Date</span><span class="info-val">${new Date(data.testSession.createdAt).toLocaleDateString()}</span></div>
        <div class="info-row"><span class="info-label">Temperature</span><span class="info-val">${data.testSession.labTemperature || '-'} °C</span></div>
        <div class="info-row"><span class="info-label">Humidity</span><span class="info-val">${data.testSession.labHumidity || '-'} %</span></div>
        <div class="info-row"><span class="info-label">Atmospheric Pressure</span><span class="info-val">${data.testSession.labAtmosphericPressure || '-'} hPa</span></div>
      </div>
    </div>

    <div class="section-title">Verification Results</div>
    ${data.testResults.map((tr: any) => `
      <h4 style="margin-bottom: 8px; color: #374151;">${tr.testType.replace('_', ' ')}</h4>
      <table>
        <thead>
          <tr>
            <th>Load Point</th>
            <th>Reference Load</th>
            <th>Indicated Value</th>
            <th>Error</th>
            <th>MPE</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          ${tr.readings.map((r: any) => {
            let error = r.calculatedError;
            let mpeVal = r.mpe || r.permissibleError;
            let passStr = r.result;
            
            if (error === undefined) {
               // Calculate on the fly if not in rawReadings
               const e = data.instrument.eValue;
               const accClass = data.instrument.accuracyClass as AccuracyClass;
               const calc = isReadingPass(accClass, e, r.referenceValue, r.indicatedValue);
               error = calc.error.toFixed(4);
               mpeVal = calc.mpe.toFixed(4);
               passStr = calc.pass ? 'PASS' : 'FAIL';
            }

            const pass = passStr === 'PASS';
            const badgeClass = pass ? 'badge-pass' : 'badge-fail';
            
            const isVisual = tr.testType === 'VISUAL_INSPECTION';
            const refValStr = isVisual ? 'N/A' : r.referenceValue;
            const indValStr = isVisual ? (r.indicatedValue === 0 ? 'Pass' : 'Fail') : r.indicatedValue;
            const errStr = isVisual ? '-' : error;
            const mpeStr = isVisual ? '-' : '±' + mpeVal;

            return '<tr>' +
              '<td>' + r.loadPoint + '</td>' +
              '<td>' + refValStr + '</td>' +
              '<td>' + indValStr + '</td>' +
              '<td>' + errStr + '</td>' +
              '<td>' + mpeStr + '</td>' +
              '<td><span class="badge ' + badgeClass + '">' + passStr + '</span></td>' +
            '</tr>';
          }).join('')}
        </tbody>
      </table>
    `).join('')}

    <div class="signatures">
      <div class="sig-box">
        <div class="sig-title">Tested By</div>
        <div class="info-row"><span class="info-label">Name</span><span class="info-val">${data.officer.name}</span></div>
        <div class="info-row"><span class="info-label">Role</span><span class="info-val">${data.officer.designation || 'Lab Officer'}</span></div>
        <div class="info-row"><span class="info-label">Date</span><span class="info-val">${new Date(data.testSession.submittedAt || data.testSession.createdAt).toLocaleDateString()}</span></div>
        ${safeImg(data.officerSignature)}
        <div class="sig-line">Signature</div>
      </div>
      <div class="sig-box">
        <div class="sig-title">Approved By</div>
        <div class="info-row"><span class="info-label">Name</span><span class="info-val">${data.supervisor.name}</span></div>
        <div class="info-row"><span class="info-label">Role</span><span class="info-val">${data.supervisor.designation || 'Lab Supervisor'}</span></div>
        <div class="info-row"><span class="info-label">Date</span><span class="info-val">${new Date(data.testSession.reviewedAt).toLocaleDateString()}</span></div>
        ${safeImg(data.supervisorSignature)}
        <div class="sig-line">Signature</div>
      </div>
    </div>

    <div class="footer">
      Report ID: ${data.reportId} | Generated by NAWI Metrology Portal
    </div>
  </div>
</body>
</html>
  `;
}

export async function generateReports(sessionId: string) {
  // Fetch fully populated session
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: {
      instrument: true,
      labOfficer: true,
      reviewedBy: true,
      testResults: true
    }
  });

  if (!session || !session.reviewedBy) throw new Error("Session not found or not reviewed.");

  const labRegId = session.labOfficer.labRegId || 'LAB';
  const year = new Date().getFullYear();
  const lastReport = await prisma.report.findFirst({
    orderBy: { generatedAt: 'desc' }
  });
  let nextSeq = 1;
  if (lastReport && lastReport.reportNumber) {
    const parts = lastReport.reportNumber.split('/');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }
  const sequential = String(nextSeq).padStart(4, '0');
  const reportNumber = 'NAWI/' + labRegId + '/' + year + '/' + sequential;

  const isPass = session.status === 'APPROVED'; // Based on overall review, which requires all PASS

  const parsedResults = session.testResults.map(tr => ({
    ...tr,
    readings: JSON.parse(tr.rawReadings)
  }));

  const data = {
    reportNumber,
    generatedAt: new Date(),
    isPass,
    instrument: session.instrument,
    testSession: session,
    testResults: parsedResults,
    officer: session.labOfficer,
    officerSignature: null, // If you eventually store officer signature, add here
    supervisor: session.reviewedBy,
    supervisorSignature: session.reviewerSignature,
    reportId: session.id
  };

  const html = getReportHtml(data);

  const uploadsDir = path.join(__dirname, '../../uploads/reports');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const pdfFileName = reportNumber.replace(/\//g, '-') + '.pdf';
  const pdfPath = path.join(uploadsDir, pdfFileName);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  await browser.close();

  const docxFileName = reportNumber.replace(/\//g, '-') + '.docx';
  await createDocxFile(data, uploadsDir, docxFileName);

  // Create or update report record
  const report = await prisma.report.upsert({
    where: { testSessionId: session.id },
    update: {
      reportNumber,
      pdfUrl: '/uploads/reports/' + pdfFileName,
      docxUrl: '/uploads/reports/' + docxFileName,
      approvedBySignatureUrl: session.reviewerSignature,
    },
    create: {
      testSessionId: session.id,
      reportNumber,
      pdfUrl: '/uploads/reports/' + pdfFileName,
      docxUrl: '/uploads/reports/' + docxFileName,
      approvedBySignatureUrl: session.reviewerSignature,
    }
  });

  return report;
}
