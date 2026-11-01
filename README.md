# ExpenseAI — AI-Powered Expense Management System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-00c7b7?style=for-the-badge&logo=render&logoColor=white)](https://ai-expense-management-system-7by0.onrender.com)
[![GitHub License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> 🌐 **Live Website**: [https://ai-expense-management-system-7by0.onrender.com](https://ai-expense-management-system-7by0.onrender.com)  
> **Every Expense. Understood.**  
> An autonomous, portfolio-grade enterprise expense management platform designed with an original visual identity (Warm Ivory & Deep Forest Green with Champagne Gold accents). Captures receipts with Optical Character Recognition (OCR), validates policy compliance with a deterministic rules engine, detects duplicate & anomalous claims, manages dynamic multi-tier approval workflows, and provides an authenticated natural-language financial AI assistant.

---

## 🌟 Key Features

1. **Original Visual Identity & Design System**:
   - Refined typography (`Plus Jakarta Sans` & `Inter`).
   - Deep forest green (`#0B3B2C`), warm ivory backgrounds (`#FAF7F2`), champagne gold highlights (`#C29F5D`), and charcoal text.
   - 100% Vanilla CSS & HTML5 (No Tailwind, React, or Bootstrap).

2. **Automated Receipt OCR (Tesseract.js & Heuristic Engine)**:
   - Drag-and-drop receipt scanning for JPG, PNG, and PDF files.
   - Extracts merchant name, transaction date, total amount, taxes, subtotal, and payment methods.
   - Calculates SHA256 file hashes to immediately flag duplicate receipt re-uploads.

3. **Deterministic Policy Compliance Engine**:
   - Configurable per-category thresholds (e.g., Travel limit: $500, Meals limit: $100, Office Supplies limit: $200).
   - Mandatory receipt checks for transactions ≥ $25.
   - Clear, explainable alerts for manager review (e.g., *"Travel expense ($680.00) exceeds configured $500.00 limit by $180.00"*).

4. **Explainable Anomaly & Fraud Detection**:
   - Detects duplicate submissions across 48-hour matching vendor & amount windows.
   - Flags atypical spending spikes relative to category historical averages.
   - Assigns explainable risk ratings (`low`, `medium`, `high`) without unfairly accusing employees.

5. **Multi-Tier Approval & Payout Lifecycle**:
   - `Employee` ➔ `Manager` ➔ `Finance Team` ➔ `Reimbursed`.
   - Managers review receipts and can Approve or Reject with mandatory written feedback.
   - Finance administrators settle manager-approved claims with ACH transaction reference tracking.
   - Prevents self-approval abuse.

6. **Dynamic Budget Management**:
   - Computes actual spend dynamically from live database transaction records.
   - Visual progress bars with threshold warnings (e.g., alert when 80% or 100% utilized).

7. **Multi-Currency & Split Expense Allocation**:
   - Supports 8 major currencies (USD, EUR, GBP, CAD, AUD, JPY, INR, CHF) with live conversion rates.
   - Multi-department and project split allocations with exact mathematical sum validation.

8. **IRS Standard Mileage Tracker**:
   - Origin to destination distance logging with 2026 standard IRS rate ($0.67/mile).
   - Option to automatically generate corresponding Transportation expense entries.

9. **AI Financial Assistant**:
   - Real-time conversational interface querying authorized database records.
   - Answers queries such as *"How much did I spend this month?"*, *"Which category has the highest expenses?"*, *"Show expenses exceeding policy limits"*, and *"How much budget remains?"*.

10. **Third-Party Integrations Hub**:
    - Ready modules for QuickBooks Online, Xero, SAP Concur, Expensify, Google Cloud Vision, Tesseract OCR, and Currency API.
    - Sandbox toggles, credential storage, and connection verification handshakes.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3, Vanilla JavaScript, Chart.js, Lucide Icons, Fetch API
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose ODM)
- **Security**: JWT authentication, bcrypt password hashing, input validation, role-based access control
- **OCR**: Tesseract.js & RegEx heuristic parser
- **File Uploads**: Multer with MIME and size constraints (10MB)

---

## 👥 Demo User Credentials

The database seed script includes 4 pre-configured demo users across all organizational roles (password for all is `Password123!`):

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Employee** | `employee@expenseai.internal` | `Password123!` | Create expenses, scan receipts, log mileage, track claim status |
| **Manager** | `manager@expenseai.internal` | `Password123!` | Review assigned claims, inspect receipts, approve / reject claims |
| **Finance Admin** | `finance@expenseai.internal` | `Password123!` | Reimbursement queue, ACH payouts, financial reports & CSV export |
| **Company Admin** | `admin@expenseai.internal` | `Password123!` | Configure company policies, departmental budgets, manage integrations |

> **Tip**: The login page (`login.html`) includes 1-click demo buttons to automatically populate and test each role!

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (`node -v`)
- **MongoDB**: Local MongoDB instance running on `localhost:27017` or a MongoDB Atlas URI

### 2. Install Dependencies
```bash
npm install
```

### 3. Seed Database with Realistic Demo Data
Populates the database with demo users, policies, budgets, foreign currency expenses, split claims, and approval queues:
```bash
npm run seed
```

### 4. Run Automated Tests
Executes the test suite covering authentication, RBAC, policy rules, duplicate detection, and calculations:
```bash
npm test
```

### 5. Start Development Server (Frontend + Backend)
```bash
npm run dev
```
Running this single command starts **both** the backend REST API and the frontend web application concurrently:
- **Unified Server**: Express simultaneously serves the API (`/api/*`) and all static frontend web pages (`/index.html`, `/dashboard.html`, etc.) on port `5000`.
- **Live Auto-Reloading**: Automatically watches for changes across both the `backend/` and `frontend/` folders and reloads instantly.
- **Browser Auto-Launch**: Automatically opens your default web browser to [http://localhost:5000](http://localhost:5000).
- **Zero CORS Issues**: Because both frontend and backend share port 5000, all Fetch API calls connect seamlessly.

You can also run in production mode with:
```bash
npm start
```

---

## 📁 Project Structure

```
d:/ai expense/
├── frontend/
│   ├── index.html            # Main home/landing page with interactive demo
│   ├── home.html             # Dedicated home page route & portal showcase
│   ├── login.html            # Login page with 1-click demo role switcher
│   ├── register.html         # User registration
│   ├── dashboard.html        # Main analytics dashboard & Chart.js widgets
│   ├── expenses.html         # Expense list, filters, and audit modal
│   ├── add-expense.html      # Create expense with OCR dropzone & splits
│   ├── receipts.html         # Side-by-side OCR review & receipt repository
│   ├── budgets.html          # Budget tracking with progress utilization
│   ├── reports.html          # Period report generator & CSV/PDF export
│   ├── approvals.html        # Manager & Finance approval/payout workflow
│   ├── mileage.html          # IRS business mileage claim calculator
│   ├── assistant.html        # AI conversational financial assistant
│   ├── integrations.html     # Accounting & ERP integration hub
│   ├── settings.html         # Policy rules engine & user preferences
│   ├── css/
│   │   ├── variables.css     # Design tokens, color palette, and radii
│   │   ├── global.css        # Reset, typography, and utility classes
│   │   ├── layout.css        # App shell, sidebar, and header grids
│   │   ├── components.css    # Buttons, cards, badges, tables, modals
│   │   ├── forms.css         # Form controls, switches, dropzones
│   │   ├── landing.css       # Landing page hero, preview, and features
│   │   ├── dashboard.css     # Chart containers and widget styling
│   │   └── responsive.css   # Breakpoints for tablet and mobile
│   └── js/
│       ├── api.js            # Central API client, token handling, toasts
│       ├── app.js            # Sidebar shell, active nav, notifications
│       ├── dashboard.js      # Live dashboard KPIs and Chart.js graphs
│       ├── expenses.js       # Expense filtering and detailed audit modal
│       ├── add-expense.js    # Dropzone, live policy preview, split logic
│       ├── receipts.js       # OCR processing and document gallery
│       ├── budgets.js        # Budget calculations and threshold alerts
│       ├── reports.js        # Report compilation and CSV download
│       ├── approvals.js      # Approval queue, rejections, ACH settlements
│       ├── mileage.js        # Mileage payout calculations and trip logging
│       ├── assistant.js      # AI prompt pills and natural language queries
│       ├── integrations.js   # Credential updates and SSL handshake tests
│       └── settings.js       # Profile management and policy toggles
├── backend/
│   ├── server.js             # Express application entry point
│   ├── config/
│   │   └── db.js             # MongoDB connection logic
│   ├── models/               # Mongoose schemas (User, Expense, Policy, etc.)
│   ├── controllers/          # Business logic handlers
│   ├── routes/               # Express route definitions
│   ├── services/             # OCR, Policy Engine, Fraud, Currency, AI
│   ├── middleware/           # Auth (JWT/RBAC), Upload (Multer), Error Handler
│   ├── seeds/
│   │   └── seed.js           # Comprehensive database seed script
│   └── tests/
│       └── run-tests.js      # Automated test suite
├── .env.example              # Sample environment variables
├── .env                      # Local environment configuration
├── package.json              # NPM scripts and dependencies
└── README.md                 # Project documentation
```

---

## 🔒 Security & Policy Architecture

- **Tamper-Evident Approval Attribution**: Every approval and rejection stores the reviewer's ID, name, timestamp, and comments.
- **Self-Approval Guard**: The backend explicitly prevents employees from approving their own claims.
- **Server-Side Policy Recheck**: Direct API calls to `/api/expenses` cannot bypass policy checks; policies are re-evaluated upon every insertion and update.
- **Encrypted Password Storage**: Bcrypt with 10 salt rounds.
- **JWT Authorization**: Enforces 4-tier Role-Based Access Control (`employee`, `manager`, `finance`, `admin`).

---

## 📄 License
MIT License. Built for portfolio excellence.
