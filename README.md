# NAWI Metrology Portal

A portal for the Legal Metrology Department to digitize the verification and certification of Non-Automatic Weighing Instruments (NAWI) based on OIML R-76 standards.

**Reference:** SIH26035 problem statement.

## Tech Stack
- Frontend: React (Vite), Tailwind CSS v4, TypeScript
- Backend: Node.js, Express, Prisma, SQLite
- Report Generation: Puppeteer (PDF)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Database Setup**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

3. **Run Development Servers**
   In terminal 1:
   ```bash
   cd backend
   npm run dev
   ```

   In terminal 2:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Default Logins (from seed)**
   - Admin/Supervisor: `admin@metrology.gov.in` / `password123`
   - Lab Officer: `officer@metrology.gov.in` / `password123`
   - Manufacturer: `mfg@scale-tech.com` / `password123`
