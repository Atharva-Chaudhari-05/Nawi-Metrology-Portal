import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateReports } from '../src/utils/pdfGenerator';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  await prisma.attachment.deleteMany();
  await prisma.report.deleteMany();
  await prisma.testResult.deleteMany();
  await prisma.testSession.deleteMany();
  await prisma.instrument.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin Supervisor',
      email: 'admin@metrology.gov.in',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      labName: 'Central Metrology Lab',
      labRegId: 'CML-DEL-001',
      designation: 'Chief Inspector',
      employeeCode: 'EMP-ADM-001',
    },
  });

  const officer1 = await prisma.user.create({
    data: {
      name: 'Rajesh Kumar',
      email: 'rajesh.officer@metrology.gov.in',
      passwordHash,
      role: 'OFFICER',
      status: 'ACTIVE',
      labName: 'Central Metrology Lab',
      labRegId: 'CML-DEL-001',
      designation: 'Testing Officer',
      employeeCode: 'EMP-OFF-101',
    },
  });

  const officer2 = await prisma.user.create({
    data: {
      name: 'Sneha Patel',
      email: 'sneha.officer@metrology.gov.in',
      passwordHash,
      role: 'OFFICER',
      status: 'ACTIVE',
      labName: 'Central Metrology Lab',
      labRegId: 'CML-DEL-001',
      designation: 'Testing Officer',
      employeeCode: 'EMP-OFF-102',
    },
  });

  const manufacturer1 = await prisma.user.create({
    data: {
      name: 'Acme Scales India',
      email: 'contact@acmescales.in',
      passwordHash,
      role: 'MANUFACTURER',
      status: 'ACTIVE',
      companyName: 'Acme Scales India Pvt Ltd',
      manufacturerLicenseNo: 'MFG-ACME-2026',
    },
  });

  const manufacturer2 = await prisma.user.create({
    data: {
      name: 'Precision Weighing Corp',
      email: 'sales@precisionweighing.in',
      passwordHash,
      role: 'MANUFACTURER',
      status: 'ACTIVE',
      companyName: 'Precision Weighing Corp',
      manufacturerLicenseNo: 'MFG-PREC-2025',
    },
  });

  const pendingUser = await prisma.user.create({
    data: {
      name: 'New Applicant Co',
      email: 'new@applicant.in',
      passwordHash,
      role: 'MANUFACTURER',
      status: 'PENDING',
      companyName: 'New Applicant Co',
      manufacturerLicenseNo: 'MFG-NEW-999',
    },
  });

  console.log('Users created.');

  const inst1 = await prisma.instrument.create({
    data: {
      modelName: 'ProWeigh-500',
      instrumentType: 'PLATFORM_SCALE',
      serialNumber: 'SN-PW500-1111',
      maxCapacity: 500, // 500kg
      minCapacity: 10,  // 10kg
      eValue: 0.1,      // e = 100g
      accuracyClass: 'II',
      manufacturerId: manufacturer1.id,
      registeredById: officer1.id,
    },
  });

  const inst2 = await prisma.instrument.create({
    data: {
      modelName: 'MicroBalance-100',
      instrumentType: 'ELECTRONIC_SCALE',
      serialNumber: 'SN-MB100-2222',
      maxCapacity: 0.1, // 100g
      minCapacity: 0.001, // 1g
      eValue: 0.0001,   // e = 0.1g
      accuracyClass: 'I',
      manufacturerId: manufacturer2.id,
      registeredById: officer2.id,
    },
  });

  const inst3 = await prisma.instrument.create({
    data: {
      modelName: 'HeavyDuty-WB',
      instrumentType: 'WEIGHBRIDGE',
      serialNumber: 'SN-HDWB-3333',
      maxCapacity: 50000, // 50t
      minCapacity: 1000,
      eValue: 10,        // e = 10kg
      accuracyClass: 'III',
      manufacturerId: manufacturer1.id,
      registeredById: officer1.id,
    },
  });

  const inst4 = await prisma.instrument.create({
    data: {
      modelName: 'Basic-Scale-100',
      instrumentType: 'MECHANICAL_SCALE',
      serialNumber: 'SN-BS100-4444',
      maxCapacity: 100, // 100kg
      minCapacity: 10,
      eValue: 1,        // e = 1kg
      accuracyClass: 'IIII',
      manufacturerId: manufacturer2.id,
      registeredById: officer2.id,
    },
  });

  console.log('Instruments created.');
  
  const session1 = await prisma.testSession.create({
    data: {
      instrumentId: inst1.id,
      labOfficerId: officer1.id,
      labTemperature: 24.5,
      labHumidity: 55,
      labAtmosphericPressure: 1013,
      status: 'APPROVED',
      submittedAt: new Date(),
      reviewedById: admin.id,
      reviewedAt: new Date(),
      reviewerSignature: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iNjAiPjxwYXRoIGQ9Ik0xMCw0MCBRMzAsMTAgNTAsNDAgVDkwLDQwIFQxMzAsMzAgVDE3MCw0MCIgc3Ryb2tlPSIjMGYxNzJhIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz48L3N2Zz4=',
      testResults: {
        create: [
          {
            testType: 'WEIGHING_PERFORMANCE',
            rawReadings: JSON.stringify([
              { loadPoint: 10, indicatedValue: 10.04, referenceValue: 10, calculatedError: 0.04, mpe: 0.05, result: 'PASS' },
              { loadPoint: 250, indicatedValue: 250.02, referenceValue: 250, calculatedError: 0.02, mpe: 0.05, result: 'PASS' },
              { loadPoint: 500, indicatedValue: 500.03, referenceValue: 500, calculatedError: 0.03, mpe: 0.05, result: 'PASS' }
            ]),
            calculatedError: 0.04,
            permissibleError: 0.15,
            result: 'PASS',
          }
        ]
      }
    }
  });

  const session2 = await prisma.testSession.create({
    data: {
      instrumentId: inst2.id,
      labOfficerId: officer2.id,
      labTemperature: 22.0,
      labHumidity: 60,
      status: 'REJECTED',
      submittedAt: new Date(),
      reviewedById: admin.id,
      reviewedAt: new Date(),
      reviewerSignature: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iNjAiPjxwYXRoIGQ9Ik0xMCw0MCBRMzAsMTAgNTAsNDAgVDkwLDQwIFQxMzAsMzAgVDE3MCw0MCIgc3Ryb2tlPSIjMGYxNzJhIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz48L3N2Zz4=',
      reviewNotes: 'Failed repeatability at max capacity.',
      testResults: {
        create: [
          {
            testType: 'REPEATABILITY',
            rawReadings: JSON.stringify([
              { loadPoint: 0.1, indicatedValue: 0.1, referenceValue: 0.1 },
              { loadPoint: 0.1, indicatedValue: 0.1005, referenceValue: 0.1 },
              { loadPoint: 0.1, indicatedValue: 0.0995, referenceValue: 0.1 }
            ]),
            calculatedError: 0.001,
            permissibleError: 0.0001,
            result: 'FAIL',
            notes: 'Spread exceeds MPE'
          }
        ]
      },
    }
  });

  const session3 = await prisma.testSession.create({
    data: {
      instrumentId: inst3.id,
      labOfficerId: officer1.id,
      status: 'SUBMITTED',
      submittedAt: new Date(),
      testResults: {
        create: [
          {
            testType: 'ZERO_SETTING',
            rawReadings: JSON.stringify([
              { loadPoint: 0, indicatedValue: 0, referenceValue: 0 },
            ]),
            calculatedError: 0,
            permissibleError: 5,
            result: 'PASS',
          },
          {
            testType: 'ZERO_TRACKING',
            rawReadings: JSON.stringify([
              { loadPoint: 0, indicatedValue: 0, referenceValue: 0 },
            ]),
            calculatedError: 0,
            permissibleError: 5,
            result: 'PASS',
          },
          {
            testType: 'VISUAL_INSPECTION',
            rawReadings: JSON.stringify([
              { loadPoint: 'Level Indicator', indicatedValue: 0, referenceValue: 0 },
              { loadPoint: 'Zero-setting Device', indicatedValue: 0, referenceValue: 0 },
              { loadPoint: 'Display Segments', indicatedValue: 0, referenceValue: 0 },
              { loadPoint: 'Descriptive Markings', indicatedValue: 0, referenceValue: 0 }
            ]),
            calculatedError: 0,
            permissibleError: 0,
            result: 'PASS',
          }
        ]
      }
    }
  });

  const session4 = await prisma.testSession.create({
    data: {
      instrumentId: inst4.id,
      labOfficerId: officer2.id,
      status: 'SUBMITTED',
      submittedAt: new Date(),
      testResults: {
        create: [
          {
            testType: 'WEIGHING_PERFORMANCE',
            result: 'PASS',
            calculatedError: 0,
            permissibleError: 1,
            rawReadings: JSON.stringify([
              { loadPoint: 5, indicatedValue: 5, referenceValue: 5 },
              { loadPoint: 10, indicatedValue: 10, referenceValue: 10 },
              { loadPoint: 20, indicatedValue: 20, referenceValue: 20 }
            ])
          }
        ]
      }
    }
  });

  const session5 = await prisma.testSession.create({
    data: {
      instrumentId: inst1.id,
      labOfficerId: officer1.id,
      status: 'SUBMITTED',
      submittedAt: new Date(),
      testResults: {
        create: [
          {
            testType: 'REPEATABILITY',
            result: 'FAIL',
            calculatedError: 0.5,
            permissibleError: 0.15,
            rawReadings: JSON.stringify([
              { loadPoint: 250, indicatedValue: 250, referenceValue: 250 },
              { loadPoint: 250, indicatedValue: 250.2, referenceValue: 250 },
              { loadPoint: 250, indicatedValue: 250.5, referenceValue: 250 }
            ])
          }
        ]
      }
    }
  });

  const session6 = await prisma.testSession.create({
    data: {
      instrumentId: inst2.id,
      labOfficerId: officer2.id,
      status: 'SUBMITTED',
      submittedAt: new Date(),
      testResults: {
        create: [
          {
            testType: 'WEIGHING_PERFORMANCE',
            result: 'PASS',
            calculatedError: 0,
            permissibleError: 0,
            rawReadings: JSON.stringify([
              { loadPoint: 1, indicatedValue: 1, referenceValue: 1 },
              { loadPoint: 5, indicatedValue: 5, referenceValue: 5 }
            ])
          }
        ]
      }
    }
  });

  const session7 = await prisma.testSession.create({
    data: {
      instrumentId: inst3.id,
      labOfficerId: officer1.id,
      labTemperature: 28.0,
      labHumidity: 45,
      labAtmosphericPressure: 1010,
      status: 'APPROVED',
      submittedAt: new Date(),
      reviewedById: admin.id,
      reviewedAt: new Date(),
      reviewerSignature: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iNjAiPjxwYXRoIGQ9Ik0xMCw0MCBRMzAsMTAgNTAsNDAgVDkwLDQwIFQxMzAsMzAgVDE3MCw0MCIgc3Ryb2tlPSIjMGYxNzJhIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz48L3N2Zz4=',
      testResults: {
        create: [
          {
            testType: 'WEIGHING_PERFORMANCE',
            result: 'PASS',
            calculatedError: 0,
            permissibleError: 10,
            rawReadings: JSON.stringify([
              { loadPoint: 1000, indicatedValue: 1000, referenceValue: 1000, calculatedError: 0, mpe: 5, result: 'PASS' },
              { loadPoint: 25000, indicatedValue: 25000, referenceValue: 25000, calculatedError: 0, mpe: 10, result: 'PASS' },
              { loadPoint: 50000, indicatedValue: 50000, referenceValue: 50000, calculatedError: 0, mpe: 15, result: 'PASS' }
            ])
          }
        ]
      }
    }
  });

  const session8 = await prisma.testSession.create({
    data: {
      instrumentId: inst4.id,
      labOfficerId: officer2.id,
      status: 'REJECTED',
      submittedAt: new Date(),
      reviewedById: admin.id,
      reviewedAt: new Date(),
      reviewerSignature: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iNjAiPjxwYXRoIGQ9Ik0xMCw0MCBRMzAsMTAgNTAsNDAgVDkwLDQwIFQxMzAsMzAgVDE3MCw0MCIgc3Ryb2tlPSIjMGYxNzJhIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz48L3N2Zz4=',
      reviewNotes: 'Values fluctuate widely at high loads.',
      testResults: {
        create: [
          {
            testType: 'WEIGHING_PERFORMANCE',
            result: 'FAIL',
            calculatedError: 3,
            permissibleError: 1,
            rawReadings: JSON.stringify([
              { loadPoint: 10, indicatedValue: 10, referenceValue: 10 },
              { loadPoint: 50, indicatedValue: 51, referenceValue: 50 },
              { loadPoint: 100, indicatedValue: 103, referenceValue: 100 }
            ])
          }
        ]
      }
    }
  });

  console.log('Test sessions created. Generating reports...');
  
  await generateReports(session1.id);
  await generateReports(session2.id);
  await generateReports(session7.id);
  await generateReports(session8.id);

  console.log('Reports generated successfully.');
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
