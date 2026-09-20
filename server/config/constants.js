module.exports = {
  // Expense statuses
  EXPENSE_STATUS: {
    DRAFT: 'draft',
    PROCESSING: 'processing',
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    POLICY_VIOLATION: 'policy_violation',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    REIMBURSED: 'reimbursed',
  },

  // Report statuses
  REPORT_STATUS: {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    REIMBURSED: 'reimbursed',
  },

  // User roles
  ROLES: {
    EMPLOYEE: 'employee',
    MANAGER: 'manager',
    ADMIN: 'admin',
  },

  // Approval statuses
  APPROVAL_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },

  // Reimbursement statuses
  REIMBURSEMENT_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
  },

  // Expense types
  EXPENSE_TYPE: {
    REGULAR: 'regular',
    MILEAGE: 'mileage',
  },

  // Notification types
  NOTIFICATION_TYPE: {
    APPROVAL_REQUEST: 'approval_request',
    EXPENSE_APPROVED: 'expense_approved',
    EXPENSE_REJECTED: 'expense_rejected',
    POLICY_VIOLATION: 'policy_violation',
    BUDGET_WARNING: 'budget_warning',
    DUPLICATE_WARNING: 'duplicate_warning',
    ANOMALY_WARNING: 'anomaly_warning',
  },

  // Audit actions
  AUDIT_ACTION: {
    EXPENSE_CREATED: 'expense_created',
    EXPENSE_EDITED: 'expense_edited',
    EXPENSE_SUBMITTED: 'expense_submitted',
    EXPENSE_APPROVED: 'expense_approved',
    EXPENSE_REJECTED: 'expense_rejected',
    POLICY_VIOLATION_DETECTED: 'policy_violation_detected',
    EXPENSE_REIMBURSED: 'expense_reimbursed',
    USER_CREATED: 'user_created',
    USER_UPDATED: 'user_updated',
    REPORT_CREATED: 'report_created',
    REPORT_SUBMITTED: 'report_submitted',
  },

  // OCR providers
  OCR_PROVIDER: {
    TESSERACT: 'tesseract',
    GOOGLE_VISION: 'google_vision',
  },

  // File types allowed
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf'],

  // Default categories
  DEFAULT_CATEGORIES: [
    { name: 'Travel', icon: 'plane', color: '#3B82F6', keywords: ['airline', 'flight', 'airport', 'travel', 'trip', 'airways'] },
    { name: 'Meals & Entertainment', icon: 'utensils', color: '#F59E0B', keywords: ['restaurant', 'cafe', 'food', 'dining', 'lunch', 'dinner', 'breakfast', 'bar', 'coffee'] },
    { name: 'Accommodation', icon: 'hotel', color: '#8B5CF6', keywords: ['hotel', 'motel', 'inn', 'lodge', 'airbnb', 'hostel', 'stay', 'room'] },
    { name: 'Office Supplies', icon: 'briefcase', color: '#10B981', keywords: ['office', 'stationery', 'paper', 'printer', 'ink', 'supplies', 'desk'] },
    { name: 'Transportation', icon: 'car', color: '#EF4444', keywords: ['taxi', 'uber', 'lyft', 'cab', 'bus', 'train', 'metro', 'fuel', 'gas', 'parking'] },
    { name: 'Software', icon: 'monitor', color: '#06B6D4', keywords: ['software', 'license', 'subscription', 'saas', 'app', 'tool', 'cloud'] },
    { name: 'Communication', icon: 'phone', color: '#F97316', keywords: ['phone', 'mobile', 'internet', 'telecom', 'data', 'call'] },
    { name: 'Training', icon: 'book', color: '#84CC16', keywords: ['training', 'course', 'workshop', 'seminar', 'conference', 'education', 'certification'] },
    { name: 'Medical', icon: 'heart', color: '#EC4899', keywords: ['medical', 'health', 'hospital', 'clinic', 'pharmacy', 'doctor', 'medicine'] },
    { name: 'Other', icon: 'folder', color: '#6B7280', keywords: [] },
  ],

  // Default policies
  DEFAULT_POLICIES: [
    { name: 'Meals Limit', categoryName: 'Meals & Entertainment', maxAmount: 100, maxAmountPeriod: 'per_expense', description: 'Maximum $100 per meal expense' },
    { name: 'Hotel Limit', categoryName: 'Accommodation', maxAmount: 200, maxAmountPeriod: 'per_expense', description: 'Maximum $200 per night for hotel stays' },
    { name: 'Office Supplies Limit', categoryName: 'Office Supplies', maxAmount: 500, maxAmountPeriod: 'per_expense', description: 'Maximum $500 per office supply transaction' },
    { name: 'Flight Class Policy', categoryName: 'Travel', maxAmount: 2000, maxAmountPeriod: 'per_expense', allowedClasses: ['economy'], description: 'Economy class only for flights' },
  ],

  // Approval thresholds
  APPROVAL_THRESHOLDS: [
    { maxAmount: 500, levels: 1, approvers: ['manager'] },
    { maxAmount: 5000, levels: 2, approvers: ['manager', 'finance'] },
    { maxAmount: Infinity, levels: 3, approvers: ['manager', 'finance', 'admin'] },
  ],
};
