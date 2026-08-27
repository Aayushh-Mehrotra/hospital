const mongoose = require('mongoose');

const laboratoryTestSchema = new mongoose.Schema(
  {
    testCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    testName: {
      type: String,
      required: [true, 'Test name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Hematology', 'Biochemistry', 'Microbiology', 'Immunology', 'Radiology', 'Pathology', 'Cardiology Diagnostics', 'Urine Analysis'],
      default: 'Biochemistry',
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    sampleType: {
      type: String,
      default: 'Blood', // Blood, Urine, Stool, Swab, Tissue, Sputum, etc.
    },
    parameters: [
      {
        name: { type: String, required: true },
        unit: { type: String, default: '' },
        normalRange: { type: String, default: '' },
        maleRange: { type: String, default: '' },
        femaleRange: { type: String, default: '' },
      },
    ],
    turnaroundTimeHours: {
      type: Number,
      default: 24,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LaboratoryTest', laboratoryTestSchema);
