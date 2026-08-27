const express = require('express');
const router = express.Router();
const {
  getLabTests,
  createLabTest,
  updateLabTest,
  getLabReports,
  getLabReportById,
  requestLabTest,
  updateLabReport,
} = require('../controllers/laboratoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

// Catalog
router
  .route('/tests')
  .get(getLabTests)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.LABORATORY_STAFF), createLabTest);

router
  .route('/tests/:id')
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.LABORATORY_STAFF), updateLabTest);

// Reports & Requests
router
  .route('/reports')
  .get(getLabReports)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.NURSE), requestLabTest);

router
  .route('/reports/:id')
  .get(getLabReportById)
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.LABORATORY_STAFF), updateLabReport);

module.exports = router;
