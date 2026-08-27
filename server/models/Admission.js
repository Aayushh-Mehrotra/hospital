const mongoose = require('mongoose');
const { ADMISSION_STATUSES } = require('../config/constants');

const admissionSchema = new mongoose.Schema(
  {
    admissionId: {
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
    ward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      required: true,
    },
    bed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed',
      required: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dischargeDate: {
      type: Date,
    },
    admittingDiagnosis: {
      type: String,
      required: true,
    },
    reasonForAdmission: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(ADMISSION_STATUSES),
      default: ADMISSION_STATUSES.ADMITTED,
    },
    dailyCareNotes: [
      {
        recordedAt: { type: Date, default: Date.now },
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
        vitals: {
          bloodPressure: String,
          pulse: Number,
          temperature: Number,
          spO2: Number,
        },
      },
    ],
    dischargeSummary: {
      dischargeCondition: String, // Stable, Improved, Transferred, Against Medical Advice (LAMA)
      summary: String,
      instructions: String,
      followUpAdvice: String,
    },
    admittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    dischargedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Admission', admissionSchema);
