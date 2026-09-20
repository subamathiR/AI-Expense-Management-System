const Expense = require('../../models/Expense');

/**
 * Statistical & Rule-Based Anomaly / Fraud Detector
 */
class AnomalyDetector {
  /**
   * Detect anomalies in expense submission
   */
  async analyzeExpense(userId, categoryId, amount) {
    if (!userId || !amount) {
      return { isAnomaly: false, score: 0, reason: null };
    }

    // Fetch employee's past approved/submitted expenses
    const userExpenses = await Expense.find({
      userId,
      status: { $ne: 'rejected' }
    }).limit(50);

    if (userExpenses.length < 3) {
      // High initial expense threshold check for new users (> $500)
      if (amount > 500) {
        return {
          isAnomaly: true,
          score: 75,
          reason: `Unusually high first-time transaction amount of $${amount.toFixed(2)}.`
        };
      }
      return { isAnomaly: false, score: 0, reason: null };
    }

    // Calculate historical mean and standard deviation
    const amounts = userExpenses.map(e => e.amount);
    const sum = amounts.reduce((acc, val) => acc + val, 0);
    const avg = sum / amounts.length;
    const variance = amounts.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // If current amount exceeds average by more than 3x standard deviations or is > 5x average
    if (amount > avg + (3 * (stdDev || avg * 0.5)) || (avg > 0 && amount > avg * 4)) {
      return {
        isAnomaly: true,
        score: 88,
        reason: `Unusual Expense: Amount ($${amount.toFixed(2)}) is significantly higher than employee's normal average ($${avg.toFixed(2)}).`
      };
    }

    return {
      isAnomaly: false,
      score: 10,
      reason: null
    };
  }
}

module.exports = new AnomalyDetector();
