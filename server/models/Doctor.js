const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    qualifications: [
      {
        type: String,
        trim: true,
      },
    ],
    experienceYears: {
      type: Number,
      default: 0,
    },
    licenseNumber: {
      type: String,
      default: '',
    },
    consultationFee: {
      type: Number,
      required: true,
      default: 50,
    },
    roomNumber: {
      type: String,
      default: 'OPD-101',
    },
    bio: {
      type: String,
      default: '',
    },
    schedule: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          required: true,
        },
        startTime: {
          type: String, // '09:00'
          required: true,
        },
        endTime: {
          type: String, // '17:00'
          required: true,
        },
        slotDurationMinutes: {
          type: Number,
          default: 30,
        },
        isAvailable: {
          type: Boolean,
          default: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Doctor', doctorSchema);
