import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

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
      testResults: {
        create: [
          {
            testType: 'WEIGHING_PERFORMANCE',
            rawReadings: JSON.stringify([
              { loadPoint: 10, indicatedValue: 10.05, referenceValue: 10 },
              { loadPoint: 250, indicatedValue: 250.05, referenceValue: 250 },
              { loadPoint: 500, indicatedValue: 500.1, referenceValue: 500 }
            ]),
            calculatedError: 0.1,
            permissibleError: 0.15,
            result: 'PASS',
          }
        ]
      },
      report: {
        create: {
          reportNumber: `NAWI/CML-DEL-001/${new Date().getFullYear()}/001`,
          pdfUrl: '/uploads/dummy_report_1.pdf',
        }
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

  console.log('Test sessions created.');
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
