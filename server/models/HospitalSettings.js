const mongoose = require('mongoose');

const hospitalSettingsSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      required: true,
      default: 'CarePulse Super Speciality Hospital',
    },
    tagline: {
      type: String,
      default: 'Excellence in Healthcare & Compassionate Patient Service',
    },
    registrationNumber: {
      type: String,
      default: 'HOSP-MED-2024-9988',
    },
    email: {
      type: String,
      default: 'contact@carepulse-hospital.org',
    },
    phone: {
      type: String,
      default: '+1 (800) 555-CARE',
    },
    emergencyHelpline: {
      type: String,
      default: '+1 (800) 911-HELP',
    },
    website: {
      type: String,
      default: 'https://carepulse-hospital.org',
    },
    address: {
      street: { type: String, default: '450 Healthcare Boulevard, Medical District' },
      city: { type: String, default: 'New York' },
      state: { type: String, default: 'NY' },
      postalCode: { type: String, default: '10001' },
      country: { type: String, default: 'United States' },
    },
    currency: {
      code: { type: String, default: 'USD' },
      symbol: { type: String, default: '$' },
    },
    taxRatePercentage: {
      type: Number,
      default: 5.0,
    },
    invoicePrefix: {
      type: String,
      default: 'INV-2026-',
    },
    logoUrl: {
      type: String,
      default: '',
    },
    authorizedSignatoryName: {
      type: String,
      default: 'Dr. Arthur Pendelton, MD (Medical Director)',
    },
    invoiceFooterNote: {
      type: String,
      default: 'Thank you for choosing CarePulse Hospital. We wish you a swift and complete recovery.',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('HospitalSettings', hospitalSettingsSchema);
