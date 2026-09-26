# NAWI Metrology Portal (SIH26035) - Project Overview

## What this project is
The NAWI Metrology Portal is our solution for Smart India Hackathon (SIH) problem statement 26035. Currently, Legal Metrology labs process the verification of Non-Automatic Weighing Instruments (NAWI) manually using paper forms or slow Excel templates. This leads to heavy administrative delays, transcription errors, and makes historical data hard to track. Our portal digitizes this entire workflow. It enforces the complex Maximum Permissible Error (MPE) calculations of the OIML R-76 standard in real-time, completely eliminating operator guesswork, and automates the generation of compliant PDF/Word certificates.

## Tech Stack
* **Frontend:** React (TypeScript) + Vite + Tailwind CSS. Chosen for rapid UI development, strict type safety, and a highly responsive, modern user experience.
* **Backend:** Node.js + Express (TypeScript). Chosen for seamless full-stack TypeScript integration and fast, unopinionated routing.
* **Database / ORM:** Prisma + SQLite. Prisma provides a bulletproof type-safe database client. SQLite is used currently for frictionless local development and hackathon prototyping without requiring external database hosting.
* **Key Libraries:** 
  * `puppeteer`: Headless Chrome for pixel-perfect HTML-to-PDF report generation.
  * `docx`: Programmatic Word document generation without needing MS Office APIs.
  * `jsonwebtoken` / `bcrypt`: For secure, stateless role-based authentication.

## How to Set It Up Locally
1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd Nawi-Metrology-Portal
   ```
2. **Setup the Backend:**
   ```bash
   cd backend
   npm install
   # Create a .env file based on .env.example (or just create it with JWT_SECRET=your_secret_key)
   npx prisma db push
   npx prisma db seed
   npm run dev
   ```
   *The backend will run on port 3001.*
3. **Setup the Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   *The frontend will run on port 5173.*

## How to Use the App (Role by Role)

**1. Lab Officer (e.g., Rajesh)**
* **Role:** The person on the ground performing physical calibrations.
* **Flow:** Logs in, goes to **Instruments** to register a new scale (or selects an existing one), and clicks **Start Test**. They enter ambient Lab Conditions, select the test types (e.g., Repeatability, Eccentricity), and input the raw reference vs. indicated values. The system automatically calculates errors and applies PASS/FAIL badges live based on the OIML R-76 MPE formulas. Once finished, they click **Submit Test Session**.

**2. Admin / Supervisor (e.g., Sneha)**
* **Role:** The lab manager responsible for reviewing data and signing off on official certificates.
* **Flow:** Logs in and checks the **Test Sessions** dashboard for sessions marked `SUBMITTED`. They review the raw data and calculations, scroll to the bottom, physically draw their signature on the HTML canvas, and click **Approve Session**. The system then automatically generates the PDF and Word reports.

**3. Manufacturer (e.g., Amit)**
* **Role:** A vendor who manufactures instruments and needs to access their verification certificates.
* **Flow:** Logs in with heavily restricted access. They can view the **Instruments** they have registered and check the **Report Repository** to download PDFs of passed instruments. They cannot see data belonging to other manufacturers or conduct tests themselves.

## Demo / Test Credentials
The database seed script provides these credentials out-of-the-box (All passwords are `password123`):
* **Admin:** `admin@metrology.gov.in` (Sneha Patel)
* **Officer:** `rajesh.officer@metrology.gov.in` (Rajesh Kumar)
* **Manufacturer:** `contact@acmescales.in` (Acme Scales India)
* *(Note: The login page includes a "Quick Login" dropdown for fast dev testing)*

## Current Project Status
**Fully Built & Working:**
* Role-based Authentication (JWT) and routing logic.
* Dynamic OIML R-76 MPE Calculator (handling Accuracy Classes I, II, III, IIII).
* All 6 core test types: Repeatability, Eccentricity, Weighing Performance, Tare, Zero Setting/Tracking, and Visual Inspection.
* HTML Canvas Signature Capture.
* Automated Report Generation (PDF via Puppeteer, DOCX via `docx` library).
* Report Repository with dynamic filtering and role-based visibility.

**Not Built / Placeholders:**
* **Settings:** The Settings page is currently a stub placeholder.
* **Analytics Dashboard:** The homepage dashboard shows static visual charts (mock data) rather than live aggregations.

**Known Limitations:**
* **SQLite Database:** Used for rapid local development. For production, the Prisma schema provider should be switched to PostgreSQL.
* **In-Memory File Storage:** PDFs and DOCX files are currently stored locally on the server filesystem (`/uploads`). In a cloud production environment, this should be wired to AWS S3 or GCP Cloud Storage.

## Architecture Notes
* **/frontend:** A standard Vite React SPA. Key routing happens in `App.tsx`. State management relies heavily on React Context (`AuthContext.tsx`). The dynamic test components live in `src/components/tests/`.
* **/backend:** An Express server. The core mathematical brain is isolated in `src/utils/oiml-calculator.ts`. The report engines are cleanly separated in `pdfGenerator.ts` and `docxGenerator.ts`. Prisma handles all data modeling centrally in `prisma/schema.prisma`.
