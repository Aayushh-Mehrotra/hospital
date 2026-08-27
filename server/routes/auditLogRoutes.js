const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);
router.get('/', authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), getAuditLogs);

module.exports = router;
