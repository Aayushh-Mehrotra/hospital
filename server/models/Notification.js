const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Null if sent to role or broadcast
    },
    targetRole: {
      type: String, // e.g. 'Doctor', 'Pharmacist', 'Accountant', 'All'
      default: 'All',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Info', 'Success', 'Warning', 'Alert', 'Emergency'],
      default: 'Info',
    },
    module: {
      type: String,
      default: 'General',
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
