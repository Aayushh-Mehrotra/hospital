const Medicine = require('../models/Medicine');
const InventoryTransaction = require('../models/InventoryTransaction');
const { generateUniqueId } = require('../utils/generateId');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc    Get all medicines (filter by category, low stock, expiring, search)
// @route   GET /api/pharmacy/medicines
// @access  Private
const getMedicines = async (req, res) => {
  const { category, lowStock, expiringSoon, search, status, page = 1, limit = 50 } = req.query;
  const query = {};

  if (category) query.category = category;
  if (status) query.status = status;

  if (lowStock === 'true') {
    query.$expr = { $lte: ['$stockQuantity', '$reorderLevel'] };
  }

  if (expiringSoon === 'true') {
    const ninetyDaysLater = new Date();
    ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);
    query.expiryDate = { $lte: ninetyDaysLater };
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { genericName: { $regex: search, $options: 'i' } },
      { medicineId: { $regex: search, $options: 'i' } },
      { batchNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const count = await Medicine.countDocuments(query);
  const medicines = await Medicine.find(query)
    .populate('supplier', 'companyName contactPerson phone')
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
    medicines,
  });
};

// @desc    Get single medicine details
// @route   GET /api/pharmacy/medicines/:id
// @access  Private
const getMedicineById = async (req, res) => {
  const medicine = await Medicine.findById(req.params.id).populate('supplier');
  if (!medicine) {
    return res.status(404).json({ success: false, message: 'Medicine not found' });
  }

  // Get transaction history
  const transactions = await InventoryTransaction.find({ medicine: medicine._id })
    .populate('performedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, medicine, transactions });
};

// @desc    Create new medicine
// @route   POST /api/pharmacy/medicines
// @access  Private (Pharmacists, Admins)
const createMedicine = async (req, res) => {
  const {
    name,
    genericName,
    category,
    form,
    strength,
    supplier,
    batchNumber,
    manufacturingDate,
    expiryDate,
    purchasePrice,
    sellingPrice,
    stockQuantity,
    reorderLevel,
    unit,
    storageLocation,
    requiresPrescription,
    status,
  } = req.body;

  const medicineId = await generateUniqueId(Medicine, 'medicineId', 'MED-', 4);

  const medicine = await Medicine.create({
    medicineId,
    name: name.trim(),
    genericName: genericName.trim(),
    category,
    form: form || 'Tablet',
    strength: strength || '',
    supplier: supplier || null,
    batchNumber: batchNumber.trim(),
    manufacturingDate,
    expiryDate,
    purchasePrice: Number(purchasePrice) || 0,
    sellingPrice: Number(sellingPrice) || 0,
    stockQuantity: Number(stockQuantity) || 0,
    reorderLevel: Number(reorderLevel) || 20,
    unit: unit || 'Strips',
    storageLocation: storageLocation || 'Shelf A1',
    requiresPrescription: requiresPrescription !== undefined ? requiresPrescription : true,
    status: status || 'Active',
  });

  // Log initial stock transaction if quantity > 0
  if (medicine.stockQuantity > 0) {
    const txnId = await generateUniqueId(InventoryTransaction, 'transactionId', 'TXN-', 4);
    await InventoryTransaction.create({
      transactionId: txnId,
      itemType: 'Medicine',
      medicine: medicine._id,
      transactionType: 'STOCK_IN',
      quantity: medicine.stockQuantity,
      previousQuantity: 0,
      newQuantity: medicine.stockQuantity,
      referenceNumber: medicine.batchNumber,
      reason: 'Initial stock intake',
      performedBy: req.user._id,
    });
  }

  await logAudit(req, {
    action: 'CREATE_MEDICINE',
    module: 'Pharmacy',
    recordId: medicine.medicineId,
    details: `Added new medicine ${medicine.name} (${medicine.medicineId})`,
  });

  res.status(201).json({ success: true, message: 'Medicine added successfully', medicine });
};

// @desc    Update medicine info
// @route   PUT /api/pharmacy/medicines/:id
// @access  Private (Pharmacists, Admins)
const updateMedicine = async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) {
    return res.status(404).json({ success: false, message: 'Medicine not found' });
  }

  const updatedMed = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  await logAudit(req, {
    action: 'UPDATE_MEDICINE',
    module: 'Pharmacy',
    recordId: updatedMed.medicineId,
    details: `Updated medicine ${updatedMed.name}`,
  });

  res.json({ success: true, message: 'Medicine updated successfully', medicine: updatedMed });
};

// @desc    Adjust medicine stock
// @route   POST /api/pharmacy/medicines/:id/adjust-stock
// @access  Private (Pharmacists, Admins)
const adjustMedicineStock = async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) {
    return res.status(404).json({ success: false, message: 'Medicine not found' });
  }

  const { adjustmentType, quantity, reason, referenceNumber } = req.body;
  const numQty = Number(quantity);

  if (!numQty || numQty <= 0) {
    return res.status(400).json({ success: false, message: 'Adjustment quantity must be greater than 0' });
  }

  const prevStock = medicine.stockQuantity;
  let newStock = prevStock;

  if (adjustmentType === 'STOCK_IN') {
    newStock = prevStock + numQty;
  } else if (adjustmentType === 'STOCK_OUT' || adjustmentType === 'DAMAGE' || adjustmentType === 'EXPIRED_REMOVAL') {
    newStock = Math.max(0, prevStock - numQty);
  } else if (adjustmentType === 'SET_EXACT') {
    newStock = numQty;
  }

  medicine.stockQuantity = newStock;
  if (newStock === 0) {
    medicine.status = 'Out of Stock';
  } else if (medicine.status === 'Out of Stock' && newStock > 0) {
    medicine.status = 'Active';
  }
  await medicine.save();

  const txnId = await generateUniqueId(InventoryTransaction, 'transactionId', 'TXN-', 4);
  await InventoryTransaction.create({
    transactionId: txnId,
    itemType: 'Medicine',
    medicine: medicine._id,
    transactionType: adjustmentType === 'SET_EXACT' ? 'ADJUSTMENT' : adjustmentType,
    quantity: Math.abs(newStock - prevStock),
    previousQuantity: prevStock,
    newQuantity: newStock,
    referenceNumber: referenceNumber || '',
    reason: reason || 'Manual stock adjustment',
    performedBy: req.user._id,
  });

  await logAudit(req, {
    action: 'ADJUST_MEDICINE_STOCK',
    module: 'Pharmacy',
    recordId: medicine.medicineId,
    details: `Adjusted stock for ${medicine.name} from ${prevStock} to ${newStock} (${adjustmentType})`,
  });

  res.json({
    success: true,
    message: 'Stock updated successfully',
    medicine,
  });
};

// @desc    Delete medicine
// @route   DELETE /api/pharmacy/medicines/:id
// @access  Private (Admins)
const deleteMedicine = async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) {
    return res.status(404).json({ success: false, message: 'Medicine not found' });
  }

  await Medicine.findByIdAndDelete(req.params.id);

  await logAudit(req, {
    action: 'DELETE_MEDICINE',
    module: 'Pharmacy',
    recordId: medicine.medicineId,
    details: `Deleted medicine ${medicine.name}`,
  });

  res.json({ success: true, message: 'Medicine removed successfully' });
};

module.exports = {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  adjustMedicineStock,
  deleteMedicine,
};
