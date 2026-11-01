const mongoose = require('mongoose');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Policy = require('../models/Policy');
const Integration = require('../models/Integration');
const Notification = require('../models/Notification');
const MileageTrip = require('../models/MileageTrip');
const ExpenseReport = require('../models/ExpenseReport');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expenseai';

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected to MongoDB. Clearing previous demo data...');

    await User.deleteMany({});
    await Expense.deleteMany({});
    await Budget.deleteMany({});
    await Policy.deleteMany({});
    await Integration.deleteMany({});
    await Notification.deleteMany({});
    await MileageTrip.deleteMany({});
    await ExpenseReport.deleteMany({});

    console.log('[Seed] Creating demo users...');
    // Create Users (Password: Password123!)
    const adminUser = await User.create({
      name: 'Elena Rostova',
      email: 'admin@expenseai.internal',
      password: 'Password123!',
      role: 'admin',
      department: 'Executive',
      preferredCurrency: 'USD',
    });

    const financeUser = await User.create({
      name: 'David Miller',
      email: 'finance@expenseai.internal',
      password: 'Password123!',
      role: 'finance',
      department: 'Finance & Treasury',
      preferredCurrency: 'USD',
    });

    const managerUser = await User.create({
      name: 'Sarah Jenkins',
      email: 'manager@expenseai.internal',
      password: 'Password123!',
      role: 'manager',
      department: 'Product & Engineering',
      preferredCurrency: 'USD',
    });

    const employeeUser = await User.create({
      name: 'Marcus Vance',
      email: 'employee@expenseai.internal',
      password: 'Password123!',
      role: 'employee',
      department: 'Product & Engineering',
      preferredCurrency: 'USD',
      managerId: managerUser._id,
    });

    console.log('[Seed] Creating corporate policies...');
    await Policy.create([
      {
        name: 'Standard Travel Spending Policy',
        category: 'Travel',
        department: 'All',
        maxAmountPerExpense: 500,
        dailyLimit: 1200,
        monthlyLimit: 6000,
        requiresReceiptAbove: 25,
        managerApprovalThreshold: 250,
        description: 'Single flight or rail transactions above $500 require explicit managerial exception.',
        isActive: true,
      },
      {
        name: 'Client Meals & Entertainment Policy',
        category: 'Meals & Entertainment',
        department: 'All',
        maxAmountPerExpense: 100,
        dailyLimit: 250,
        monthlyLimit: 1500,
        requiresReceiptAbove: 25,
        managerApprovalThreshold: 100,
        description: 'Business meals must include attendee list and stay below $100 per seating.',
        isActive: true,
      },
      {
        name: 'Office Supplies & Workstation Goods',
        category: 'Office Supplies',
        department: 'All',
        maxAmountPerExpense: 200,
        dailyLimit: 400,
        monthlyLimit: 1000,
        requiresReceiptAbove: 15,
        managerApprovalThreshold: 200,
        description: 'Stationery and ergonomic goods covered up to $200 per order.',
        isActive: true,
      },
      {
        name: 'SaaS Software & Developer Subscriptions',
        category: 'Software & Subscriptions',
        department: 'All',
        maxAmountPerExpense: 350,
        dailyLimit: 700,
        monthlyLimit: 4000,
        requiresReceiptAbove: 20,
        managerApprovalThreshold: 350,
        description: 'Pre-approved cloud tools, IDE licenses, and productivity services.',
        isActive: true,
      },
    ]);

    console.log('[Seed] Creating departmental budgets...');
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    await Budget.create([
      {
        department: 'Product & Engineering',
        category: 'Software & Subscriptions',
        budgetAmount: 12000,
        spentAmount: 7450,
        alertThreshold: 80,
        fiscalYear: currentYear,
        month: currentMonth,
        notes: 'AWS compute, GitHub Enterprise, JetBrains, Figma',
      },
      {
        department: 'Product & Engineering',
        category: 'Travel',
        budgetAmount: 8000,
        spentAmount: 5120,
        alertThreshold: 75,
        fiscalYear: currentYear,
        month: currentMonth,
        notes: 'Engineering summit and onsite architecture sprint',
      },
      {
        department: 'Product & Engineering',
        category: 'Office Supplies',
        budgetAmount: 2500,
        spentAmount: 850,
        alertThreshold: 80,
        fiscalYear: currentYear,
        month: currentMonth,
        notes: 'Remote home-office ergonomic allowances',
      },
      {
        department: 'Product & Engineering',
        category: 'Meals & Entertainment',
        budgetAmount: 3000,
        spentAmount: 1240,
        alertThreshold: 80,
        fiscalYear: currentYear,
        month: currentMonth,
        notes: 'Team lunches and sprint planning refreshments',
      },
    ]);

    console.log('[Seed] Creating demo expenses with policy violations, duplicates, foreign currency, and splits...');

    // 1. Valid Office Supplies
    await Expense.create({
      userId: employeeUser._id,
      merchant: 'Staples Office Solutions',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      amount: 145.20,
      currency: 'USD',
      convertedAmount: 145.20,
      reportingCurrency: 'USD',
      category: 'Office Supplies',
      paymentMethod: 'Corporate Card',
      description: 'Ergonomic keyboard, wireless mouse, and high-density desk mat',
      status: 'approved',
      policyStatus: 'within_policy',
      approvedBy: managerUser._id,
      approvedAt: new Date(),
    });

    // 2. Restaurant Expense
    await Expense.create({
      userId: employeeUser._id,
      merchant: 'Blue Fin Bistro & Grill',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      amount: 78.40,
      currency: 'USD',
      convertedAmount: 78.40,
      reportingCurrency: 'USD',
      category: 'Meals & Entertainment',
      paymentMethod: 'Corporate Card',
      description: 'Quarterly candidate debrief dinner with engineering lead',
      status: 'reimbursed',
      policyStatus: 'within_policy',
      approvedBy: managerUser._id,
      approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      reimbursedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
      reimbursementRef: 'TXN-ACH-891240',
    });

    // 3. Travel expense exceeding policy ($680 > $500 limit)
    await Expense.create({
      userId: employeeUser._id,
      merchant: 'Delta Air Lines',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
      amount: 680.00,
      currency: 'USD',
      convertedAmount: 680.00,
      reportingCurrency: 'USD',
      category: 'Travel',
      paymentMethod: 'Corporate Card',
      description: 'Roundtrip flight NYC to SFO for client security audit',
      status: 'submitted',
      policyStatus: 'requires_review',
      policyViolations: [
        {
          ruleName: 'Travel Spending Limit',
          configuredLimit: 500,
          actualValue: 680,
          severity: 'warning',
          message: 'Travel expense ($680.00) exceeds configured $500.00 limit by $180.00. Manager review is required.',
        },
      ],
      fraudRisk: {
        level: 'low',
        flags: [],
        score: 10,
      },
    });

    // 4. Duplicate expense warning candidate
    await Expense.create({
      userId: employeeUser._id,
      merchant: 'Starbucks Coffee #1042',
      date: new Date(Date.now() - 1000 * 60 * 60 * 12),
      amount: 14.50,
      currency: 'USD',
      convertedAmount: 14.50,
      reportingCurrency: 'USD',
      category: 'Meals & Entertainment',
      paymentMethod: 'Personal Card',
      description: 'Morning client coffee catchup',
      status: 'submitted',
      policyStatus: 'within_policy',
      fraudRisk: {
        level: 'medium',
        flags: ['Possible duplicate claim: A similar expense of $14.50 was filed within 48 hours.'],
        score: 35,
      },
    });

    // 5. Foreign Currency Expense (EUR converted to USD)
    await Expense.create({
      userId: employeeUser._id,
      merchant: 'SNCF TGV Rail Paris',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      amount: 120.00,
      currency: 'EUR',
      exchangeRate: 1.08,
      convertedAmount: 129.60,
      reportingCurrency: 'USD',
      category: 'Travel',
      paymentMethod: 'Corporate Card',
      description: 'European partner onsite transport (120.00 EUR converted at 1.08 USD/EUR)',
      status: 'approved',
      policyStatus: 'within_policy',
      approvedBy: managerUser._id,
      approvedAt: new Date(),
    });

    // 6. Split Expense across Departments
    await Expense.create({
      userId: employeeUser._id,
      merchant: 'GitHub Enterprise Annual Seat Pack',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      amount: 300.00,
      currency: 'USD',
      convertedAmount: 300.00,
      reportingCurrency: 'USD',
      category: 'Software & Subscriptions',
      paymentMethod: 'Corporate Card',
      description: 'Cross-functional seats for core engineering and product design',
      status: 'approved',
      policyStatus: 'within_policy',
      splitDetails: [
        {
          allocationType: 'department',
          targetName: 'Product & Engineering',
          amount: 200.00,
          percentage: 66.67,
        },
        {
          allocationType: 'department',
          targetName: 'Design & UX',
          amount: 100.00,
          percentage: 33.33,
        },
      ],
      approvedBy: managerUser._id,
      approvedAt: new Date(),
    });

    // 7. Approved claim awaiting finance reimbursement
    await Expense.create({
      userId: employeeUser._id,
      merchant: 'Hilton Downtown San Francisco',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
      amount: 420.00,
      currency: 'USD',
      convertedAmount: 420.00,
      reportingCurrency: 'USD',
      category: 'Accommodation',
      paymentMethod: 'Personal Card',
      description: '2 nights lodging for technical conference speaker engagement',
      status: 'approved',
      policyStatus: 'within_policy',
      approvedBy: managerUser._id,
      approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    });

    console.log('[Seed] Creating demo mileage trips...');
    await MileageTrip.create([
      {
        userId: employeeUser._id,
        tripDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        startLocation: 'Company HQ (New York, NY)',
        destination: 'Client Campus (Jersey City, NJ)',
        businessPurpose: 'Onsite infrastructure audit & client stakeholder demo',
        distanceMiles: 48.5,
        ratePerMile: 0.67,
        reimbursementAmount: 32.50,
        calculationType: 'manual',
        status: 'approved',
      },
      {
        userId: employeeUser._id,
        tripDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        startLocation: 'Hotel (San Francisco, CA)',
        destination: 'SFO International Airport',
        businessPurpose: 'Return airport transit after annual engineering summit',
        distanceMiles: 18.2,
        ratePerMile: 0.67,
        reimbursementAmount: 12.19,
        calculationType: 'route_calculated',
        status: 'submitted',
      },
    ]);

    console.log('[Seed] Creating demo notifications...');
    await Notification.create([
      {
        userId: employeeUser._id,
        title: 'Policy Review Required',
        message: 'Your Delta Air Lines claim ($680.00) was flagged because it exceeds the standard $500 travel threshold.',
        type: 'policy_alert',
        link: 'expenses.html',
      },
      {
        userId: employeeUser._id,
        title: 'Reimbursement Settled',
        message: 'Payment of $78.40 for Blue Fin Bistro & Grill has been disbursed via ACH (Ref: TXN-ACH-891240).',
        type: 'reimbursement',
        link: 'expenses.html',
      },
      {
        userId: managerUser._id,
        title: 'New Expense Awaiting Review',
        message: 'Marcus Vance submitted a $680.00 Travel claim requiring managerial review.',
        type: 'approval_request',
        link: 'approvals.html',
      },
    ]);

    console.log('[Seed] Creating demo integrations...');
    await Integration.create([
      {
        providerId: 'quickbooks',
        name: 'QuickBooks Online',
        category: 'Accounting',
        description: 'Bi-directional general ledger sync for expenses, vendors, and reimbursement payouts.',
        status: 'connected',
        credentials: { isSandbox: true, endpointUrl: 'https://sandbox-quickbooks.api.intuit.com/v3/company' },
        lastSyncTime: new Date(Date.now() - 1000 * 60 * 60 * 3),
        lastSyncStatus: 'Synced 18 transactions',
        syncCount: 42,
      },
      {
        providerId: 'xero',
        name: 'Xero Accounting',
        category: 'Accounting',
        description: 'Automated bank feed reconciliation and chart-of-accounts expense posting.',
        status: 'connected',
        credentials: { isSandbox: true, endpointUrl: 'https://api.xero.com/api.xro/2.0' },
        lastSyncTime: new Date(Date.now() - 1000 * 60 * 30),
        lastSyncStatus: 'Ledger Accounts Mapped',
        syncCount: 14,
      },
      {
        providerId: 'sap_concur',
        name: 'SAP Concur Enterprise',
        category: 'ERP',
        description: 'Corporate travel booking and ERP travel expense journal integration.',
        status: 'connected',
        credentials: { isSandbox: true, endpointUrl: 'https://us2.concursolutions.com/api/v3.0' },
        lastSyncTime: new Date(Date.now() - 1000 * 60 * 60),
        lastSyncStatus: 'Travel Journal Linked',
        syncCount: 9,
      },
      {
        providerId: 'expensify',
        name: 'Expensify Bridge',
        category: 'ERP',
        description: 'Legacy receipt migration and credit card transaction import pipeline.',
        status: 'connected',
        credentials: { isSandbox: true, endpointUrl: 'https://integrations.expensify.com/Integration-Server/ExpensifyPartner' },
        lastSyncTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
        lastSyncStatus: 'Synced successfully',
        syncCount: 15,
      },
      {
        providerId: 'tesseract_ocr',
        name: 'Tesseract Neural OCR Engine',
        category: 'Receipt OCR',
        description: 'Local on-premise neural network optical character recognition engine.',
        status: 'connected',
        credentials: { endpointUrl: 'local://embedded/tesseract-v5' },
        lastSyncTime: new Date(),
        lastSyncStatus: 'Active and Ready (Local Engine)',
        syncCount: 120,
      },
      {
        providerId: 'google_cloud_vision',
        name: 'Google Cloud Vision AI',
        category: 'Receipt OCR',
        description: 'High-density cloud OCR pipeline for multi-lingual and blurred receipts.',
        status: 'connected',
        credentials: { isSandbox: true, endpointUrl: 'https://vision.googleapis.com/v1/images:annotate' },
        lastSyncTime: new Date(Date.now() - 1000 * 60 * 45),
        lastSyncStatus: 'Vision Pipeline Ready',
        syncCount: 88,
      },
      {
        providerId: 'exchange_rate_api',
        name: 'Central Exchange Rate Service',
        category: 'Currency Service',
        description: 'Real-time foreign exchange rate sync for 160+ fiat currencies.',
        status: 'connected',
        credentials: { endpointUrl: 'https://api.exchangerate-api.com/v4/latest/USD' },
        lastSyncTime: new Date(Date.now() - 1000 * 60 * 45),
        lastSyncStatus: 'Rates Fresh (1 USD = 1.08 EUR)',
        syncCount: 350,
      },
    ]);

    console.log('[Seed] Database successfully populated with realistic portfolio demo data!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error populating database:', err);
    process.exit(1);
  }
}

seedData();
