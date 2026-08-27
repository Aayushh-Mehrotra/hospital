const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ward name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['ICU', 'General Ward Male', 'General Ward Female', 'Semi-Private', 'Private Deluxe', 'Emergency / Trauma', 'Pediatric', 'Post-Op Recovery'],
      required: true,
    },
    floor: {
      type: String,
      default: '2nd Floor',
    },
    capacity: {
      type: Number,
      required: true,
      default: 10,
    },
    chargePerDay: {
      type: Number,
      required: true,
      default: 100,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Under Renovation', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Ward', wardSchema);
