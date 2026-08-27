const User = require('../models/User');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc    Get all users (with filters, search, pagination)
// @route   GET /api/users
// @access  Private (Super Admin, Hospital Admin)
const getUsers = async (req, res) => {
  const { search, role, status, page = 1, limit = 50 } = req.query;
  const query = {};

  if (role) query.role = role;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
    ];
  }

  const count = await User.countDocuments(query);
  const users = await User.find(query)
    .populate('department')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
    users,
  });
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).populate('department');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, user });
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Super Admin, Hospital Admin)
const createUser = async (req, res) => {
  const { username, email, password, role, firstName, lastName, phone, department, status } = req.body;

  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    return res.status(400).json({ success: false, message: 'Email is already registered' });
  }

  const existingUsername = await User.findOne({ username: username.trim() });
  if (existingUsername) {
    return res.status(400).json({ success: false, message: 'Username is already taken' });
  }

  const user = await User.create({
    username: username.trim(),
    email: email.toLowerCase().trim(),
    password,
    role,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone,
    department: department || null,
    status: status || 'Active',
  });

  await logAudit(req, {
    action: 'CREATE_USER',
    module: 'Users',
    recordId: user._id,
    details: `Created new user account: ${user.email} (${user.role})`,
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    user,
  });
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Super Admin, Hospital Admin)
const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const { firstName, lastName, phone, role, department, status, password } = req.body;

  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.phone = phone !== undefined ? phone : user.phone;
  user.role = role || user.role;
  user.department = department !== undefined ? (department || null) : user.department;
  user.status = status || user.status;

  if (password && password.trim().length >= 6) {
    user.password = password;
  }

  const updatedUser = await user.save();

  await logAudit(req, {
    action: 'UPDATE_USER',
    module: 'Users',
    recordId: user._id,
    details: `Updated user account: ${user.email}`,
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    user: updatedUser,
  });
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Super Admin)
const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own active account' });
  }

  await User.findByIdAndDelete(req.params.id);

  await logAudit(req, {
    action: 'DELETE_USER',
    module: 'Users',
    recordId: req.params.id,
    details: `Deleted user: ${user.email}`,
  });

  res.json({ success: true, message: 'User removed successfully' });
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
