const mongoose = require('mongoose');
const { BED_STATUSES } = require('../config/constants');

const bedSchema = new mongoose.Schema(
  {
    bedNumber: {
      type: String,
      required: true,
      trim: true,
    },
    ward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(BED_STATUSES),
      default: BED_STATUSES.AVAILABLE,
    },
    currentPatient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    currentAdmission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission',
    },
    features: [
      {
        type: String, // e.g. "Oxygen Port", "Ventilator Support", "Cardiac Monitor", "Motorized"
      },
    ],
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

bedSchema.index({ bedNumber: 1, ward: 1 }, { unique: true });

module.exports = mongoose.model('Bed', bedSchema);
