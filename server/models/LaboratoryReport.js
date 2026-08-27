const mongoose = require('mongoose');
const { LAB_STATUSES } = require('../config/constants');

const laboratoryReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LaboratoryTest',
      required: true,
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
    requestedDate: {
      type: Date,
      default: Date.now,
    },
    sampleCollectedDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(LAB_STATUSES),
      default: LAB_STATUSES.REQUESTED,
    },
    priority: {
      type: String,
      enum: ['Normal', 'Urgent', 'STAT (Emergency)'],
      default: 'Normal',
    },
    results: [
      {
        parameter: { type: String, required: true },
        value: { type: String, default: '' },
        unit: { type: String, default: '' },
        normalRange: { type: String, default: '' },
        flag: {
          type: String,
          enum: ['Normal', 'Low', 'High', 'Critical'],
          default: 'Normal',
        },
      },
    ],
    clinicalImpression: {
      type: String,
      default: '',
    },
    remarks: {
      type: String,
      default: '',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LaboratoryReport', laboratoryReportSchema);
