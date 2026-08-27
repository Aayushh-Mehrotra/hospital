const HospitalSettings = require('../models/HospitalSettings');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc    Get hospital settings
// @route   GET /api/settings
// @access  Public (or Private)
const getSettings = async (req, res) => {
  let settings = await HospitalSettings.findOne();
  if (!settings) {
    settings = await HospitalSettings.create({});
  }
  res.json({ success: true, settings });
};

// @desc    Update hospital settings
// @route   PUT /api/settings
// @access  Private (Super Admin, Hospital Admin)
const updateSettings = async (req, res) => {
  let settings = await HospitalSettings.findOne();
  if (!settings) {
    settings = await HospitalSettings.create(req.body);
  } else {
    settings = await HospitalSettings.findByIdAndUpdate(settings._id, req.body, {
      new: true,
      runValidators: true,
    });
  }

  await logAudit(req, {
    action: 'UPDATE_SETTINGS',
    module: 'Settings',
    recordId: settings._id,
    details: 'Updated hospital branding, contact, and billing configuration',
  });

  res.json({ success: true, message: 'Hospital settings saved successfully', settings });
};

module.exports = {
  getSettings,
  updateSettings,
};
