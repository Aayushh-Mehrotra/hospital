const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    itemType: {
      type: String,
      enum: ['InventoryItem', 'Medicine'],
      default: 'InventoryItem',
    },
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
    },
    transactionType: {
      type: String,
      enum: ['STOCK_IN', 'STOCK_OUT', 'DISPENSED', 'ADJUSTMENT', 'DAMAGE', 'EXPIRED_REMOVAL'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousQuantity: {
      type: Number,
      required: true,
    },
    newQuantity: {
      type: Number,
      required: true,
    },
    referenceNumber: {
      type: String,
      default: '', // PO Number, Prescription ID, Invoice ID
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    reason: {
      type: String,
      default: '',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
