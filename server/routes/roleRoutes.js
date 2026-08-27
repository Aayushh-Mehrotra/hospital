const express = require('express');
const router = express.Router();
const { getRoles, updateRole } = require('../controllers/roleController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);
router.route('/').get(getRoles).post(authorize(ROLES.SUPER_ADMIN), updateRole);

module.exports = router;
