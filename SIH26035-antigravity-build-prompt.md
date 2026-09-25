# BUILD PROMPT FOR GOOGLE ANTIGRAVITY (GEMINI)
## Project: NAWI Test Report Generation System — SIH26035
### Ministry of Consumer Affairs, Food & Public Distribution — Legal Metrology (OIML R-76)

---

## ⚠️ SCOPE NOTE (read before building — for the team, not the AI)

The official Problem Statement asks for **all OIML R-76 tests** and **all 4 accuracy classes** with full role-based access, digital repository, and dual-format export. This is genuinely a large system. To finish in 4-5 days without a broken/incomplete demo, this prompt is structured in **two phases**:

- **Phase 1 (Days 1-3): Core, must-work.** 4 key tests, all 4 accuracy classes (the math is simple once done right — it's the same formula, just different divisors), 3 roles, PDF export, dashboard, e-signature, file upload.
- **Phase 2 (Days 4-5): Full PS coverage.** Remaining OIML tests, Word export, polish, auto-seed data, edge-case validation.

Tell Antigravity to build Phase 1 completely and working end-to-end **before** touching Phase 2. A fully working 4-test system beats a half-broken 9-test system in a live demo.

---

## 1. PROJECT CONTEXT (give this to the AI as background)

You are building a web application for **Legal Metrology test laboratories** in India. These labs test **Non-Automatic Weighing Instruments (NAWIs)** — electronic weighing scales, platform scales, weighbridges — before the government approves their model for commercial sale, as required under the **Legal Metrology Act, 2009**.

Testing follows the international standard **OIML R-76**. Currently, lab officers record test readings on paper/Excel and manually type up reports — slow, error-prone, inconsistent. Your job: replace that with a system where an officer enters raw readings, the system automatically calculates permissible error and pass/fail per OIML R-76 rules, and generates a standardized, exportable, professional test report.

**This is NOT a machine learning problem.** There is no prediction, no training data, no model. Every decision in this system is **deterministic rule-based math**: compare a measured value against a formula-derived tolerance, output PASS or FAIL. Do not add any ML/AI inference anywhere in this build — it is 100% CRUD + calculation logic + document generation.

---

## 2. TECH STACK

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript (fastest to build AND secure when done with proper middleware — avoids the type-mismatch bugs Python/Django can introduce under time pressure, and keeps one language across the stack for a solo builder)
- **Database:** PostgreSQL (relational integrity matters here — instruments, tests, and reports are tightly linked; use Prisma ORM for schema safety and fast iteration)
- **Auth:** JWT (access + refresh token pattern), bcrypt for password hashing
- **PDF generation:** `pdf-lib` or `Puppeteer` (renders an HTML report template to PDF — gives you full control over formatting)
- **Word (.docx) generation:** `docx` npm package (build the report as a structured Word document programmatically)
- **File uploads:** `multer` middleware, stored on local disk under `/uploads` (for demo; mention S3/cloud as a "production would use" note in your report, don't actually integrate it — no time)
- **E-signature:** `react-signature-canvas` on frontend (draw signature, save as PNG/base64), stored as an image linked to the report
- **Charts (dashboard):** `recharts`
- **Hosting for demo:** Frontend on Vercel, backend + DB on Render/Railway

---

## 3. DESIGN SYSTEM — MUST NOT LOOK AI-GENERATED

This is a **government legal-metrology system**. It must look like something an actual ministry would deploy — authoritative, precise, calm — not a generic SaaS dashboard template and NOT a dark hacker-style theme.

### Visual identity: "Calibrated Clarity"
A clean, light, instrument-precision aesthetic — think measurement/precision engineering, not flashy tech.

**Color palette (light theme, professional, distinct from generic blue SaaS):**
- Background: `#F7F8F6` (soft warm off-white, not stark white)
- Surface/cards: `#FFFFFF` with `1px solid #E4E7E2` border, subtle shadow
- Primary accent: `#1F5F5B` (deep teal — evokes precision instruments/metrology, not the default SaaS blue)
- Secondary accent: `#B8860B` (muted brass/gold — nods to calibration weights and official seals; use sparingly for highlights, badges, "Certified" markers)
- Success/PASS: `#2E7D4F` (muted forest green)
- Fail/error: `#B3402A` (muted brick red, not harsh pure red)
- Text primary: `#1C1F1E`
- Text secondary: `#5B615E`
- Borders/dividers: `#E4E7E2`

**Typography:**
- Headings: `"Fraunces"` or `"Source Serif 4"` (a serif for headings gives it an official/document-like authority — avoids the generic "Inter everywhere" AI-generated look)
- Body/UI text: `"Inter"` or `"IBM Plex Sans"` — highly readable at small sizes, used in real govt/technical UIs
- Monospace (for instrument IDs, report numbers, readings): `"IBM Plex Mono"`
- Base font size: 15px body, never below 13px anywhere. Headings scale: 32/24/20/16px.

**Layout principles:**
- Generous whitespace, not cramped
- Left sidebar navigation (role-based menu items), not a hamburger — this is a desk-use tool
- Tables for test data (not cards) — this is data-entry software, tables are correct here, don't over-"cardify" everything
- Subtle 1-2px borders instead of heavy shadows/gradients
- No glassmorphism, no gradient buttons, no emoji icons — use a proper icon set (`lucide-react`) at small, consistent sizes
- Buttons: solid teal primary, outlined secondary, no rounded-pill shapes — use 6-8px border radius (precise, not playful)
- Status badges (PASS/FAIL/PENDING) as small solid-color pills with the muted palette above

**What to explicitly avoid:** purple gradients, dark mode as default, oversized rounded cards, stock "dashboard template" hero sections, generic Font Awesome icon clutter, centered marketing-style landing page — this is an internal tool, not a product website. The login screen can have one clean government-style header bar (ministry name + a simple weighing-scale icon/logo mark, not a photo).

---

## 4. AUTHENTICATION & ROLES

### Roles (3, with a strict permission matrix)

| Action | Lab Officer | Lab Supervisor/Admin | Manufacturer |
|---|---|---|---|
| Register new instrument | ✅ | ✅ | ❌ |
| Enter test readings | ✅ | ✅ | ❌ |
| Submit report for review | ✅ | ✅ | ❌ |
| Approve/reject report | ❌ | ✅ | ❌ |
| Apply digital signature | ❌ (officer signs as tester) ✅ signs as "Tested by" | ✅ signs as "Approved by" | ❌ |
| Manage users (create/deactivate) | ❌ | ✅ | ❌ |
| View own manufacturer's reports only | ❌ | ❌ | ✅ (read-only) |
| View all reports/dashboard | ✅ (own lab) | ✅ (full) | ❌ |
| Download PDF/Word | ✅ | ✅ | ✅ (own reports only) |

### Signup flow
Build **one signup page with a role selector** at the top (radio/tab: "Lab Officer" / "Lab Supervisor" / "Manufacturer"), which reveals slightly different fields:

**Common fields:** Full Name, Email, Password, Confirm Password, Phone Number

**If Lab Officer/Supervisor:** Lab Name, Lab Registration ID, Designation, Employee Code

**If Manufacturer:** Company Name, Manufacturer License Number, Registered Address

- Simple email + password auth (no OTP — out of scope for 5 days)
- New Lab Officer/Manufacturer signups should go to `status: pending` until a Lab Supervisor approves them from an admin panel (realistic, and gives Admin role a genuine "review" screen to demo — do this only if time allows in Phase 1; otherwise auto-activate for demo simplicity and note it as a Phase 2 item)
- Login page: email + password, clean centered card, ministry header bar above it, "Forgot password" can be a non-functional link for the demo
- Passwords hashed with bcrypt, JWT stored in httpOnly cookie (more secure than localStorage — protects against XSS token theft)

---

## 5. DATABASE SCHEMA (core tables)

```
users
  id, name, email, password_hash, role (enum: officer/admin/manufacturer),
  lab_name, lab_reg_id, designation, employee_code,
  company_name, manufacturer_license_no,
  status (pending/active/deactivated), created_at

instruments
  id, model_name, manufacturer_id (fk->users), manufacturer_name,
  instrument_type (enum: electronic_scale/platform_scale/weighbridge),
  serial_number, max_capacity, min_capacity,
  verification_scale_interval_e (numeric — THIS IS CRITICAL, see section 6),
  accuracy_class (enum: I/II/III/IIII),
  registered_by (fk->users), created_at

test_sessions
  id, instrument_id (fk), lab_officer_id (fk),
  lab_conditions (temperature, humidity, atmospheric_pressure — text/numeric fields),
  status (enum: draft/submitted/under_review/approved/rejected),
  created_at, submitted_at, reviewed_by (fk->users, nullable), reviewed_at

test_results
  id, test_session_id (fk), test_type (enum — see section 6 list),
  raw_readings (JSON — array of {load_point, indicated_value, reference_value}),
  calculated_error (numeric), permissible_error (numeric),
  result (enum: pass/fail), notes (text)

reports
  id, test_session_id (fk), report_number (auto-generated, unique),
  pdf_url, docx_url, tested_by_signature_url, approved_by_signature_url,
  generated_at

attachments
  id, test_session_id (fk), file_url, file_type, uploaded_by (fk), uploaded_at

activity_log
  id, user_id (fk), action, target_id, timestamp
```

Generate `report_number` as: `NAWI/{lab_reg_id}/{YEAR}/{sequential_number}` — this is exactly the kind of realistic detail that makes it look like a real government system, not a generic CRUD demo.

---

## 6. THE OIML R-76 TEST LOGIC — THIS IS THE CORE OF THE PROJECT, GET IT RIGHT

### 6.1 The verification scale interval "e"
Every instrument has a value called **e** (the verification scale interval — essentially the smallest meaningful increment the scale is legally allowed to measure in, e.g. e = 5g or e = 10g). This is entered at instrument registration. **Every permissible error calculation is expressed as a multiple of e**, not an absolute gram value — this is the single most important detail. Do not hardcode gram values; always calculate relative to the instrument's own `e`.

### 6.2 Maximum Permissible Error (MPE) table — implement exactly this

For a load `m`, expressed as a number of scale intervals (`m/e`), the Maximum Permissible Error **at initial verification / type testing** is:

| Accuracy Class | Load range (in units of e) | MPE |
|---|---|---|
| Class I | 0 < m ≤ 50,000e | ± 0.5e |
| Class I | 50,000e < m ≤ 200,000e | ± 1.0e |
| Class I | m > 200,000e | ± 1.5e |
| Class II | 0 < m ≤ 5,000e | ± 0.5e |
| Class II | 5,000e < m ≤ 20,000e | ± 1.0e |
| Class II | m > 20,000e | ± 1.5e |
| Class III | 0 < m ≤ 500e | ± 0.5e |
| Class III | 500e < m ≤ 2,000e | ± 1.0e |
| Class III | m > 2,000e | ± 1.5e |
| Class IIII | 0 < m ≤ 50e | ± 0.5e |
| Class IIII | 50e < m ≤ 200e | ± 1.0e |
| Class IIII | m > 200e | ± 1.5e |

**For in-service/re-verification testing (if you add this as a mode), double every MPE value above (i.e. 2x).** Build a config toggle "Test Type: Type Evaluation / Initial Verification" — default to Type Evaluation for the demo, since that matches the PS's "model approval" context.

Implement this as a pure function:
```
calculatePermissibleError(accuracyClass, verificationInterval_e, loadValue_m) → returns ± error in grams
```
Then: `PASS` if `abs(indicated_value - reference_value) <= calculated_permissible_error`, else `FAIL`.

### 6.3 Test types — Phase 1 (build these 4 first, fully working)

1. **Repeatability Test** — same load applied ≥3 times at 3 different load points (e.g. min, mid, max capacity). System calculates the spread between repeated readings at each point; PASS if spread ≤ MPE at that load.
2. **Eccentricity Test** — a load placed at 5 positions on the platform (center + 4 corners, per R-76's standard diagram — show a simple diagram/illustration on the entry form). PASS if each position's error ≤ MPE.
3. **Weighing Performance / Accuracy Test** — reference weights applied across the full range (e.g. 10%, 50%, 100% of capacity); compare indicated vs reference at each point against MPE.
4. **Zero Setting Test** — check the scale returns to true zero after loading and unloading; PASS if deviation from zero ≤ MPE at zero.

### 6.4 Test types — Phase 2 (add if time allows)

5. Zero Tracking, 6. Discrimination Test, 7. Accuracy of Tare Setting, 8. Price-Computation accuracy, 9. Visual Inspection (this one is just a checklist form, not a calculation — easy to add, do it if you're ahead of schedule).

### 6.5 Overall report verdict
A test_session's final report is **PASS only if every individual test_result is PASS**. One failed test = instrument fails type approval. Show this clearly on the report ("Overall Result: PASS/FAIL") with the specific failing test(s) listed if it fails.

---

## 7. CORE SCREENS/MODULES TO BUILD

1. **Login / Signup** (role-based, as in section 4)
2. **Admin: User Approval Panel** — list pending signups, approve/reject
3. **Instrument Registration Form** — model name, manufacturer, type, serial no., max/min capacity, `e` value, accuracy class dropdown (I/II/III/IIII)
4. **New Test Session** — select instrument → enter lab conditions (temp/humidity/pressure) → choose which tests to run (checklist) → proceed to data entry
5. **Test Data Entry** — one tab/step per selected test type, with a clean readings table (load point | reference value | indicated value | calculated error | MPE | result), auto-calculating live as officer types. Validation: reject non-numeric input, reject readings outside the instrument's max capacity.
6. **File Attachment** — drag-and-drop upload for instrument photos / supporting docs on the test session
7. **Review & Submit** (Officer) → moves session to `submitted`
8. **Supervisor Review Screen** — view all test data read-only, see overall PASS/FAIL, apply e-signature, Approve or Reject with a comment field
9. **Report Generation** — on approval, auto-generate the PDF + Word report (template: ministry header, instrument details, lab conditions, each test's table of readings, overall verdict, tested-by + approved-by signature images, report number, QR code linking to a verification page is a nice optional touch if time allows)
10. **Report Repository** — searchable/filterable table (by instrument, manufacturer, date, status, accuracy class), download PDF/Word buttons
11. **Dashboard** (role-specific):
    - Officer: my draft/submitted sessions, quick stats
    - Admin: lab-wide stats (tests this month, pass rate, pending approvals, pending user approvals), simple bar/pie chart via recharts
    - Manufacturer: their own instruments' report statuses only
12. **Activity Log** (Admin only) — simple table of who did what, when

---

## 8. E-SIGNATURE IMPLEMENTATION

Use `react-signature-canvas`. On the Supervisor Review screen, provide a signature pad component. On "Approve," capture the canvas as a base64 PNG, upload it, and embed it in the generated PDF/Word report at the "Approved by" line, alongside the supervisor's name, designation, and approval timestamp. Do the same for the Lab Officer's "Tested by" signature (captured once at submission, or reused from a saved signature on their profile — simpler: let officer draw it once at submission).

---

## 9. AUTO-SEED DEMO DATA

Write a seed script that runs once on setup and creates:
- 1 Admin/Supervisor account, 2 Lab Officer accounts, 2 Manufacturer accounts (fixed demo credentials, print them in a `DEMO_CREDENTIALS.md` file)
- 3 sample instruments across different accuracy classes (e.g. one Class II platform scale, one Class III electronic scale, one Class I precision balance)
- 2 fully completed test sessions with realistic readings (one PASS, one FAIL — so the demo can show both outcomes) with generated reports
- 1 test session sitting in `submitted` status, awaiting Supervisor review — so you can demo the approval flow live
- 1 pending user signup awaiting Admin approval — so you can demo that flow live too

This means the moment the app loads, the dashboard is populated and every flow (review, approval, report download) can be demoed without typing data live, while the "new test session" flow can still be demoed live to show data entry working.

---

## 10. SECURITY REQUIREMENTS

- Passwords: bcrypt, min 8 chars enforced on frontend + backend
- JWT in httpOnly, secure cookies (not localStorage)
- Role-based middleware on every backend route — never trust frontend role checks alone
- Manufacturer accounts can only query reports where `instrument.manufacturer_id == their user id` — enforce at the database query level, not just UI hiding
- File upload: restrict to image/PDF mime types, max 5MB, sanitize filenames
- Rate-limit login endpoint (basic `express-rate-limit`) to show you thought about brute-force protection

---

## 11. NON-NEGOTIABLE BUILD RULES FOR ANTIGRAVITY

1. Do not use any ML/AI library or inference call anywhere — this is rule-based logic only.
2. Do not use a dark theme anywhere by default.
3. Do not use generic AI-template patterns: no purple gradient hero sections, no oversized emoji icons, no "Lorem ipsum"-feeling placeholder copy — use real, specific labels (e.g. "Verification Scale Interval (e)" not "Value").
4. Keep the folder structure clean: `/frontend`, `/backend`, `/backend/prisma` for schema, no stray unused files.
5. After the core build works, remove any unused components, dead imports, and placeholder demo routes left over from scaffolding.
6. Every number shown to the user (permissible error, calculated error) must be traceable to the formula in Section 6 — never hardcode a demo-only fixed value.
7. Build Phase 1 completely and test the full flow (signup → registration → test entry → submit → review → approve → report download) before starting Phase 2 additions.
8. Confirm before each Phase 2 addition — after Phase 1 is stable, prioritize in this order if time is short: (a) Word export, (b) remaining test types, (c) QR-code verification page, (d) polish/animations.

---

## 12. SUMMARY OF WHAT SUCCESS LOOKS LIKE FOR THE DEMO

A judge should be able to watch you: log in as a Lab Officer → register an instrument → enter readings for the Weighing Performance test and watch PASS/FAIL calculate live → submit → switch to Supervisor login → review, e-sign, approve → download a clean, official-looking PDF report with the ministry's name, the instrument's details, the test table, and both signatures — all in under 3 minutes, with the underlying math clearly tied to the real OIML R-76 standard, not a black box.
