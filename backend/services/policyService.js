const Policy = require('../models/Policy');
const Expense = require('../models/Expense');

/**
 * Checks an expense against company policies
 * Returns: { policyStatus, violations: [] }
 */
async function evaluateExpensePolicy(expenseData, userId) {
  const violations = [];
  let policyStatus = 'within_policy';

  const amount = expenseData.convertedAmount || expenseData.amount || 0;
  const category = expenseData.category || 'Other';
  const hasReceipt = Boolean(expenseData.receiptId || expenseData.receiptUrl);

  // 1. Fetch relevant active policies for this category and 'All'
  let policy = await Policy.findOne({ category: category, isActive: true });
  if (!policy) {
    policy = await Policy.findOne({ category: 'All', isActive: true });
  }

  // Default fallback rule thresholds if no policy is in DB yet
  const maxPerExpense = policy ? policy.maxAmountPerExpense : (
    category === 'Travel' ? 500 :
    category === 'Meals & Entertainment' ? 100 :
    category === 'Office Supplies' ? 200 :
    category === 'Software & Subscriptions' ? 300 : 400
  );

  const receiptRequiredAbove = policy ? policy.requiresReceiptAbove : 25;
  const managerApprovalAbove = policy ? policy.managerApprovalThreshold : 250;

  // Rule 1: Category limit check
  if (amount > maxPerExpense) {
    const excess = Math.round((amount - maxPerExpense) * 100) / 100;
    violations.push({
      ruleName: `${category} Spending Limit`,
      configuredLimit: maxPerExpense,
      actualValue: amount,
      severity: excess > 200 ? 'violation' : 'warning',
      message: `${category} expense ($${amount.toFixed(2)}) exceeds configured $${maxPerExpense.toFixed(2)} limit by $${excess.toFixed(2)}. Manager review required.`,
    });

    if (excess > 200) {
      policyStatus = 'policy_violation';
    } else if (policyStatus !== 'policy_violation') {
      policyStatus = 'requires_review';
    }
  }

  // Rule 2: Receipt attachment requirement
  if (amount >= receiptRequiredAbove && !hasReceipt) {
    violations.push({
      ruleName: 'Mandatory Receipt Requirement',
      configuredLimit: receiptRequiredAbove,
      actualValue: amount,
      severity: 'violation',
      message: `Receipt is required for expenses of $${receiptRequiredAbove.toFixed(2)} or greater. Please attach receipt documentation.`,
    });
    policyStatus = 'policy_violation';
  }

  // Rule 3: High-value expense manager approval trigger
  if (amount >= managerApprovalAbove) {
    violations.push({
      ruleName: 'Executive / Manager Threshold',
      configuredLimit: managerApprovalAbove,
      actualValue: amount,
      severity: 'warning',
      message: `Expense exceeds standard sign-off threshold ($${managerApprovalAbove.toFixed(2)}). Second-tier managerial approval required.`,
    });
    if (policyStatus === 'within_policy') {
      policyStatus = 'requires_review';
    }
  }

  // Rule 4: Daily aggregate spending check for the user
  if (userId) {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayExpenses = await Expense.find({
        userId,
        date: { $gte: todayStart },
        status: { $ne: 'rejected' },
      });

      const todaySum = todayExpenses.reduce((acc, curr) => acc + (curr.convertedAmount || curr.amount), 0) + amount;
      const dailyLimit = policy ? policy.dailyLimit : 1000;

      if (todaySum > dailyLimit) {
        violations.push({
          ruleName: 'Daily Aggregate Limit',
          configuredLimit: dailyLimit,
          actualValue: todaySum,
          severity: 'warning',
          message: `Total daily claims ($${todaySum.toFixed(2)}) exceed daily ceiling ($${dailyLimit.toFixed(2)}).`,
        });
        if (policyStatus === 'within_policy') {
          policyStatus = 'requires_review';
        }
      }
    } catch (err) {
      // Non-blocking query failure
    }
  }

  return {
    policyStatus,
    violations,
  };
}

module.exports = {
  evaluateExpensePolicy,
};
