const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    supplierId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      default: '',
    },
    taxIdentificationNumber: {
      type: String,
      default: '',
    },
    suppliedCategories: [
      {
        type: String,
      },
    ],
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    paymentTerms: {
      type: String,
      default: 'Net 30',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Blacklisted'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

supplierSchema.index({ companyName: 'text', contactPerson: 'text', supplierId: 'text' });

module.exports = mongoose.model('Supplier', supplierSchema);
