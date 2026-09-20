# AI Expense Management System

## AI-Powered Employee Expense Management Platform

A full-stack employee expense management platform designed to simplify expense submission, receipt processing, expense categorization, policy compliance, fraud and anomaly detection, budget tracking, approval workflows, reimbursements, mileage tracking, and reporting.

---

## ✨ Key Features

* 🧾 **Receipt Processing** – Extract expense information from uploaded receipts using OCR.
* 🤖 **Expense Categorization** – Automatically categorize expenses based on extracted information.
* 📋 **Policy Compliance** – Check expenses against configured organizational policies.
* 🔍 **Fraud & Anomaly Detection** – Identify unusual spending patterns using statistical analysis.
* 💰 **Budget Tracking** – Monitor spending against allocated budgets.
* ✅ **Multi-Level Approval Workflow** – Manage employee, manager, and administrator approvals.
* 🚗 **Mileage Tracking** – Record and manage business travel mileage.
* 💱 **Currency Conversion** – Support expenses involving different currencies.
* 📊 **Expense Reports** – Create and manage expense reports.
* 🔔 **Notifications** – Notify users about expense and approval updates.
* 📝 **Audit Logging** – Maintain records of important system activities.
* 🔐 **Role-Based Access Control** – Provide different permissions for Employees, Managers, and Admins.

---

## 🛠 Technology Stack

### Frontend
* **HTML5** (Semantic markup)
* **CSS3** (Custom variables, responsive grid & flexbox, modern FinTech theme)
* **JavaScript (ES6+)** (Native Fetch API, zero frontend library dependencies)

### Backend
* **Node.js & Express.js** (REST API)
* **MongoDB & Mongoose**
* **JWT Authentication & bcrypt**
* **Role-Based Access Control (RBAC)**

### AI & Intelligent Processing
* **Tesseract OCR & Google Cloud Vision Integration**
* **Rule-Based & AI Expense Categorization**
* **Statistical Anomaly & Spike Detection**
* **Automated Policy Compliance Analysis**

---

## 🗄 Database Models

The application uses MongoDB with 12 Mongoose models:

* `User`
* `Expense`
* `Receipt`
* `ExpenseReport`
* `Category`
* `Policy`
* `Budget`
* `Approval`
* `Mileage`
* `Reimbursement`
* `Notification`
* `AuditLog`

---

## 🔐 User Roles

| Role         | Access                                                 |
| ------------ | ------------------------------------------------------ |
| **Employee** | Submit, view, and manage personal expenses             |
| **Manager**  | Review and approve employee expenses                   |
| **Admin**    | Manage users, policies, budgets, and system activities |

---

## 📊 Main Modules

### Employee Dashboard
* Submit expenses
* Upload receipts
* Track expense status
* View expense history
* Manage mileage
* Generate expense reports

### Manager Dashboard
* Review employee expenses
* Approve or reject expenses
* Monitor team spending
* Review policy violations
* Track approval workflows

### Admin Dashboard
* Manage users
* Manage expense categories
* Configure policies
* Manage budgets
* Monitor system activities
* View audit logs

---

## 🔑 Demo Accounts

| Role         | Email                   | Password      | Access URL |
| ------------ | ----------------------- | ------------- | :--- |
| **Employee** | `john@expenseai.com`    | `employee123` | `http://localhost:5001/employee/dashboard.html` |
| **Manager**  | `manager@expenseai.com` | `manager123`  | `http://localhost:5001/manager/dashboard.html` |
| **Admin**    | `admin@expenseai.com`   | `admin123`    | `http://localhost:5001/admin/dashboard.html` |

> Demo credentials are provided for local testing purposes.

---

## 🚀 Quick Start Guide

### 1. Install Backend Dependencies
```bash
cd server
npm install
```

### 2. Seed Database
```bash
npm run seed
```

### 3. Start Server
```bash
npm start
```
The server will start on **`http://localhost:5001`** and serve the static frontend.

---

## 📁 Project Structure

```text
AI-Expense-Management-System/
│
├── frontend/                     # Pure HTML5 / CSS3 / Vanilla JS
│   ├── admin/                    # Admin portal pages
│   ├── employee/                 # Employee dashboard & expense flows
│   ├── manager/                  # Manager approval portal
│   ├── css/                      # Modular design tokens & components
│   ├── js/                       # REST API client & feature scripts
│   ├── index.html
│   ├── login.html
│   └── register.html
│
├── server/                       # Express.js REST API
│   ├── config/                   # Database & environment configuration
│   ├── controllers/              # Request handlers
│   ├── middleware/               # Auth, validation, file upload
│   ├── models/                   # 12 Mongoose data models
│   ├── routes/                   # API route definitions
│   ├── seeds/                    # Database seeding scripts
│   ├── services/                 # OCR, AI categorization, anomaly detection
│   ├── utils/                    # Helper functions
│   ├── package.json
│   └── server.js
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 📌 Project Status

**Status:** Active Development

AI Expense Management System is a full-stack employee expense management platform combining modern web technologies, OCR, intelligent expense processing, compliance monitoring, and workflow automation.