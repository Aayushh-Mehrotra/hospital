const AuditLog = require('../models/AuditLog');

// @desc    Get audit logs (filterable by module, action, user, date range)
// @route   GET /api/audit-logs
// @access  Private (Super Admin, Hospital Admin)
const getAuditLogs = async (req, res) => {
  const { module, action, user, startDate, endDate, search, page = 1, limit = 50 } = req.query;
  const query = {};

  if (module) query.module = module;
  if (action) query.action = action;
  if (user) query.user = user;

  if (startDate && endDate) {
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  if (search) {
    query.$or = [
      { details: { $regex: search, $options: 'i' } },
      { userName: { $regex: search, $options: 'i' } },
      { recordId: { $regex: search, $options: 'i' } },
    ];
  }

  const count = await AuditLog.countDocuments(query);
  const logs = await AuditLog.find(query)
    .populate('user', 'firstName lastName email role')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
    auditLogs: logs,
    logs,
  });
};

module.exports = {
  getAuditLogs,
};
