const Expense = require('../models/Expense');
const Receipt = require('../models/Receipt');

/**
 * Evaluates an expense for duplicates, receipt re-use, and atypical spikes
 */
async function assessAnomalyRisk(expenseData, userId, receiptId = null) {
  const flags = [];
  let score = 0; // 0-100 risk score

  const amount = expenseData.convertedAmount || expenseData.amount || 0;
  const merchant = (expenseData.merchant || '').trim();
  const date = expenseData.date ? new Date(expenseData.date) : new Date();

  // 1. Check for Duplicate Receipt Hash
  if (receiptId) {
    try {
      const currentReceipt = await Receipt.findById(receiptId);
      if (currentReceipt && currentReceipt.fileHash) {
        const matchingReceipt = await Receipt.findOne({
          _id: { $ne: receiptId },
          fileHash: currentReceipt.fileHash,
        });

        if (matchingReceipt) {
          flags.push(`Identical receipt file hash detected (re-uploaded receipt). Matches previous file "${matchingReceipt.originalFilename}".`);
          score += 45;
        }
      }
    } catch (err) {
      // Non-blocking
    }
  }

  // 2. Check for Matching Vendor, Date (+- 2 days), and Amount
  try {
    const twoDaysBefore = new Date(date);
    twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
    const twoDaysAfter = new Date(date);
    twoDaysAfter.setDate(twoDaysAfter.getDate() + 2);

    const duplicateClaim = await Expense.findOne({
      _id: { $ne: expenseData._id },
      userId,
      merchant: new RegExp(`^${merchant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      amount: { $gte: amount * 0.98, $lte: amount * 1.02 }, // +-2% tolerance
      date: { $gte: twoDaysBefore, $lte: twoDaysAfter },
      status: { $ne: 'rejected' },
    });

    if (duplicateClaim) {
      flags.push(`Possible duplicate claim: A similar expense of $${duplicateClaim.amount.toFixed(2)} at "${duplicateClaim.merchant}" was filed within 48 hours.`);
      score += 35;
    }
  } catch (err) {
    // Non-blocking
  }

  // 3. Category Historical Average Check (> 2.5x historical average)
  try {
    const historicalExpenses = await Expense.find({
      category: expenseData.category,
      status: 'approved',
    }).limit(50);

    if (historicalExpenses.length >= 5) {
      const avg = historicalExpenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount), 0) / historicalExpenses.length;
      if (amount > avg * 2.5 && amount > 150) {
        flags.push(`Atypical spending spike: Amount ($${amount.toFixed(2)}) is ${Math.round(amount / avg)}x higher than category average ($${avg.toFixed(2)}).`);
        score += 25;
      }
    }
  } catch (err) {
    // Non-blocking
  }

  // Determine Level
  let level = 'low';
  if (score >= 40) {
    level = 'high';
  } else if (score >= 20) {
    level = 'medium';
  }

  return {
    level,
    score,
    flags,
    recommendation: level === 'high' ? 'Recommend secondary manager review prior to reimbursement.' :
                    level === 'medium' ? 'Review suggested for verification of receipt details.' :
                    'Standard risk profile; eligible for normal processing.',
  };
}

module.exports = {
  assessAnomalyRisk,
};
