const Policy = require('../../models/Policy');
const Category = require('../../models/Category');

/**
 * Policy Compliance & Multi-Tier Approval Threshold Evaluator
 */
class PolicyEngine {
  /**
   * Evaluate compliance against stored DB policies
   */
  async evaluateCompliance(categoryId, amount, description = '', tags = []) {
    const violations = [];
    let policyCompliant = true;

    if (!categoryId) return { policyCompliant, violations };

    const category = await Category.findById(categoryId).catch(() => null);
    const policies = await Policy.find({
      isActive: true,
      $or: [{ categoryId }, { categoryId: null }]
    }).catch(() => []);

    for (const policy of policies) {
      if (policy.maxAmount && policy.maxAmountPeriod === 'per_expense') {
        if (amount > policy.maxAmount) {
          violations.push(`Exceeds spending limit of $${policy.maxAmount} for policy: "${policy.name}"`);
          policyCompliant = false;
        }
      }

      if (policy.allowedClasses && policy.allowedClasses.length > 0) {
        const descLower = description.toLowerCase();
        const hasRestrictedClass = ['first class', 'business class', 'first-class', 'business-class'].some(c => descLower.includes(c));
        const allowed = policy.allowedClasses.map(c => c.toLowerCase());
        const hasAllowed = allowed.some(c => descLower.includes(c));

        if (hasRestrictedClass && !hasAllowed) {
          violations.push(`Policy "${policy.name}" restricts booking classes to: ${policy.allowedClasses.join(', ')}`);
          policyCompliant = false;
        }
      }
    }

    return { policyCompliant, violations };
  }

  /**
   * Determine required approval tier based on claim amount
   * <$500 → Manager
   * $500–$5,000 → Manager + Finance
   * >$5,000 → Manager + Finance + Admin
   */
  getRequiredApprovalTiers(amount) {
    if (amount <= 500) {
      return {
        tier: 1,
        requiredRoles: ['manager'],
        description: 'Single-Level Approval (Manager)',
      };
    } else if (amount <= 5000) {
      return {
        tier: 2,
        requiredRoles: ['manager', 'finance'],
        description: 'Two-Level Approval (Manager + Finance)',
      };
    } else {
      return {
        tier: 3,
        requiredRoles: ['manager', 'finance', 'admin'],
        description: 'Executive Approval (Manager + Finance + Admin)',
      };
    }
  }
}

module.exports = new PolicyEngine();
