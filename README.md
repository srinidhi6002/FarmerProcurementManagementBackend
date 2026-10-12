# 🌾 AgriProcure - Backend REST API

Node.js Express REST API backend for the **Smart Farmer Procurement & Mandi Management System**, backed by **Neon Cloud PostgreSQL**.

---

## 🚀 Live Production Links
- **Render Backend Web Service**: [https://farmerprocurementmanagement.onrender.com](https://farmerprocurementmanagement.onrender.com)
- **API Health & Database Check**: [https://farmerprocurementmanagement.onrender.com/api/health](https://farmerprocurementmanagement.onrender.com/api/health)
- **Vercel Frontend**: [https://farmer-procurement-management.vercel.app](https://farmer-procurement-management.vercel.app)

---

## 📁 Repository Structure
```
backend/
├── index.js          # Express Server Setup, CORS, Global Route Loader
├── package.json      # Dependencies (express, pg, cors, dotenv)
├── db.js             # Neon Cloud PostgreSQL Connection Pool (SSL Enabled)
├── Dockerfile        # Container Configuration for Cloud Deployment
├── render.yaml       # Render Blueprint Specification
├── .env.example      # Environment Configuration Template
├── .gitignore        # Git Ignored Files
├── routes/
│   ├── admin.js      # Executive Stats & Crop MSP Management
│   ├── auth.js       # User & Farmer Authentication
│   ├── centers.js    # Mandi Centers & Slot Booking Engine
│   ├── farmers.js    # Strict Validation & Farmer Registration
│   ├── health.js     # Health Check & Database Live Ping
│   ├── payouts.js    # DBT Payment Calculation & Disbursement
│   ├── queue.js      # Live Token & Intake Queue Management
│   └── verification.js # Weighbridge & Quality Inspection Engine
└── database/
    ├── schema.sql    # Complete PostgreSQL DDL (Tables, Indexes)
    └── seed.sql      # Seed Data (Centers, Rates, Sample Farmers)
```

---

## 🛡️ Input Validation & Business Rules
- **Farmer Profile (`POST /api/farmers`)**:
  - Name: Minimum 3 alphabetical characters.
  - Phone: Exactly 10 digits starting with 6, 7, 8, or 9 (`/^[6-9]\d{9}$/`). Prevents duplicate phone numbers.
  - Aadhaar: Exactly 12 digits, cannot start with 0 or 1 (`/^[2-9]\d{11}$/`). Prevents duplicate Aadhaar numbers.
  - Land Holding: Positive numeric between 0.1 and 500 acres.
  - Bank Account: 9 to 18 digits.
  - IFSC Code: Standard RBI format (`/^[A-Z]{4}0[A-Z0-9]{6}$/`).
- **Slot Booking (`POST /api/centers/book-slot`)**:
  - Validates farmer ID, mandi center ID, crop selection, and positive quantity (0.1–10,000 Qtl).
  - Slot capacity validation to prevent overbooking.
- **Weighbridge & Quality Verification (`POST /api/verification/inspect`)**:
  - Net weight computed as `Gross Weight - Tare Weight`.
  - Rejects if `Gross <= Tare` (returns `400 Bad Request`).
  - Moisture range: 0% to 50%; Impurity range: 0% to 30%.
  - Automatic quality grading: Grade A (Full MSP), Grade B (MSP - ₹50 deduction), Rejected (Over max moisture).

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status and Neon PostgreSQL connection check |
| `GET` | `/api/admin/dashboard-stats` | Aggregated executive metrics (Volumes, DBT Payouts) |
| `GET` | `/api/admin/msp` | List current government MSP rates |
| `GET` | `/api/farmers` | List registered farmers |
| `POST` | `/api/farmers` | Register a new farmer with full validation |
| `GET` | `/api/centers` | List all active procurement mandi centers |
| `POST` | `/api/centers/book-slot` | Book a procurement slot and generate token |
| `GET` | `/api/queue` | Live intake queue status |
| `POST` | `/api/verification/inspect` | Record weighbridge & moisture inspection |
| `GET` | `/api/payouts` | List all DBT payout records |
| `PUT` | `/api/payouts/:id/disburse` | Disburse DBT payment to farmer bank account |

---

## 🛠️ Local Setup
1. Clone the repository and navigate into the `backend` folder:
   ```bash
   npm install
   ```
2. Create a `.env` file from `.env.example`:
   ```bash
   PORT=5000
   DATABASE_URL=postgresql://<user>:<password>@<neon-host>/neondb?sslmode=require
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Access `http://localhost:5000/api/health` in your browser.

---

## 🚀 How to Push to GitHub & Deploy to Render

### Step 1: Create GitHub Repository
1. Go to [GitHub.com/new](https://github.com/new).
2. Name the repository: `FarmerProcurement-Backend`.
3. Choose **Public** and do NOT check "Add a README file".
4. Click **Create repository**.

### Step 2: Push `backend/` Folder to GitHub
Open your terminal in the `backend` folder:
```bash
git init
git add .
git commit -m "feat: complete backend api with express and neon postgresql"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/FarmerProcurement-Backend.git
git push -u origin main --force
```

### Step 3: Link to Render
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your `FarmerProcurement-Backend` GitHub repository.
4. Settings:
   - **Name**: `farmerprocurementmanagement` (or your preferred service name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. Under **Environment Variables**:
   - `PORT`: `5000`
   - `DATABASE_URL`: Paste your Neon connection string (`postgresql://username:password@ep-...neon.tech/neondb?sslmode=require`)
6. Click **Deploy Web Service**.
7. Once deployed, test your live endpoint at `https://<your-service>.onrender.com/api/health`.
