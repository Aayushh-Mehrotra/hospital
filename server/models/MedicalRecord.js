const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema(
  {
    recordId: {
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
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    visitDate: {
      type: Date,
      default: Date.now,
    },
    chiefComplaint: {
      type: String,
      required: true,
    },
    symptoms: [
      {
        type: String,
        trim: true,
      },
    ],
    vitals: {
      bloodPressure: { type: String, default: '' }, // e.g. "120/80"
      pulse: { type: Number }, // bpm
      temperature: { type: Number }, // °F or °C
      spO2: { type: Number }, // %
      respiratoryRate: { type: Number }, // breaths/min
      weight: { type: Number }, // kg
      height: { type: Number }, // cm
      bmi: { type: Number },
    },
    diagnosis: {
      type: String,
      required: true,
    },
    icdCode: {
      type: String,
      default: '',
    },
    treatmentPlan: {
      type: String,
      required: true,
    },
    clinicalNotes: {
      type: String,
      default: '',
    },
    recommendedTests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LaboratoryTest',
      },
    ],
    followUpDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
