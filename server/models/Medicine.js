const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    medicineId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    genericName: {
      type: String,
      required: [true, 'Generic name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Antibiotics',
        'Analgesics / Pain Relief',
        'Antipyretics',
        'Antihypertensives',
        'Antidiabetic',
        'Antihistamines',
        'Antacids & GI',
        'Cardiovascular',
        'Respiratory / Bronchodilators',
        'Vitamins & Supplements',
        'IV Fluids & Electrolytes',
        'Other',
      ],
      default: 'Other',
    },
    form: {
      type: String,
      enum: ['Tablet', 'Capsule', 'Syrup / Liquid', 'Injection', 'Ointment / Cream', 'Drops', 'Inhaler', 'IV Infusion'],
      default: 'Tablet',
    },
    strength: {
      type: String,
      default: '', // e.g. "500mg", "10mg/ml"
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },
    manufacturingDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    stockQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      default: 20,
    },
    unit: {
      type: String,
      default: 'Strips', // Strips, Bottles, Vials, Tubes, Amps
    },
    storageLocation: {
      type: String,
      default: 'Shelf A1',
    },
    requiresPrescription: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Discontinued', 'Out of Stock'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

medicineSchema.index({ name: 'text', genericName: 'text', batchNumber: 'text' });

module.exports = mongoose.model('Medicine', medicineSchema);
