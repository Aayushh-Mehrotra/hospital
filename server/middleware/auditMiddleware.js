const AuditLog = require('../models/AuditLog');

const logAudit = async (req, { action, module, recordId, details }) => {
  try {
    const user = req.user;
    await AuditLog.create({
      user: user ? user._id : null,
      userName: user ? `${user.firstName} ${user.lastName}` : 'System / Guest',
      userRole: user ? user.role : 'System',
      action,
      module,
      recordId: recordId ? String(recordId) : '',
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
    });
  } catch (err) {
    console.error('Audit logging error:', err.message);
  }
};

module.exports = { logAudit };
