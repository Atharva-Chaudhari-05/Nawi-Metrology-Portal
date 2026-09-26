import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle, ImageRun } from 'docx';
import path from 'path';
import fs from 'fs';
import { AccuracyClass, isReadingPass } from './oiml-calculator';

export async function createDocxFile(data: any, uploadsDir: string, fileName: string): Promise<string> {
  const docPath = path.join(uploadsDir, fileName);

  const createInfoRow = (label: string, value: string) => {
    return new Paragraph({
      children: [
        new TextRun({ text: label + ": ", bold: true, color: "525252" }),
        new TextRun({ text: value, color: "1C1C1C" }),
      ],
      spacing: { after: 100 },
    });
  };

  const testTables = data.testResults.map((tr: any) => {
    const headerRow = new TableRow({
      children: [
        "Load Point", "Reference Load", "Indicated Value", "Error", "MPE", "Result"
      ].map(text => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
        shading: { fill: "F9FAFB" },
        margins: { top: 100, bottom: 100, left: 100, right: 100 }
      })),
    });

    const dataRows = tr.readings.map((r: any) => {
      let error = r.calculatedError;
      let mpeVal = r.mpe || r.permissibleError;
      let passStr = r.result;
      
      if (error === undefined) {
          const e = data.instrument.eValue;
          const accClass = data.instrument.accuracyClass as AccuracyClass;
          const calc = isReadingPass(accClass, e, r.referenceValue, r.indicatedValue);
          error = calc.error.toFixed(4);
          mpeVal = calc.mpe.toFixed(4);
          passStr = calc.pass ? 'PASS' : 'FAIL';
      }

      const isVisual = tr.testType === 'VISUAL_INSPECTION';
      const refValStr = isVisual ? 'N/A' : r.referenceValue.toString();
      const indValStr = isVisual ? (r.indicatedValue === 0 ? 'Pass' : 'Fail') : r.indicatedValue.toString();
      const errStr = isVisual ? '-' : error.toString();
      const mpeStr = isVisual ? '-' : '±' + mpeVal.toString();

      return new TableRow({
        children: [
          r.loadPoint.toString(),
          refValStr,
          indValStr,
          errStr,
          mpeStr,
          passStr
        ].map(text => new TableCell({
          children: [new Paragraph({ text })],
          margins: { top: 100, bottom: 100, left: 100, right: 100 }
        })),
      });
    });

    return [
      new Paragraph({
        text: tr.testType.replace('_', ' '),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 400, after: 200 }
      }),
      new Table({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    ];
  }).flat();

  let signatureImage: any = null;
  if (data.supervisorSignature) {
    try {
      const base64Data = data.supervisorSignature.replace(/^data:image\/\w+;base64,/, "");
      signatureImage = new Paragraph({
        children: [
          new ImageRun({
            data: Buffer.from(base64Data, 'base64'),
            transformation: { width: 200, height: 80 },
            type: 'png' as const
          })
        ],
        spacing: { before: 200 }
      });
    } catch (e) {
      console.error("Failed to parse signature image", e);
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Ministry of Consumer Affairs",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: "Legal Metrology Department — OIML R-76 Verification",
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({
            text: "Test Report — Non-Automatic Weighing Instrument (NAWI)",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Report No: ", bold: true }),
              new TextRun({ text: data.reportNumber + "    " }),
              new TextRun({ text: "Date: ", bold: true }),
              new TextRun({ text: new Date(data.generatedAt).toLocaleDateString() }),
            ],
            spacing: { after: 400 }
          }),
          new Paragraph({
            text: `OVERALL VERDICT: ${data.isPass ? 'PASS' : 'FAIL'}`,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({ text: "Instrument Details", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 200 } }),
          createInfoRow("Model", data.instrument.modelName),
          createInfoRow("Manufacturer", data.instrument.manufacturer?.name || data.instrument.manufacturerName || 'N/A'),
          createInfoRow("Serial Number", data.instrument.serialNumber),
          createInfoRow("Type", data.instrument.instrumentType),
          createInfoRow("Accuracy Class", data.instrument.accuracyClass),
          createInfoRow("Max Capacity", `${data.instrument.maxCapacity} kg`),
          createInfoRow("Min Capacity", `${data.instrument.minCapacity} kg`),
          createInfoRow("Verification Scale Interval (e)", `${data.instrument.eValue} kg`),
          
          new Paragraph({ text: "Test Conditions", heading: HeadingLevel.HEADING_3, spacing: { before: 400, after: 200 } }),
          createInfoRow("Testing Date", new Date(data.testSession.createdAt).toLocaleDateString()),
          createInfoRow("Temperature", `${data.testSession.labTemperature || '-'} °C`),
          createInfoRow("Humidity", `${data.testSession.labHumidity || '-'} %`),
          createInfoRow("Atmospheric Pressure", `${data.testSession.labAtmosphericPressure || '-'} hPa`),
          
          new Paragraph({ text: "Verification Results", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
          ...testTables,

          new Paragraph({ text: "Signatures", heading: HeadingLevel.HEADING_2, spacing: { before: 600, after: 200 } }),
          createInfoRow("Approved By", data.supervisor.name),
          createInfoRow("Role", data.supervisor.designation || 'Lab Supervisor'),
          createInfoRow("Date", new Date(data.testSession.reviewedAt).toLocaleDateString()),
          signatureImage ? signatureImage : new Paragraph({ text: "[No Signature Provided]" }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(docPath, buffer);
  
  return docPath;
}
