const Supplier = require('../models/Supplier');
const Medicine = require('../models/Medicine');
const InventoryItem = require('../models/InventoryItem');
const { generateUniqueId } = require('../utils/generateId');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = async (req, res) => {
  const { search, status } = req.query;
  const query = {};

  if (status) query.status = status;
  if (search) {
    query.$or = [
      { companyName: { $regex: search, $options: 'i' } },
      { contactPerson: { $regex: search, $options: 'i' } },
      { supplierId: { $regex: search, $options: 'i' } },
    ];
  }

  const suppliers = await Supplier.find(query).sort({ companyName: 1 });
  res.json({ success: true, count: suppliers.length, suppliers });
};

// @desc    Get single supplier details with linked products
// @route   GET /api/suppliers/:id
// @access  Private
const getSupplierById = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) {
    return res.status(404).json({ success: false, message: 'Supplier not found' });
  }

  const [suppliedMedicines, suppliedItems] = await Promise.all([
    Medicine.find({ supplier: supplier._id }),
    InventoryItem.find({ supplier: supplier._id }),
  ]);

  res.json({
    success: true,
    supplier,
    suppliedMedicines,
    suppliedItems,
  });
};

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private (Admins)
const createSupplier = async (req, res) => {
  const { companyName, contactPerson, phone, email, address, taxIdentificationNumber, suppliedCategories, paymentTerms, rating, status } = req.body;

  const supplierId = await generateUniqueId(Supplier, 'supplierId', 'SUP-', 4);

  const supplier = await Supplier.create({
    supplierId,
    companyName: companyName.trim(),
    contactPerson: contactPerson.trim(),
    phone: phone.trim(),
    email: email ? email.trim().toLowerCase() : '',
    address: address || '',
    taxIdentificationNumber: taxIdentificationNumber || '',
    suppliedCategories: suppliedCategories || [],
    paymentTerms: paymentTerms || 'Net 30',
    rating: Number(rating) || 5,
    status: status || 'Active',
  });

  await logAudit(req, {
    action: 'CREATE_SUPPLIER',
    module: 'Inventory',
    recordId: supplier.supplierId,
    details: `Created supplier ${supplier.companyName} (${supplier.supplierId})`,
  });

  res.status(201).json({ success: true, message: 'Supplier added successfully', supplier });
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Admins)
const updateSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) {
    return res.status(404).json({ success: false, message: 'Supplier not found' });
  }

  const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  await logAudit(req, {
    action: 'UPDATE_SUPPLIER',
    module: 'Inventory',
    recordId: updated.supplierId,
    details: `Updated supplier ${updated.companyName}`,
  });

  res.json({ success: true, message: 'Supplier updated successfully', supplier: updated });
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
};
