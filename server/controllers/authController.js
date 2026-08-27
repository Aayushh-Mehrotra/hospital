const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide both email and password' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password').populate('department');

  if (user && (await user.matchPassword(password))) {
    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Account is currently inactive or suspended. Please contact the administrator.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    await logAudit(req, {
      action: 'LOGIN',
      module: 'Auth',
      recordId: user._id,
      details: `User ${user.email} logged in successfully`,
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token: generateToken(user._id),
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        role: user.role,
        avatar: user.avatar,
        department: user.department,
        status: user.status,
      },
    });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('department');
  res.json({
    success: true,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      department: user.department,
      status: user.status,
      createdAt: user.createdAt,
    },
  });
};

// @desc    Update user profile / password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide both current and new passwords' });
  }

  const user = await User.findById(req.user._id).select('+password');

  if (user && (await user.matchPassword(currentPassword))) {
    user.password = newPassword;
    await user.save();

    await logAudit(req, {
      action: 'PASSWORD_CHANGE',
      module: 'Auth',
      recordId: user._id,
      details: 'Password updated successfully',
    });

    return res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid current password' });
  }
};

// @desc    Update user profile details
// @route   PUT /api/auth/update-profile
// @access  Private
const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
      },
    });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
};

module.exports = {
  loginUser,
  getMe,
  updatePassword,
  updateProfile,
};
