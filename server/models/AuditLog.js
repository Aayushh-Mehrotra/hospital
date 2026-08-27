const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
      default: 'System',
    },
    userRole: {
      type: String,
      default: 'System',
    },
    action: {
      type: String, // 'LOGIN', 'CREATE_PATIENT', 'UPDATE_PATIENT', 'GENERATE_INVOICE', 'RECORD_PAYMENT', 'DISPENSE_MEDICINE', etc.
      required: true,
    },
    module: {
      type: String, // 'Auth', 'Patients', 'Appointments', 'Billing', 'Pharmacy', 'Lab', 'Inventory', 'Admissions', 'Users'
      required: true,
    },
    recordId: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ module: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
