const mongoose = require('mongoose');
const { PRESCRIPTION_STATUSES } = require('../config/constants');

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: {
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
      required: true,
    },
    medicalRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalRecord',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    diagnosis: {
      type: String,
      default: '',
    },
    medicines: [
      {
        medicine: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Medicine',
        },
        name: {
          type: String,
          required: true,
        },
        dosage: {
          type: String, // e.g. "500mg"
          required: true,
        },
        frequency: {
          type: String, // e.g. "1-0-1 (Twice a day after meals)"
          required: true,
        },
        duration: {
          type: String, // e.g. "5 days"
          required: true,
        },
        instructions: {
          type: String,
          default: 'Take with water after meals',
        },
        quantity: {
          type: Number,
          default: 10,
        },
        dispenseStatus: {
          type: String,
          enum: ['Pending', 'Dispensed', 'Unavailable'],
          default: 'Pending',
        },
      },
    ],
    generalAdvice: {
      type: String,
      default: 'Drink plenty of water and get adequate rest.',
    },
    status: {
      type: String,
      enum: Object.values(PRESCRIPTION_STATUSES),
      default: PRESCRIPTION_STATUSES.PENDING,
    },
    dispensedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    dispensedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
