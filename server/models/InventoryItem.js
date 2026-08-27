const mongoose = require('mongoose');
const { INVENTORY_CATEGORIES } = require('../config/constants');

const inventoryItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(INVENTORY_CATEGORIES),
      default: INVENTORY_CATEGORIES.CONSUMABLES,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      default: 'Units', // Boxes, Units, Packs, Pairs, Rolls, Sets
    },
    unitPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    reorderLevel: {
      type: Number,
      default: 10,
    },
    storageLocation: {
      type: String,
      default: 'Central Supply Room',
    },
    batchNumber: {
      type: String,
      default: '',
    },
    expiryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'],
      default: 'In Stock',
    },
  },
  {
    timestamps: true,
  }
);

inventoryItemSchema.index({ name: 'text', itemId: 'text' });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
