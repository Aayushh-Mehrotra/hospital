const Role = require('../models/Role');
const { ROLES } = require('../config/constants');

// @desc    Get all system roles and permissions
// @route   GET /api/roles
// @access  Private
const getRoles = async (req, res) => {
  let roles = await Role.find().sort({ name: 1 });

  // If no custom roles in DB, return standard system roles
  if (!roles || roles.length === 0) {
    const defaultRolesList = Object.values(ROLES).map((roleName) => ({
      name: roleName,
      displayName: roleName,
      description: `Default system role for ${roleName}`,
      isSystemRole: true,
      permissions: [
        { module: 'Patients', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'Appointments', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'Billing', actions: ['create', 'read', 'update'] },
        { module: 'Pharmacy', actions: ['read', 'update'] },
        { module: 'Laboratory', actions: ['read', 'update'] },
      ],
    }));
    return res.json({ success: true, roles: defaultRolesList });
  }

  res.json({ success: true, roles });
};

// @desc    Create / Update role permissions
// @route   POST /api/roles
// @access  Private (Super Admin)
const updateRole = async (req, res) => {
  const { name, displayName, description, permissions } = req.body;

  let role = await Role.findOne({ name });
  if (role) {
    role.displayName = displayName || role.displayName;
    role.description = description || role.description;
    role.permissions = permissions || role.permissions;
    await role.save();
  } else {
    role = await Role.create({
      name,
      displayName: displayName || name,
      description: description || '',
      permissions: permissions || [],
      isSystemRole: false,
    });
  }

  res.json({ success: true, message: 'Role saved successfully', role });
};

module.exports = {
  getRoles,
  updateRole,
};
