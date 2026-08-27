const InventoryItem = require('../models/InventoryItem');
const InventoryTransaction = require('../models/InventoryTransaction');
const { generateUniqueId } = require('../utils/generateId');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc    Get all inventory items
// @route   GET /api/inventory/items
// @access  Private
const getInventoryItems = async (req, res) => {
  const { category, status, lowStock, search, page = 1, limit = 50 } = req.query;
  const query = {};

  if (category) query.category = category;
  if (status) query.status = status;

  if (lowStock === 'true') {
    query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { itemId: { $regex: search, $options: 'i' } },
      { storageLocation: { $regex: search, $options: 'i' } },
    ];
  }

  const count = await InventoryItem.countDocuments(query);
  const items = await InventoryItem.find(query)
    .populate('supplier', 'companyName contactPerson phone')
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
    items,
  });
};

// @desc    Get single inventory item
// @route   GET /api/inventory/items/:id
// @access  Private
const getInventoryItemById = async (req, res) => {
  const item = await InventoryItem.findById(req.params.id).populate('supplier');
  if (!item) {
    return res.status(404).json({ success: false, message: 'Inventory item not found' });
  }

  const transactions = await InventoryTransaction.find({ inventoryItem: item._id })
    .populate('performedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, item, transactions });
};

// @desc    Create new inventory item
// @route   POST /api/inventory/items
// @access  Private (Admins, Inventory Staff)
const createInventoryItem = async (req, res) => {
  const { name, category, description, supplier, quantity, unit, unitPrice, reorderLevel, storageLocation, batchNumber, expiryDate } = req.body;

  const itemId = await generateUniqueId(InventoryItem, 'itemId', 'ITM-', 4);

  const item = await InventoryItem.create({
    itemId,
    name: name.trim(),
    category,
    description: description || '',
    supplier: supplier || null,
    quantity: Number(quantity) || 0,
    unit: unit || 'Units',
    unitPrice: Number(unitPrice) || 0,
    reorderLevel: Number(reorderLevel) || 10,
    storageLocation: storageLocation || 'Central Supply Room',
    batchNumber: batchNumber || '',
    expiryDate: expiryDate || null,
    status: Number(quantity) > 0 ? 'In Stock' : 'Out of Stock',
  });

  if (item.quantity > 0) {
    const txnId = await generateUniqueId(InventoryTransaction, 'transactionId', 'TXN-', 4);
    await InventoryTransaction.create({
      transactionId: txnId,
      itemType: 'InventoryItem',
      inventoryItem: item._id,
      transactionType: 'STOCK_IN',
      quantity: item.quantity,
      previousQuantity: 0,
      newQuantity: item.quantity,
      reason: 'Initial stock entry',
      performedBy: req.user._id,
    });
  }

  await logAudit(req, {
    action: 'CREATE_INVENTORY_ITEM',
    module: 'Inventory',
    recordId: item.itemId,
    details: `Added inventory item ${item.name} (${item.itemId})`,
  });

  res.status(201).json({ success: true, message: 'Inventory item created successfully', item });
};

// @desc    Update inventory item
// @route   PUT /api/inventory/items/:id
// @access  Private (Admins, Inventory Staff)
const updateInventoryItem = async (req, res) => {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Inventory item not found' });
  }

  const updatedItem = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  await logAudit(req, {
    action: 'UPDATE_INVENTORY_ITEM',
    module: 'Inventory',
    recordId: updatedItem.itemId,
    details: `Updated item ${updatedItem.name}`,
  });

  res.json({ success: true, message: 'Inventory item updated successfully', item: updatedItem });
};

// @desc    Adjust inventory item stock (Stock In, Stock Out, Damage, Adjustment)
// @route   POST /api/inventory/items/:id/adjust-stock
// @access  Private (Admins, Inventory Staff)
const adjustInventoryStock = async (req, res) => {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Inventory item not found' });
  }

  const { adjustmentType, quantity, reason, referenceNumber } = req.body;
  const numQty = Number(quantity);

  if (!numQty || numQty <= 0) {
    return res.status(400).json({ success: false, message: 'Adjustment quantity must be greater than 0' });
  }

  const prevStock = item.quantity;
  let newStock = prevStock;

  if (adjustmentType === 'STOCK_IN') {
    newStock = prevStock + numQty;
  } else if (adjustmentType === 'STOCK_OUT' || adjustmentType === 'DAMAGE' || adjustmentType === 'EXPIRED_REMOVAL') {
    newStock = Math.max(0, prevStock - numQty);
  } else if (adjustmentType === 'SET_EXACT') {
    newStock = numQty;
  }

  item.quantity = newStock;
  if (newStock === 0) {
    item.status = 'Out of Stock';
  } else if (newStock <= item.reorderLevel) {
    item.status = 'Low Stock';
  } else {
    item.status = 'In Stock';
  }
  await item.save();

  const txnId = await generateUniqueId(InventoryTransaction, 'transactionId', 'TXN-', 4);
  await InventoryTransaction.create({
    transactionId: txnId,
    itemType: 'InventoryItem',
    inventoryItem: item._id,
    transactionType: adjustmentType === 'SET_EXACT' ? 'ADJUSTMENT' : adjustmentType,
    quantity: Math.abs(newStock - prevStock),
    previousQuantity: prevStock,
    newQuantity: newStock,
    referenceNumber: referenceNumber || '',
    reason: reason || 'Stock adjustment',
    performedBy: req.user._id,
  });

  await logAudit(req, {
    action: 'ADJUST_INVENTORY_STOCK',
    module: 'Inventory',
    recordId: item.itemId,
    details: `Adjusted stock for ${item.name} from ${prevStock} to ${newStock} (${adjustmentType})`,
  });

  res.json({
    success: true,
    message: 'Inventory stock updated successfully',
    item,
  });
};

// @desc    Get all inventory transaction logs
// @route   GET /api/inventory/transactions
// @access  Private
const getInventoryTransactions = async (req, res) => {
  const { transactionType, page = 1, limit = 50 } = req.query;
  const query = {};

  if (transactionType) query.transactionType = transactionType;

  const count = await InventoryTransaction.countDocuments(query);
  const transactions = await InventoryTransaction.find(query)
    .populate('inventoryItem', 'name itemId category unit')
    .populate('medicine', 'name medicineId batchNumber')
    .populate('performedBy', 'firstName lastName role')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
    transactions,
  });
};

module.exports = {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  adjustInventoryStock,
  getInventoryTransactions,
};
