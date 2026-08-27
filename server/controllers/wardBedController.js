const Ward = require('../models/Ward');
const Bed = require('../models/Bed');
const { logAudit } = require('../middleware/auditMiddleware');
const { BED_STATUSES } = require('../config/constants');

// ==================== WARDS ====================

// @desc    Get all wards with bed occupancy counts
// @route   GET /api/wards
// @access  Private
const getWards = async (req, res) => {
  const wards = await Ward.find().sort({ floor: 1, name: 1 });

  // Compute occupancy per ward
  const beds = await Bed.find();
  const statsMap = {};

  beds.forEach((bed) => {
    const wardId = bed.ward.toString();
    if (!statsMap[wardId]) {
      statsMap[wardId] = { total: 0, available: 0, occupied: 0, reserved: 0, maintenance: 0 };
    }
    statsMap[wardId].total += 1;
    if (bed.status === BED_STATUSES.AVAILABLE) statsMap[wardId].available += 1;
    if (bed.status === BED_STATUSES.OCCUPIED) statsMap[wardId].occupied += 1;
    if (bed.status === BED_STATUSES.RESERVED) statsMap[wardId].reserved += 1;
    if (bed.status === BED_STATUSES.MAINTENANCE) statsMap[wardId].maintenance += 1;
  });

  const enrichedWards = wards.map((w) => {
    const obj = w.toObject();
    obj.bedStats = statsMap[w._id.toString()] || { total: 0, available: 0, occupied: 0, reserved: 0, maintenance: 0 };
    return obj;
  });

  res.json({ success: true, wards: enrichedWards });
};

// @desc    Create ward
// @route   POST /api/wards
// @access  Private (Admins)
const createWard = async (req, res) => {
  const { name, code, type, floor, capacity, chargePerDay, description, status } = req.body;

  const existing = await Ward.findOne({ code: code.toUpperCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Ward code already exists' });
  }

  const ward = await Ward.create({
    name,
    code: code.toUpperCase(),
    type,
    floor: floor || '2nd Floor',
    capacity: Number(capacity) || 10,
    chargePerDay: Number(chargePerDay) || 100,
    description: description || '',
    status: status || 'Active',
  });

  await logAudit(req, {
    action: 'CREATE_WARD',
    module: 'Admissions',
    recordId: ward.code,
    details: `Created ward ${ward.name} (${ward.code})`,
  });

  res.status(201).json({ success: true, message: 'Ward created successfully', ward });
};

// @desc    Update ward
// @route   PUT /api/wards/:id
// @access  Private (Admins)
const updateWard = async (req, res) => {
  const ward = await Ward.findById(req.params.id);
  if (!ward) {
    return res.status(404).json({ success: false, message: 'Ward not found' });
  }

  const updatedWard = await Ward.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  await logAudit(req, {
    action: 'UPDATE_WARD',
    module: 'Admissions',
    recordId: updatedWard.code,
    details: `Updated ward ${updatedWard.name}`,
  });

  res.json({ success: true, message: 'Ward updated successfully', ward: updatedWard });
};

// ==================== BEDS ====================

// @desc    Get all beds (filterable by ward, status)
// @route   GET /api/beds
// @access  Private
const getBeds = async (req, res) => {
  const { ward, status } = req.query;
  const query = {};

  if (ward) query.ward = ward;
  if (status) query.status = status;

  const beds = await Bed.find(query)
    .populate('ward', 'name code type chargePerDay floor')
    .populate('currentPatient', 'firstName lastName patientId phone gender age')
    .populate('currentAdmission')
    .sort({ ward: 1, bedNumber: 1 });

  res.json({ success: true, count: beds.length, beds });
};

// @desc    Create new bed
// @route   POST /api/beds
// @access  Private (Admins, Nurses)
const createBed = async (req, res) => {
  const { bedNumber, ward, status, features, notes } = req.body;

  const existing = await Bed.findOne({ bedNumber: bedNumber.trim(), ward });
  if (existing) {
    return res.status(400).json({ success: false, message: `Bed number '${bedNumber}' already exists in this ward` });
  }

  const bed = await Bed.create({
    bedNumber: bedNumber.trim(),
    ward,
    status: status || BED_STATUSES.AVAILABLE,
    features: features || [],
    notes: notes || '',
  });

  await logAudit(req, {
    action: 'CREATE_BED',
    module: 'Admissions',
    recordId: bed.bedNumber,
    details: `Created bed ${bed.bedNumber}`,
  });

  const populated = await Bed.findById(bed._id).populate('ward', 'name code type chargePerDay');

  res.status(201).json({ success: true, message: 'Bed created successfully', bed: populated });
};

// @desc    Update bed status / details
// @route   PUT /api/beds/:id
// @access  Private
const updateBed = async (req, res) => {
  const bed = await Bed.findById(req.params.id);
  if (!bed) {
    return res.status(404).json({ success: false, message: 'Bed not found' });
  }

  const { status, features, notes, bedNumber } = req.body;

  if (status) bed.status = status;
  if (features) bed.features = features;
  if (notes !== undefined) bed.notes = notes;
  if (bedNumber) bed.bedNumber = bedNumber;

  if (status === BED_STATUSES.AVAILABLE) {
    bed.currentPatient = null;
    bed.currentAdmission = null;
  }

  await bed.save();

  await logAudit(req, {
    action: 'UPDATE_BED',
    module: 'Admissions',
    recordId: bed.bedNumber,
    details: `Updated bed ${bed.bedNumber} status to ${bed.status}`,
  });

  const populated = await Bed.findById(bed._id)
    .populate('ward', 'name code type')
    .populate('currentPatient', 'firstName lastName patientId');

  res.json({ success: true, message: 'Bed updated successfully', bed: populated });
};

module.exports = {
  getWards,
  createWard,
  updateWard,
  getBeds,
  createBed,
  updateBed,
};
