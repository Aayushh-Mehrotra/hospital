const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res) => {
  const departments = await Department.find()
    .populate({
      path: 'headDoctor',
      populate: { path: 'user', select: 'firstName lastName email' },
    })
    .sort({ name: 1 });

  // Get doctor count per department
  const doctorCounts = await Doctor.aggregate([
    { $match: { status: 'Active' } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  doctorCounts.forEach((d) => {
    countMap[d._id.toString()] = d.count;
  });

  const enrichedDepartments = departments.map((dept) => {
    const obj = dept.toObject();
    obj.doctorCount = countMap[dept._id.toString()] || 0;
    return obj;
  });

  res.json({ success: true, departments: enrichedDepartments });
};

// @desc    Get department by ID
// @route   GET /api/departments/:id
// @access  Private
const getDepartmentById = async (req, res) => {
  const department = await Department.findById(req.params.id).populate({
    path: 'headDoctor',
    populate: { path: 'user', select: 'firstName lastName email' },
  });

  if (!department) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }

  const doctors = await Doctor.find({ department: department._id }).populate('user', 'firstName lastName email phone avatar');

  res.json({
    success: true,
    department,
    doctors,
  });
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private (Admins)
const createDepartment = async (req, res) => {
  const { name, code, description, headDoctor, floor, contactPhone, contactEmail, icon, status } = req.body;

  const existingCode = await Department.findOne({ code: code.toUpperCase() });
  if (existingCode) {
    return res.status(400).json({ success: false, message: 'Department code already exists' });
  }

  const department = await Department.create({
    name,
    code: code.toUpperCase(),
    description: description || '',
    headDoctor: headDoctor || null,
    floor: floor || '1st Floor',
    contactPhone: contactPhone || '',
    contactEmail: contactEmail || '',
    icon: icon || 'Heart',
    status: status || 'Active',
  });

  await logAudit(req, {
    action: 'CREATE_DEPARTMENT',
    module: 'Departments',
    recordId: department._id,
    details: `Created department ${department.name} (${department.code})`,
  });

  res.status(201).json({ success: true, message: 'Department created successfully', department });
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admins)
const updateDepartment = async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }

  const updatedDept = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  await logAudit(req, {
    action: 'UPDATE_DEPARTMENT',
    module: 'Departments',
    recordId: updatedDept._id,
    details: `Updated department ${updatedDept.name}`,
  });

  res.json({ success: true, message: 'Department updated successfully', department: updatedDept });
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Super Admin)
const deleteDepartment = async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }

  const doctorCount = await Doctor.countDocuments({ department: department._id });
  if (doctorCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete department with ${doctorCount} assigned doctor(s). Reassign them first.`,
    });
  }

  await Department.findByIdAndDelete(req.params.id);

  await logAudit(req, {
    action: 'DELETE_DEPARTMENT',
    module: 'Departments',
    recordId: department._id,
    details: `Deleted department ${department.name}`,
  });

  res.json({ success: true, message: 'Department removed successfully' });
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
