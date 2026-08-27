const mongoose = require('mongoose');
const { INVOICE_STATUSES, PAYMENT_METHODS } = require('../config/constants');

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Consultation', 'Room / Bed Charge', 'Laboratory', 'Pharmacy / Medicines', 'Surgery / Procedure', 'Nursing Care', 'Equipment / Consumables', 'Other Services'],
    default: 'Other Services',
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  taxPercentage: {
    type: Number,
    default: 0,
    min: 0,
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    admission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission',
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    items: [invoiceItemSchema],
    subTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
    },
    taxTotal: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(INVOICE_STATUSES),
      default: INVOICE_STATUSES.PENDING,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.CASH,
    },
    billingDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
    insuranceClaimDetails: {
      claimNumber: String,
      insuranceProvider: String,
      approvalCode: String,
      coverageAmount: Number,
      copayAmount: Number,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ invoiceNumber: 'text', paymentStatus: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
