const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.get('/', getSettings);
router.put('/', protect, authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), updateSettings);

module.exports = router;
