# 🚀 Smart Farmer Procurement System - Deployment Guide
### Neon Cloud Database + Render Express API + Vercel Web Frontend

This comprehensive guide outlines step-by-step instructions to set up, run locally, and deploy the entire **Smart Farmer Procurement & Mandi Management System** for your college project evaluation.

---

## 📋 System Architecture

1. **Database**: Serverless Cloud PostgreSQL hosted on **Neon.tech**
2. **Backend API**: Node.js & Express REST API hosted on **Render.com**
3. **Frontend Application**: Responsive Vanilla HTML5/CSS3/JS Web UI hosted on **Vercel.com**

---

## STEP 1: Neon Cloud PostgreSQL Setup 🐘

1. Visit [neon.tech](https://neon.tech) and sign up / log in with GitHub or Google.
2. Click **Create Project** and name it `farmer-procurement-db`.
3. Under the **SQL Editor** tab in your Neon Dashboard:
   - Copy the contents of [`database/schema.sql`](file:///c:/Users/91984/Desktop/farmer%20procurement%20management/database/schema.sql) and paste it into the editor. Click **Run**.
   - Copy the contents of [`database/seed.sql`](file:///c:/Users/91984/Desktop/farmer%20procurement%20management/database/seed.sql) and paste it into the editor. Click **Run**.
4. Go to **Dashboard / Connection Details**:
   - Select **Pooled connection string**.
   - Copy your PostgreSQL connection URL. It will look like:
     ```text
     postgresql://username:password@ep-sample-host.neon.tech/neondb?sslmode=require
     ```

---

## STEP 2: Render Backend Deployment ⚙️

1. Push your repository to GitHub (or use your existing repository `https://github.com/srinidhi6002/farmer-procurement-management.git`).
2. Log in to [render.com](https://render.com).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. Configure the service settings:
   - **Name**: `agriprocure-backend-api`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Scroll down to **Environment Variables**:
   - Add Key: `DATABASE_URL`
   - Value: *(Paste your Neon connection string from Step 1)*
   - Add Key: `PORT`
   - Value: `5000`
7. Click **Create Web Service**.
8. Once deployment finishes, Render will provide a live public backend URL, e.g.:
   `https://agriprocure-backend-api.onrender.com`
9. Test the health check endpoint in your browser:
   `https://agriprocure-backend-api.onrender.com/api/health`

---

## STEP 3: Vercel Frontend Deployment 🌐

1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`farmer-procurement-management`).
4. Project Configuration:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (leave default)
5. Under **Environment Variables**:
   - Add Key: `ENV_API_URL`
   - Value: `https://agriprocure-backend-api.onrender.com/api` *(Your Render backend URL from Step 2)*
6. Click **Deploy**.
7. Vercel will build and deploy your live web application (e.g. `https://farmer-procurement-management.vercel.app`).

---

## STEP 4: How to Run Locally 💻

### 1. Run the Backend Express API Locally:
```bash
cd server
npm install
# Create a .env file inside server/ directory with:
# DATABASE_URL=postgresql://username:password@ep-sample-host.neon.tech/neondb?sslmode=require
# PORT=5000
npm run dev
```
The Express server will start on `http://localhost:5000`.

### 2. Run the Frontend:
Simply double-click `index.html` or open it with Live Server in VS Code. `js/api.js` will automatically detect `http://localhost:5000/api` and connect!

---

## 🧪 Testing & Presentation Walkthrough for College Viva

1. **Farmer Onboarding**:
   - Go to **Farmer Profiles** tab -> Click **+ Register New Farmer**.
   - Input name, Aadhaar, village, land holding, and bank details.
   - Click **Save Farmer to Neon DB**. The record is saved directly to your serverless PostgreSQL cloud database!

2. **Slot Booking**:
   - Click **📅 Book Mandi Slot** -> Select Farmer & Mandi Center.
   - Enter Crop Variety (e.g. Paddy Common) & Estimated Quantity.
   - Generate Token. A unique token ID (e.g. `TKN-8004`) is created.

3. **Live Queue & Weighbridge Verification**:
   - Go to **Quality & Weighbridge** tab.
   - Select your token -> Input Gross Weight (e.g. 18,500 Kg) and Tare Weight (e.g. 4,200 Kg).
   - The system automatically calculates Net Weight (143.00 Quintals) and applies MSP pricing rules.

4. **Direct Benefit Transfer (DBT) Payout**:
   - Go to **DBT Payouts** tab.
   - Click **Disburse DBT**. The backend updates the payment status to `Disbursed` and sends a notification log.
