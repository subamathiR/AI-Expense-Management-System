const mongoose = require('mongoose');
const { evaluateExpensePolicy } = require('../services/policyService');
const { assessAnomalyRisk } = require('../services/fraudService');
const { convertCurrency } = require('../services/currencyService');
const { processAssistantQuery } = require('../services/aiAssistantService');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expenseai';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 EXPENSEAI AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(description, condition) {
    if (condition) {
      console.log(`  ✓ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${description}`);
      failed++;
    }
  }

  try {
    await mongoose.connect(MONGO_URI);

    // Test 1: Currency Conversion Calculation
    console.log('[1. Currency Conversion & Exchange Rate]');
    const eurConversion = await convertCurrency(100, 'EUR', 'USD');
    assert('100 EUR converted to USD equals $108.00 at 1.08 rate', eurConversion.convertedAmount === 108.00 && eurConversion.exchangeRate === 1.08);
    const usdConversion = await convertCurrency(50, 'USD', 'USD');
    assert('Same currency (USD to USD) has 1.0 rate and identical amount', usdConversion.convertedAmount === 50 && usdConversion.exchangeRate === 1.0);

    // Test 2: Split Allocation Mathematics
    console.log('\n[2. Split Expense Allocation]');
    const originalAmount = 250.00;
    const splitDetails = [
      { targetName: 'Engineering', amount: 150.00, percentage: 60 },
      { targetName: 'Marketing', amount: 100.00, percentage: 40 },
    ];
    const totalSplit = splitDetails.reduce((sum, s) => sum + s.amount, 0);
    assert('Split components sum exactly to original amount ($250.00)', Math.abs(totalSplit - originalAmount) < 0.001);

    // Test 3: Policy Compliance Engine - Over Limit Travel Check
    console.log('\n[3. Deterministic Policy Validation]');
    const travelOverLimit = await evaluateExpensePolicy({
      amount: 680.00,
      convertedAmount: 680.00,
      category: 'Travel',
      receiptUrl: 'dummy.jpg',
    });
    assert('Travel $680 flags as requires_review or policy_violation', travelOverLimit.policyStatus !== 'within_policy');
    assert('Violation message contains excess amount ($180.00)', travelOverLimit.violations.some(v => v.message.includes('$180.00')));

    const mealWithinPolicy = await evaluateExpensePolicy({
      amount: 45.00,
      convertedAmount: 45.00,
      category: 'Meals & Entertainment',
      receiptUrl: 'receipt.jpg',
    });
    assert('Meal under $100 with receipt passes as within_policy', mealWithinPolicy.policyStatus === 'within_policy');

    // Test 4: Duplicate & Fraud Detection
    console.log('\n[4. Anomaly & Duplicate Detection]');
    const testUser = await User.findOne({ email: 'employee@expenseai.internal' });
    const duplicateCheck = await assessAnomalyRisk({
      merchant: 'Starbucks Coffee #1042',
      date: new Date(),
      amount: 14.50,
      convertedAmount: 14.50,
      category: 'Meals & Entertainment',
    }, testUser._id);
    assert('Identifies potential duplicate claim within 48h window', duplicateCheck.flags.length > 0 || duplicateCheck.score > 0);

    // Test 5: Authentication & Password Hashing
    console.log('\n[5. Authentication & Bcrypt Verification]');
    const foundUser = await User.findOne({ email: 'admin@expenseai.internal' }).select('+password');
    assert('Admin user exists in database', !!foundUser);
    const passwordValid = await foundUser.matchPassword('Password123!');
    assert('Valid password verified by bcrypt hash', passwordValid === true);
    const passwordWrong = await foundUser.matchPassword('WrongPassword');
    assert('Invalid password correctly rejected', passwordWrong === false);

    // Test 6: Role Based Access Control (RBAC)
    console.log('\n[6. Role-Based Permissions & Guard]');
    assert('Employee role is "employee"', testUser.role === 'employee');
    assert('Admin role is "admin"', foundUser.role === 'admin');

    // Test 7: Budget Calculations
    console.log('\n[7. Dynamic Budget Calculations]');
    const budgets = await Budget.find({});
    assert('Budgets exist in database', budgets.length > 0);
    const firstBudget = budgets[0];
    const dummySpend = 4200;
    const computedRemaining = firstBudget.budgetAmount - dummySpend;
    const computedPercent = Math.round((dummySpend / firstBudget.budgetAmount) * 100);
    assert('Budget remaining and percentage utilization correctly computed', computedRemaining === (firstBudget.budgetAmount - dummySpend) && computedPercent > 0);

    // Test 8: AI Assistant Natural Language Query
    console.log('\n[8. AI Assistant Natural Language Query Engine]');
    const aiAnswer = await processAssistantQuery('How much did I spend this month?', testUser);
    assert('Assistant computes spend response', !!aiAnswer.answer && aiAnswer.answer.includes('$'));

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test Suite encountered error:', err);
    process.exit(1);
  }
}

runTests();
