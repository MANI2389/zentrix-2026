# ZENTRIX 2K26 — National Level Technical Symposium Web Platform
**The Kavery Engineering College (Autonomous, NAAC A+ Accredited)**  
**Departments of Computer Science & Engineering, Information Technology & Artificial Intelligence & Data Science**  
*M.Kalipatti(PO), Mecheri, Mettur(Tk), Salem District, Tamil Nadu — PIN 636454*

---

## ⚡ Event Details
- **Date**: Tuesday, 25 September 2026 (9:00 AM – 4:00 PM IST)
- **Venue**: The Kavery Engineering College Campus Auditorium (PIN 636454)
- **Theme**: *“Innovate • Connect • Create”* | **Tagline**: *“Build • Learn • Grow”*
- **Registration Fee**: **₹200 per head** (Includes Food & Refreshments, Kit, Participation Certificate & Cash Prizes)
- **Technical Events (Choose ONE)**: Startup Spark, Project Expo, Bug Hunters, Prompt Master
- **Non-Technical Events (Open for All)**: Cinespark, Meme Creation, Logo Hunting, Video Quiz

---

## 🚀 Tech Stack
- **Frontend**: Plain HTML5, Vanilla CSS3 (Custom Cyber Gold & Dark Space Design System), ES Modules (no frontend framework bloat)
- **Backend**: Python 3 (FastAPI, Pydantic), Vercel Python Serverless Functions (`/api/*.py`)
- **Database**: Supabase PostgreSQL (Server-side service role access only with strict Row Level Security)
- **Client-Side PDF Receipt**: `jsPDF` (generates official print-ready A4 receipt)
- **Client-Side Excel Export**: `SheetJS (xlsx)` (multi-sheet export for filtered registrations and analytics summary)
- **Hosting**: Vercel (static frontend + Python serverless backend)

---

## 📁 Project Structure

```
d:/zentrix/
├── index.html                    # Public Landing Page (Navbar, Hero, Countdown, About, Events, Perks, Footer)
├── register.html                 # Registration Portal (Dynamic Team Members, Live Payment Calc, Payment QR, Screenshot Upload)
├── register-success.html         # Registration Confirmation Screen + PDF Receipt Generator
├── admin-login.html              # Admin Authentication Security Portal
├── admin-dashboard.html          # Administrative Console (Live Metric Cards, Filters, Table, Detail Modal, Excel Export)
├── css/
│   └── style.css                 # Unified Cyber Gold & Space Dark Design System + Responsive Breakpoints
├── js/
│   ├── main.js                   # Mobile drawer navigation and toast alert system
│   ├── countdown.js              # Live real-time countdown timer to 25 Sep 2026, 9:00 AM IST
│   ├── form.js                   # Registration logic, dynamic team rows, live fee math, screenshot preview, validation
│   ├── receipt.js                # jsPDF client-side vector PDF receipt generator
│   └── admin.js                  # Admin auth, dashboard metrics, reactive search & filters, modal, SheetJS Excel export
├── api/
│   ├── _supabase.py              # Supabase Python client singleton (Service Role Key)
│   ├── _auth.py                  # Password hashing (bcrypt) & signed JWT session token creation/verification
│   ├── register.py               # POST /api/register (Validation, unique ZX26-XXXXX ID, Supabase insert)
│   ├── admin_login.py            # POST /api/admin_login (Bcrypt credential verification, JWT issuance)
│   └── admin_registrations.py    # GET /api/admin_registrations (Protected endpoint returning attendee data)
├── assets/
│   ├── college-crest.png         # Official College Emblem
│   ├── naac-badge.png            # NAAC A+ Accreditation Badge
│   ├── payment-qr.png            # UPI Payment QR code (Vasuki Rajkumar / vasukixlnc@okaxis)
│   ├── whatsapp-qr.png           # WhatsApp group QR code
│   ├── whatsapp-group-card.png   # Full WhatsApp group invite card
│   ├── og-image.png              # 1200x630 Open Graph preview banner
│   └── favicon.png               # High-res favicon
├── schema.sql                    # Supabase PostgreSQL DDL (Tables, Indexes, RLS Policies, Default Admin)
├── requirements.txt              # Python serverless dependencies
├── vercel.json                   # Vercel deployment and routing configuration
├── .env                          # Local backend secrets (git-ignored)
├── .env.example                  # Environment template
└── README.md                     # Documentation and deployment manual
```

---

## 🛠️ Step-by-Step Setup & Deployment

### 1. Database Initialization (Supabase)
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor** in your project (`ojntrzslrbsqmrarzqtu`).
3. Copy and paste the contents of [`schema.sql`](file:///d:/zentrix/schema.sql).
4. Click **Run**.
   - This creates `public.registrations` and `public.admins` tables.
   - Sets up high-performance B-tree indexes on `email`, `register_number`, and `event_name`.
   - Enables Row Level Security (RLS) to prevent public client access.
   - Seeds the default administrator account.

---

### 2. Default Administrator Credentials
- **Admin Email**: `admin@thekavery.org`
- **Default Password**: `admin@zentrix2026`
*(You can update this password in the `admins` table or via the API anytime.)*

---

### 3. Local Development

#### A. Static Frontend Testing:
Run the built-in HTTP server:
```bash
python -m http.server 3000 --directory .
```
Visit `http://localhost:3000` in your web browser.

#### B. Full-Stack Local Development with Vercel CLI:
If you have Vercel CLI installed:
```bash
vercel dev
```

---

### 4. Deploying to Vercel

1. Push your repository to **GitHub** (the `.env` file is protected by `.gitignore`).
2. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New Project**.
3. Import your `zentrix` repository.
4. In **Project Settings → Environment Variables**, add:
   - `SUPABASE_URL` = `https://ojntrzslrbsqmrarzqtu.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `<your_supabase_service_role_key>`
   - `JWT_SECRET` = `8WvbeDeFKiV16Qtjs0z0p5WbgRJBPCSCNM0s11T8Nhs`
   - `JWT_ALGORITHM` = `HS256`
   - `JWT_EXPIRATION_HOURS` = `24`
5. Click **Deploy**.
   - Vercel automatically deploys static frontend pages at the root.
   - Vercel runs Python serverless functions in `/api`.

---

## 📋 Production Readiness Checklist
- [x] All 5 pages implemented and responsive (tested at 375px, 768px, 1024px, 1440px).
- [x] No admin controls visible on public views (admin button is discrete in the top-right corner).
- [x] Live countdown timer actively calculating remaining days, hours, minutes, seconds to 25 Sep 2026 9:00 AM IST.
- [x] Dynamic team members UI with instantaneous live calculation (`₹200 × headcount`).
- [x] UPI Payment QR placed above payment verification with quick "Copy UPI ID" button.
- [x] Payment screenshot upload with live thumbnail preview.
- [x] Both Technical (1 mandatory) and Non-Technical events selectable.
- [x] Strict client-side and server-side Pydantic validation.
- [x] Official A4 PDF receipt generation via `jsPDF` (`ZENTRIX2K26_Receipt_<ID>.pdf`).
- [x] Protected admin dashboard with true headcount, revenue, and track counters.
- [x] Client-side multi-sheet Excel export via `SheetJS` (`ZENTRIX2026_Registrations_<Timestamp>.xlsx`).
- [x] Service role key kept server-side; Row Level Security enabled.
